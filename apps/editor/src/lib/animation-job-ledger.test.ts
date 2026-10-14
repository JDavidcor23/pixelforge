import { describe, expect, it, vi } from 'vitest'

import {
  appendLedgerEntry,
  buildAnimationAsset,
  canRemoveLedgerEntry,
  findLedgerEntry,
  ledgerEntryStateMessage,
  pruneLedger,
  recoverAnimationJob,
  recoverNoticeFor,
  rememberSyncedJobIds,
  removeLedgerEntry,
  runRecoverPass,
  selectAutoRecoverJobIds,
  selectUnfinishedEntries,
  updateLedgerEntry,
} from './animation-job-ledger'
import type { AnimationRecoverDeps, LedgerEntryPatch, NewLedgerEntry } from './animation-job-ledger'
import {
  ANIMATION_RECOVER_FAILED_PREFIX,
  ANIMATION_RECOVER_PROCESSING_STATE,
  ANIMATION_RECOVER_SUCCESS_NOTICE,
  ANIMATION_RECOVER_UNREACHABLE_STATE,
} from '@/constants/animation'
import { ANIMATION_JOB_LEDGER_SETTLED_LIMIT } from '@/constants/persistence'
import type { AnimationJobLedgerEntry, AnimationJobLedgerStatus, AnimationJobStatus } from '@/types'

const GENERIC = 'generic failure'

const newEntry = (jobId: string, submittedAt = 1): NewLedgerEntry => ({
  jobId,
  submittedAt,
  label: 'Walk',
  assetType: 'character',
  frameCount: 8,
  canvasSize: { width: 64, height: 64 },
})

const entryWith = (jobId: string, status: AnimationJobLedgerStatus, submittedAt = 1): AnimationJobLedgerEntry => ({
  ...appendLedgerEntry([], newEntry(jobId, submittedAt))[0]!,
  status,
})

const jobStatus = (status: AnimationJobStatus['status'], extra: Partial<AnimationJobStatus> = {}): AnimationJobStatus => ({
  status,
  frames: [],
  error: null,
  costUsd: null,
  ...extra,
})

/** In-memory ledger + fakes, so `recoverAnimationJob` runs with no store, React or network. */
const makeDeps = (initial: AnimationJobLedgerEntry[], poll: AnimationRecoverDeps['poll']) => {
  let entries = initial
  const inFlight = new Set<string>()
  const save = vi.fn(async () => 'anim-1')
  const deps: AnimationRecoverDeps = {
    getEntry: (jobId) => findLedgerEntry(entries, jobId),
    claim: (jobId) => (inFlight.has(jobId) ? false : (inFlight.add(jobId), true)),
    release: (jobId) => void inFlight.delete(jobId),
    poll,
    save,
    update: (jobId: string, patch: LedgerEntryPatch) => {
      entries = updateLedgerEntry(entries, jobId, patch)
    },
    now: () => 42,
    genericError: GENERIC,
  }
  return { deps, save, inFlight, entries: () => entries }
}

describe('animation job ledger', () => {
  it('records a submitted job as pending with every field', () => {
    const [entry] = appendLedgerEntry([], newEntry('job-1'))
    expect(entry).toMatchObject({
      jobId: 'job-1',
      status: 'pending',
      frameCount: 8,
      canvasSize: { width: 64, height: 64 },
      animationId: null,
    })
  })

  it('never duplicates a job id', () => {
    const once = appendLedgerEntry([], newEntry('job-1'))
    expect(appendLedgerEntry(once, newEntry('job-1'))).toHaveLength(1)
  })

  it('marks completed with the animation id, and discarded instead of deleting', () => {
    const entries = appendLedgerEntry(appendLedgerEntry([], newEntry('a')), newEntry('b'))
    const next = updateLedgerEntry(
      updateLedgerEntry(entries, 'a', { status: 'completed', animationId: 'anim-a' }),
      'b',
      { status: 'discarded' },
    )
    expect(findLedgerEntry(next, 'a')).toMatchObject({ status: 'completed', animationId: 'anim-a' })
    expect(findLedgerEntry(next, 'b')?.status).toBe('discarded')
  })

  it('does not let a saved entry change status (frames already in Assets)', () => {
    const saved = [entryWith('a', 'recovered')]
    expect(findLedgerEntry(updateLedgerEntry(saved, 'a', { status: 'discarded' }), 'a')?.status).toBe('recovered')
  })

  it('prunes only settled entries beyond the limit, never unfinished ones', () => {
    const settled = Array.from({ length: ANIMATION_JOB_LEDGER_SETTLED_LIMIT + 5 }, (_, i) =>
      entryWith(`done-${i}`, 'completed', i + 100),
    )
    const oldPending = entryWith('old-pending', 'pending', 0)
    const oldDiscarded = entryWith('old-discarded', 'discarded', 0)
    const pruned = pruneLedger([...settled, oldPending, oldDiscarded])
    expect(pruned.filter((e) => e.status === 'completed')).toHaveLength(ANIMATION_JOB_LEDGER_SETTLED_LIMIT)
    expect(findLedgerEntry(pruned, 'old-pending')).toBeDefined()
    expect(findLedgerEntry(pruned, 'old-discarded')).toBeDefined()
  })

  it('lists pending and discarded entries, newest first, without the active job', () => {
    const entries = [
      entryWith('done', 'completed', 5),
      entryWith('failed', 'failed', 6),
      entryWith('old', 'pending', 1),
      entryWith('new', 'discarded', 9),
      entryWith('active', 'pending', 10),
    ]
    expect(selectUnfinishedEntries(entries, 'active').map((e) => e.jobId)).toEqual(['new', 'old'])
  })

  it('auto-recovers only pending entries, never discarded or active', () => {
    const entries = [entryWith('p', 'pending'), entryWith('d', 'discarded'), entryWith('active', 'pending')]
    expect(selectAutoRecoverJobIds(entries, 'active')).toEqual(['p'])
  })

  it('builds the Assets entry from the job metadata', () => {
    const asset = buildAnimationAsset({ label: 'Walk', assetType: 'object' }, ['f1', 'f2'], 'id-1', 7)
    expect(asset).toMatchObject({ id: 'id-1', label: 'Walk', assetType: 'object', frames: ['f1', 'f2'], timestamp: 7 })
  })

  it('describes the last check of an unfinished entry', () => {
    expect(ledgerEntryStateMessage(entryWith('a', 'pending'))).toBeNull()
    expect(ledgerEntryStateMessage({ ...entryWith('a', 'pending'), lastState: 'processing' })).toBe(
      ANIMATION_RECOVER_PROCESSING_STATE,
    )
    expect(ledgerEntryStateMessage({ ...entryWith('a', 'pending'), lastCheckUnreachable: true })).toBe(
      ANIMATION_RECOVER_UNREACHABLE_STATE,
    )
  })

  it('turns settling outcomes into notices', () => {
    expect(recoverNoticeFor({ kind: 'recovered', animationId: 'x' })).toEqual({
      tone: 'success',
      message: ANIMATION_RECOVER_SUCCESS_NOTICE,
    })
    expect(recoverNoticeFor({ kind: 'failed', error: 'nope' })).toEqual({
      tone: 'failed',
      message: `${ANIMATION_RECOVER_FAILED_PREFIX}nope`,
    })
    expect(recoverNoticeFor({ kind: 'running', state: 'queued' })).toBeNull()
  })
})

describe('recoverAnimationJob', () => {
  it('saves a completed job to Assets and marks it recovered', async () => {
    const { deps, save, entries } = makeDeps([entryWith('a', 'discarded')], async () =>
      jobStatus('completed', { frames: ['f1'] }),
    )
    expect(await recoverAnimationJob('a', deps)).toEqual({ kind: 'recovered', animationId: 'anim-1' })
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ jobId: 'a' }), ['f1'])
    expect(findLedgerEntry(entries(), 'a')).toMatchObject({ status: 'recovered', animationId: 'anim-1' })
  })

  it('keeps a still-running job and records its state', async () => {
    const { deps, save, entries } = makeDeps([entryWith('a', 'pending')], async () => jobStatus('processing'))
    expect(await recoverAnimationJob('a', deps)).toEqual({ kind: 'running', state: 'processing' })
    expect(save).not.toHaveBeenCalled()
    expect(findLedgerEntry(entries(), 'a')).toMatchObject({ status: 'pending', lastState: 'processing', lastCheckedAt: 42 })
  })

  it('marks an upstream failure as failed with the reason', async () => {
    const { deps, entries } = makeDeps([entryWith('a', 'pending')], async () => jobStatus('failed', { error: 'bad' }))
    expect(await recoverAnimationJob('a', deps)).toEqual({ kind: 'failed', error: 'bad' })
    expect(findLedgerEntry(entries(), 'a')).toMatchObject({ status: 'failed', error: 'bad' })
  })

  it('falls back to the generic reason when PixelLab sends none', async () => {
    const { deps } = makeDeps([entryWith('a', 'pending')], async () => jobStatus('failed'))
    expect(await recoverAnimationJob('a', deps)).toEqual({ kind: 'failed', error: GENERIC })
  })

  it('keeps the entry when PixelLab cannot be reached', async () => {
    const { deps, entries, inFlight } = makeDeps([entryWith('a', 'pending')], async () => {
      throw new Error('offline')
    })
    expect(await recoverAnimationJob('a', deps)).toEqual({ kind: 'unreachable' })
    expect(findLedgerEntry(entries(), 'a')).toMatchObject({ status: 'pending', lastCheckUnreachable: true })
    expect(inFlight.size).toBe(0)
  })

  it('skips an entry already saved, without polling', async () => {
    const poll = vi.fn(async () => jobStatus('completed', { frames: ['f1'] }))
    const { deps, save } = makeDeps([entryWith('a', 'completed')], poll)
    expect(await recoverAnimationJob('a', deps)).toEqual({ kind: 'skipped' })
    expect(poll).not.toHaveBeenCalled()
    expect(save).not.toHaveBeenCalled()
  })

  it('never runs two checks of the same job at once', async () => {
    let resolvePoll: (status: AnimationJobStatus) => void = () => {}
    const poll = vi.fn(() => new Promise<AnimationJobStatus>((resolve) => (resolvePoll = resolve)))
    const { deps, save } = makeDeps([entryWith('a', 'pending')], poll)
    const first = recoverAnimationJob('a', deps)
    expect(await recoverAnimationJob('a', deps)).toEqual({ kind: 'skipped' })
    resolvePoll(jobStatus('completed', { frames: ['f1'] }))
    await first
    expect(poll).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('does not save when the normal loop completed the job during the poll', async () => {
    const holder: { deps?: AnimationRecoverDeps } = {}
    const { deps, save } = makeDeps([entryWith('a', 'pending')], async () => {
      holder.deps?.update('a', { status: 'completed', animationId: 'from-loop' })
      return jobStatus('completed', { frames: ['f1'] })
    })
    holder.deps = deps
    expect(await recoverAnimationJob('a', deps)).toEqual({ kind: 'skipped' })
    expect(save).not.toHaveBeenCalled()
  })

  it('runs one sequential pass over several jobs', async () => {
    const order: string[] = []
    const { deps } = makeDeps([entryWith('a', 'pending'), entryWith('b', 'pending')], async (jobId) => {
      order.push(jobId)
      return jobStatus('queued')
    })
    const outcomes = await runRecoverPass(['a', 'b'], deps)
    expect(order).toEqual(['a', 'b'])
    expect(outcomes.map((o) => o.kind)).toEqual(['running', 'running'])
  })
})

describe('removeLedgerEntry / canRemoveLedgerEntry', () => {
  it('drops an unfinished entry but never a saved one', () => {
    const entries = [entryWith('a', 'pending'), entryWith('b', 'completed'), entryWith('c', 'discarded')]
    expect(removeLedgerEntry(entries, 'a').map((e) => e.jobId)).toEqual(['b', 'c'])
    expect(removeLedgerEntry(entries, 'b').map((e) => e.jobId)).toEqual(['a', 'b', 'c'])
    expect(removeLedgerEntry(entries, 'missing')).toHaveLength(3)
  })

  it('offers Remove only after a Recover check could not reach the job', () => {
    expect(canRemoveLedgerEntry(entryWith('a', 'pending'))).toBe(false)
    expect(canRemoveLedgerEntry({ ...entryWith('a', 'pending'), lastCheckUnreachable: true })).toBe(true)
    expect(canRemoveLedgerEntry({ ...entryWith('a', 'discarded'), lastCheckUnreachable: true })).toBe(true)
    expect(canRemoveLedgerEntry({ ...entryWith('a', 'recovered'), lastCheckUnreachable: true })).toBe(false)
  })
})

describe('rememberSyncedJobIds', () => {
  it('puts new ids first, drops duplicates and caps the list', () => {
    expect(rememberSyncedJobIds(['a', 'b'], ['c', 'a'], 10)).toEqual(['c', 'a', 'b'])
    expect(rememberSyncedJobIds(['a', 'b', 'c'], ['d'], 2)).toEqual(['d', 'a'])
  })
})

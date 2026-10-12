import { ANIMATION_PIPELINE_VERSION, SPRITE_ANIMATION } from '@/constants'
import {
  ANIMATION_RECOVER_FAILED_PREFIX,
  ANIMATION_RECOVER_PROCESSING_STATE,
  ANIMATION_RECOVER_QUEUED_STATE,
  ANIMATION_RECOVER_SUCCESS_NOTICE,
  ANIMATION_RECOVER_UNREACHABLE_STATE,
} from '@/constants/animation'
import { ANIMATION_JOB_LEDGER_SETTLED_LIMIT } from '@/constants/persistence'
import type {
  AIAnimation,
  AnimationRecoverNotice,
  AnimationJobLedgerEntry,
  AnimationJobLedgerStatus,
  AnimationJobStatus,
  AnimationRecoverOutcome,
  AssetType,
} from '@/types'

/**
 * Pure logic of the animation job ledger. The store (`animation-job-ledger.store.ts`)
 * only persists what these functions return, so every rule here is testable in Node.
 */

export interface NewLedgerEntry {
  readonly jobId: string
  readonly submittedAt: number
  readonly label: string
  readonly assetType: AssetType
  readonly frameCount: number | null
  readonly canvasSize: { readonly width: number; readonly height: number } | null
}

/** Statuses whose frames already reached the Assets library — never saved twice. */
const SAVED_STATUSES: readonly AnimationJobLedgerStatus[] = ['completed', 'recovered']
/** Statuses that are final upstream: nothing left to collect. */
const SETTLED_STATUSES: readonly AnimationJobLedgerStatus[] = ['completed', 'recovered', 'failed']
/** Statuses the "Unfinished jobs" list shows: a paid job whose frames may still be collectable. */
const UNFINISHED_STATUSES: readonly AnimationJobLedgerStatus[] = ['pending', 'discarded']

export const isLedgerEntrySaved = (entry: AnimationJobLedgerEntry | undefined): boolean =>
  entry !== undefined && SAVED_STATUSES.includes(entry.status)

export const isLedgerEntryUnfinished = (entry: AnimationJobLedgerEntry): boolean =>
  UNFINISHED_STATUSES.includes(entry.status)

export const findLedgerEntry = (
  entries: readonly AnimationJobLedgerEntry[],
  jobId: string,
): AnimationJobLedgerEntry | undefined => entries.find((entry) => entry.jobId === jobId)

/**
 * Keeps every unfinished entry and at most `ANIMATION_JOB_LEDGER_SETTLED_LIMIT`
 * settled ones (newest first). An unfinished entry is NEVER pruned.
 */
export const pruneLedger = (entries: readonly AnimationJobLedgerEntry[]): AnimationJobLedgerEntry[] => {
  const newestFirst = [...entries].sort((a, b) => b.submittedAt - a.submittedAt)
  let settledKept = 0
  return newestFirst.filter((entry) => {
    if (!SETTLED_STATUSES.includes(entry.status)) return true
    settledKept += 1
    return settledKept <= ANIMATION_JOB_LEDGER_SETTLED_LIMIT
  })
}

/** Adds a freshly submitted job as `pending`. A job id already in the ledger is left untouched. */
export const appendLedgerEntry = (
  entries: readonly AnimationJobLedgerEntry[],
  next: NewLedgerEntry,
): AnimationJobLedgerEntry[] => {
  if (findLedgerEntry(entries, next.jobId)) return [...entries]
  const entry: AnimationJobLedgerEntry = {
    ...next,
    status: 'pending',
    animationId: null,
    error: null,
    lastState: null,
    lastCheckedAt: null,
    lastCheckUnreachable: false,
  }
  return pruneLedger([entry, ...entries])
}

export type LedgerEntryPatch = Partial<Omit<AnimationJobLedgerEntry, 'jobId' | 'submittedAt'>>

/**
 * Patches one entry. A saved entry (completed/recovered) can no longer change
 * status — a late "discard" or "failed" must not hide frames already in Assets.
 */
export const updateLedgerEntry = (
  entries: readonly AnimationJobLedgerEntry[],
  jobId: string,
  patch: LedgerEntryPatch,
): AnimationJobLedgerEntry[] =>
  pruneLedger(
    entries.map((entry) => {
      if (entry.jobId !== jobId) return entry
      if (isLedgerEntrySaved(entry) && patch.status !== undefined && patch.status !== entry.status) return entry
      return { ...entry, ...patch }
    }),
  )

/**
 * Drops one entry for good — only the Animate tab's "Remove" on a job PixelLab
 * no longer recognizes or cannot be reached (owner-approved). Saved entries are
 * kept: they are the record that a job's frames already reached Assets.
 */
export const removeLedgerEntry = (
  entries: readonly AnimationJobLedgerEntry[],
  jobId: string,
): AnimationJobLedgerEntry[] => entries.filter((entry) => entry.jobId !== jobId || isLedgerEntrySaved(entry))

/** "Remove" is offered only after a Recover check failed to reach the job (unknown id or PixelLab down). */
export const canRemoveLedgerEntry = (entry: AnimationJobLedgerEntry): boolean =>
  isLedgerEntryUnfinished(entry) && entry.lastCheckUnreachable

/** Adds job ids to the "already synced from the server" list: newest first, no duplicates, capped. */
export const rememberSyncedJobIds = (
  synced: readonly string[],
  jobIds: readonly string[],
  limit: number,
): string[] => [...new Set([...jobIds, ...synced])].slice(0, limit)

/** Entries the Animate tab lists as unfinished, newest first, minus the job a polling loop already owns. */
export const selectUnfinishedEntries = (
  entries: readonly AnimationJobLedgerEntry[],
  activeJobId: string | null,
): AnimationJobLedgerEntry[] =>
  entries
    .filter((entry) => isLedgerEntryUnfinished(entry) && entry.jobId !== activeJobId)
    .sort((a, b) => b.submittedAt - a.submittedAt)

/** Job ids the one-shot app-load pass should check: only `pending`, never the active job. */
export const selectAutoRecoverJobIds = (
  entries: readonly AnimationJobLedgerEntry[],
  activeJobId: string | null,
): string[] =>
  entries.filter((entry) => entry.status === 'pending' && entry.jobId !== activeJobId).map((entry) => entry.jobId)

/**
 * The Assets library entry for a finished job's frames — one builder for the
 * normal completion and every Recover, so both save the exact same shape.
 * Frames arrive as PNG data URIs at the canvas size, input frame already dropped.
 */
export const buildAnimationAsset = (
  job: { readonly label: string; readonly assetType: AssetType },
  frames: readonly string[],
  id: string,
  timestamp: number,
): AIAnimation => ({
  pipelineVersion: ANIMATION_PIPELINE_VERSION,
  id,
  label: job.label,
  frames,
  frameDurationMs: SPRITE_ANIMATION.DEFAULT_FRAME_DURATION_MS,
  timestamp,
  assetType: job.assetType,
})

/** What the last Recover check found for a still-unfinished entry, or null before any check. */
export const ledgerEntryStateMessage = (entry: AnimationJobLedgerEntry): string | null => {
  if (entry.lastCheckUnreachable) return ANIMATION_RECOVER_UNREACHABLE_STATE
  if (entry.lastState === 'queued') return ANIMATION_RECOVER_QUEUED_STATE
  if (entry.lastState === 'processing') return ANIMATION_RECOVER_PROCESSING_STATE
  return null
}

/** Notice for a Recover that settled the job; null when the row itself shows the result. */
export const recoverNoticeFor = (outcome: AnimationRecoverOutcome): AnimationRecoverNotice | null => {
  if (outcome.kind === 'recovered') return { tone: 'success', message: ANIMATION_RECOVER_SUCCESS_NOTICE }
  if (outcome.kind === 'failed') return { tone: 'failed', message: `${ANIMATION_RECOVER_FAILED_PREFIX}${outcome.error}` }
  return null
}

// ── Recover ─────────────────────────────────────────────────────────────────

/** Everything a Recover touches is injected, so it runs in Node without React, timers or a network. */
export interface AnimationRecoverDeps {
  readonly getEntry: (jobId: string) => AnimationJobLedgerEntry | undefined
  /** False when another check of this job is already in flight. */
  readonly claim: (jobId: string) => boolean
  readonly release: (jobId: string) => void
  readonly poll: (jobId: string) => Promise<AnimationJobStatus>
  /** Saves the frames to the Assets library (same path as a normal completion) and returns the animation id. */
  readonly save: (entry: AnimationJobLedgerEntry, frames: readonly string[]) => Promise<string>
  readonly update: (jobId: string, patch: LedgerEntryPatch) => void
  readonly now: () => number
  readonly genericError: string
}

/**
 * Polls ONE time and settles the entry from the answer (never loops):
 * completed → saved + `recovered`; running → state recorded, status kept;
 * failed upstream → `failed` with the reason; poll throws → status kept,
 * marked unreachable. An entry already saved is skipped, so a job is never
 * added to Assets twice.
 */
export const recoverAnimationJob = async (
  jobId: string,
  deps: AnimationRecoverDeps,
): Promise<AnimationRecoverOutcome> => {
  if (isLedgerEntrySaved(deps.getEntry(jobId)) || !deps.claim(jobId)) return { kind: 'skipped' }
  try {
    let job: AnimationJobStatus
    try {
      job = await deps.poll(jobId)
    } catch {
      deps.update(jobId, { lastCheckedAt: deps.now(), lastCheckUnreachable: true })
      return { kind: 'unreachable' }
    }

    if (job.status === 'completed') {
      const entry = deps.getEntry(jobId)
      // Re-check after the await: the normal loop may have saved it meanwhile.
      if (!entry || isLedgerEntrySaved(entry)) return { kind: 'skipped' }
      const animationId = await deps.save(entry, job.frames)
      deps.update(jobId, {
        status: 'recovered',
        animationId,
        error: null,
        lastState: null,
        lastCheckedAt: deps.now(),
        lastCheckUnreachable: false,
      })
      return { kind: 'recovered', animationId }
    }

    if (job.status === 'failed') {
      const error = job.error ?? deps.genericError
      deps.update(jobId, { status: 'failed', error, lastCheckedAt: deps.now(), lastCheckUnreachable: false })
      return { kind: 'failed', error }
    }

    deps.update(jobId, { lastState: job.status, lastCheckedAt: deps.now(), lastCheckUnreachable: false })
    return { kind: 'running', state: job.status }
  } finally {
    deps.release(jobId)
  }
}

/** One sequential pass over `jobIds` (the free tier allows one PixelLab request at a time). */
export const runRecoverPass = async (
  jobIds: readonly string[],
  deps: AnimationRecoverDeps,
): Promise<AnimationRecoverOutcome[]> => {
  const outcomes: AnimationRecoverOutcome[] = []
  for (const jobId of jobIds) outcomes.push(await recoverAnimationJob(jobId, deps))
  return outcomes
}

import { describe, expect, it, vi } from 'vitest'

import {
  buildServerAnimationAsset,
  planServerAnimationSync,
  pngBytesToDataUri,
  serverFramePath,
  syncServerAnimations,
  toAssetType,
} from './server-animation-sync'
import type { ServerAnimationSyncDeps, ServerAnimationSyncState } from './server-animation-sync'
import { appendLedgerEntry, updateLedgerEntry } from './animation-job-ledger'
import type { LedgerEntryPatch } from './animation-job-ledger'
import type { AIAnimation, AnimationJobLedgerEntry, ServerAnimationJob } from '@/types'

const job = (providerJobId: string, assetId = `asset-${providerJobId}`): ServerAnimationJob => ({
  providerJobId,
  assetId,
  label: 'Walk',
  assetType: 'character',
  filePath: `user/animations/${assetId}/`,
  frameCount: 2,
  frameDurationMs: 120,
  createdAt: 1000,
})

const pendingEntry = (jobId: string): AnimationJobLedgerEntry =>
  appendLedgerEntry([], {
    jobId,
    submittedAt: 1,
    label: 'Walk',
    assetType: 'character',
    frameCount: 8,
    canvasSize: { width: 64, height: 64 },
  })[0]!

const emptyState: ServerAnimationSyncState = {
  ledgerEntries: [],
  localAnimationIds: new Set(),
  syncedJobIds: [],
  activeJobId: null,
}

describe('serverFramePath', () => {
  it('builds zero-padded frame paths with or without a trailing slash', () => {
    expect(serverFramePath('u/animations/a/', 0)).toBe('u/animations/a/000.png')
    expect(serverFramePath('u/animations/a', 12)).toBe('u/animations/a/012.png')
  })
})

describe('toAssetType', () => {
  it('keeps a known asset type and falls back to character', () => {
    expect(toAssetType('weapon')).toBe('weapon')
    expect(toAssetType('spaceship')).toBe('character')
    expect(toAssetType(null)).toBe('character')
  })
})

describe('pngBytesToDataUri', () => {
  it('encodes bytes as a PNG data URI, including inputs larger than one chunk', () => {
    expect(pngBytesToDataUri(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe('data:image/png;base64,iVBORw==')
    const big = new Uint8Array(100_000).fill(7)
    const uri = pngBytesToDataUri(big)
    expect(atob(uri.replace('data:image/png;base64,', '')).length).toBe(big.length)
  })
})

describe('planServerAnimationSync', () => {
  it('imports unknown jobs and leaves out synced ones and the active polling job', () => {
    const decisions = planServerAnimationSync([job('a'), job('b'), job('c')], {
      ...emptyState,
      syncedJobIds: ['b'],
      activeJobId: 'c',
    })
    expect(decisions).toEqual([{ kind: 'import', job: job('a') }])
  })

  it('skips a job already in the library (same asset id) or saved by the browser itself', () => {
    const saved = updateLedgerEntry([pendingEntry('b')], 'b', { status: 'completed', animationId: 'local-uuid' })
    const decisions = planServerAnimationSync([job('a'), job('b'), job('c')], {
      ...emptyState,
      localAnimationIds: new Set(['asset-a']),
      ledgerEntries: [...saved, pendingEntry('c')],
    })
    expect(decisions.map((d) => [d.kind, d.job.providerJobId])).toEqual([
      ['skip', 'a'],
      ['skip', 'b'],
      ['import', 'c'],
    ])
  })
})

describe('buildServerAnimationAsset', () => {
  it('uses the server asset id as the local id so it dedupes across devices', () => {
    const animation = buildServerAnimationAsset(job('a'), ['f0', 'f1'])
    expect(animation).toMatchObject({ id: 'asset-a', label: 'Walk', frames: ['f0', 'f1'], frameDurationMs: 120 })
  })
})

describe('syncServerAnimations', () => {
  const setup = (jobs: readonly ServerAnimationJob[], initial: Partial<ServerAnimationSyncState> = {}) => {
    let state: ServerAnimationSyncState = { ...emptyState, ...initial }
    const added: AIAnimation[] = []
    const deps: ServerAnimationSyncDeps = {
      listCompletedJobs: async () => jobs,
      downloadFrames: vi.fn(async (j: ServerAnimationJob) => [`${j.providerJobId}-0`, `${j.providerJobId}-1`]),
      getState: () => state,
      addAnimation: (animation) => {
        added.push(animation)
        state = { ...state, localAnimationIds: new Set([...state.localAnimationIds, animation.id]) }
      },
      updateLedger: (jobId: string, patch: LedgerEntryPatch) => {
        state = { ...state, ledgerEntries: updateLedgerEntry(state.ledgerEntries, jobId, patch) }
      },
      markSynced: (ids) => {
        state = { ...state, syncedJobIds: [...ids, ...state.syncedJobIds] }
      },
      now: () => 42,
    }
    return { deps, added, getState: () => state, setState: (next: ServerAnimationSyncState) => (state = next) }
  }

  it('imports new jobs, marks their ledger entry recovered and remembers them', async () => {
    const { deps, added, getState } = setup([job('a')], { ledgerEntries: [pendingEntry('a')] })
    const result = await syncServerAnimations(deps)

    expect(result).toEqual({ imported: ['a'], failed: [] })
    expect(added.map((a) => a.id)).toEqual(['asset-a'])
    expect(getState().ledgerEntries[0]).toMatchObject({ status: 'recovered', animationId: 'asset-a' })
    expect(getState().syncedJobIds).toEqual(['a'])
  })

  it('never imports the same job twice across passes', async () => {
    const { deps, added } = setup([job('a')])
    await syncServerAnimations(deps)
    await syncServerAnimations(deps)
    expect(added).toHaveLength(1)
  })

  it('remembers skipped jobs without downloading them', async () => {
    const { deps, getState } = setup([job('a')], { localAnimationIds: new Set(['asset-a']) })
    const result = await syncServerAnimations(deps)
    expect(result.imported).toEqual([])
    expect(deps.downloadFrames).not.toHaveBeenCalled()
    expect(getState().syncedJobIds).toEqual(['a'])
  })

  it('leaves a job whose frames fail to download unsynced, so the next pass retries it', async () => {
    const { deps, getState } = setup([job('a')])
    const failing = { ...deps, downloadFrames: async () => Promise.reject(new Error('offline')) }
    expect(await syncServerAnimations(failing)).toEqual({ imported: [], failed: ['a'] })
    expect(getState().syncedJobIds).toEqual([])
  })

  it('does not add a job the polling loop saved while its frames were downloading', async () => {
    const harness = setup([job('a')], { ledgerEntries: [pendingEntry('a')] })
    const racing: ServerAnimationSyncDeps = {
      ...harness.deps,
      downloadFrames: async () => {
        const current = harness.getState()
        harness.setState({
          ...current,
          ledgerEntries: updateLedgerEntry(current.ledgerEntries, 'a', { status: 'completed', animationId: 'loop-id' }),
        })
        return ['f0']
      },
    }
    const result = await syncServerAnimations(racing)
    expect(result.imported).toEqual([])
    expect(harness.added).toHaveLength(0)
    expect(harness.getState().ledgerEntries[0]).toMatchObject({ status: 'completed', animationId: 'loop-id' })
    expect(harness.getState().syncedJobIds).toEqual(['a'])
  })
})

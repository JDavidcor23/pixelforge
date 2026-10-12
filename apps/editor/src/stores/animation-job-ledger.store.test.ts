import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAnimationJobLedgerStore } from './animation-job-ledger.store'
import { ANIMATION_JOB_LEDGER_STORAGE_KEY } from '@/constants/persistence'

// The ledger persists to localStorage; vitest runs in node, so give it one
// before the store module is evaluated.
const storage = vi.hoisted(() => {
  const data = new Map<string, string>()
  const memory = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  }
  globalThis.localStorage = memory as unknown as Storage
  return data
})

const NEW_ENTRY = {
  jobId: 'job-1',
  submittedAt: 1,
  label: 'Walk',
  assetType: 'character' as const,
  frameCount: 8,
  canvasSize: { width: 64, height: 64 },
}

const persistedEntries = () =>
  (JSON.parse(storage.get(ANIMATION_JOB_LEDGER_STORAGE_KEY) ?? '{}') as { state: { entries: unknown[] } }).state
    .entries

describe('useAnimationJobLedgerStore', () => {
  beforeEach(() => {
    useAnimationJobLedgerStore.setState({ entries: [], recoveringIds: [] })
  })

  // PixelLab cannot list jobs: the id must be on disk the moment `record` returns.
  it('writes a recorded job to localStorage synchronously', () => {
    useAnimationJobLedgerStore.getState().record(NEW_ENTRY)
    expect(persistedEntries()).toEqual([expect.objectContaining({ jobId: 'job-1', status: 'pending' })])
  })

  it('persists status updates but not the in-flight recovery ids', () => {
    const ledger = useAnimationJobLedgerStore.getState()
    ledger.record(NEW_ENTRY)
    ledger.claimRecovery('job-1')
    ledger.update('job-1', { status: 'discarded' })
    const saved = JSON.parse(storage.get(ANIMATION_JOB_LEDGER_STORAGE_KEY) ?? '{}') as { state: object }
    expect(saved.state).not.toHaveProperty('recoveringIds')
    expect(persistedEntries()).toEqual([expect.objectContaining({ status: 'discarded' })])
  })

  it('lets only one caller claim a job until it is released', () => {
    const ledger = useAnimationJobLedgerStore.getState()
    expect(ledger.claimRecovery('job-1')).toBe(true)
    expect(useAnimationJobLedgerStore.getState().claimRecovery('job-1')).toBe(false)
    useAnimationJobLedgerStore.getState().releaseRecovery('job-1')
    expect(useAnimationJobLedgerStore.getState().claimRecovery('job-1')).toBe(true)
  })
})

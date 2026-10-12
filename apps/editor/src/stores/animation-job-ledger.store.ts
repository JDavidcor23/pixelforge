import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { ANIMATION_JOB_LEDGER_STORAGE_KEY } from '@/constants/persistence'
import { appendLedgerEntry, updateLedgerEntry } from '@/lib/animation-job-ledger'
import type { LedgerEntryPatch, NewLedgerEntry } from '@/lib/animation-job-ledger'
import type { AnimationJobLedgerEntry } from '@/types'

/**
 * Durable record of every submitted animation job (localStorage — survives a
 * tab close, unlike `useAIJobsStore`'s sessionStorage `animatePending`).
 * PixelLab has no endpoint to list jobs, so a job id that is not written here
 * the moment `provider.submit` returns can be lost for good — with its bill.
 *
 * `persist` writes synchronously on every `set`, so `record` is durable before
 * the first poll starts. `recoveringIds` is runtime-only (not persisted): it
 * stops two Recover checks of the same job from running at once.
 */
export interface AnimationJobLedgerState {
  readonly entries: readonly AnimationJobLedgerEntry[]
  readonly recoveringIds: readonly string[]
  record: (entry: NewLedgerEntry) => void
  update: (jobId: string, patch: LedgerEntryPatch) => void
  /** True when the caller now owns the check of `jobId`; false when one is already in flight. */
  claimRecovery: (jobId: string) => boolean
  releaseRecovery: (jobId: string) => void
}

export const useAnimationJobLedgerStore = create<AnimationJobLedgerState>()(
  persist(
    (set, get) => ({
      entries: [],
      recoveringIds: [],
      record: (entry) => set((state) => ({ entries: appendLedgerEntry(state.entries, entry) })),
      update: (jobId, patch) => set((state) => ({ entries: updateLedgerEntry(state.entries, jobId, patch) })),
      claimRecovery: (jobId) => {
        if (get().recoveringIds.includes(jobId)) return false
        set((state) => ({ recoveringIds: [...state.recoveringIds, jobId] }))
        return true
      },
      releaseRecovery: (jobId) =>
        set((state) => ({ recoveringIds: state.recoveringIds.filter((id) => id !== jobId) })),
    }),
    {
      name: ANIMATION_JOB_LEDGER_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ entries: state.entries }),
    },
  ),
)

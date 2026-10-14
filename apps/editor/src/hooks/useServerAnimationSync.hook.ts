import { useEffect, useRef } from 'react'

import { useAIJobsStore } from '@/stores/ai-jobs.store'
import { useAnimationJobLedgerStore } from '@/stores/animation-job-ledger.store'
import { useAssetsStore } from '@/stores/assets.store'
import { useAuthStore } from '@/stores/auth.store'
import { syncServerAnimations } from '@/lib/server-animation-sync'
import type { ServerAnimationSyncDeps } from '@/lib/server-animation-sync'
import { serverAnimationJobsService } from '@/services/server-animation-jobs.service'

const createSyncDeps = (): ServerAnimationSyncDeps => ({
  listCompletedJobs: serverAnimationJobsService.listCompletedAnimationJobs,
  downloadFrames: serverAnimationJobsService.downloadAnimationFrames,
  getState: () => {
    const ledger = useAnimationJobLedgerStore.getState()
    return {
      ledgerEntries: ledger.entries,
      localAnimationIds: new Set(useAssetsStore.getState().animations.map((animation) => animation.id)),
      syncedJobIds: ledger.syncedServerJobIds,
      activeJobId: useAIJobsStore.getState().animatePending?.jobId ?? null,
    }
  },
  addAnimation: (animation) => useAssetsStore.getState().addAnimation(animation),
  updateLedger: (jobId, patch) => useAnimationJobLedgerStore.getState().update(jobId, patch),
  markSynced: (jobIds) => useAnimationJobLedgerStore.getState().markServerJobsSynced(jobIds),
  now: Date.now,
})

/**
 * Server → local Assets sync for signed-in users (ADR 0009 follow-up). Jobs
 * billed to the server key are collected by the `collect-ai-jobs` Edge
 * Function even with every tab closed; this copies those animations into the
 * local Assets library:
 * - once the session and the IndexedDB library are both ready (editor load),
 * - again whenever the Animate tab's job changes (submitted, settled or
 *   discarded), which also picks up any other job the server finished meanwhile.
 * The job a polling loop owns is left to that loop (`planServerAnimationSync`).
 * One pass at a time; a failed pass is logged and retried on the next trigger.
 */
export function useServerAnimationSync(): void {
  const isSignedIn = useAuthStore((s) => s.status === 'signed-in')
  const isLibraryReady = useAssetsStore((s) => s.repository !== null)
  const activeJobId = useAIJobsStore((s) => s.animatePending?.jobId ?? null)
  const inFlightRef = useRef(false)

  useEffect(() => {
    if (!isSignedIn || !isLibraryReady || inFlightRef.current) return
    inFlightRef.current = true
    syncServerAnimations(createSyncDeps())
      .catch((e) => console.error('Syncing server animations failed', e))
      .finally(() => {
        inFlightRef.current = false
      })
  }, [isSignedIn, isLibraryReady, activeJobId])
}

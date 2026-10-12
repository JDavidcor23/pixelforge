import { useEffect, useMemo, useRef } from 'react'

import { usePixelLabApiKey } from '@/sprites/hooks/useSpriteEditorStore.hook'
import { useAIJobsStore } from '@/stores/ai-jobs.store'
import { useAnimationJobLedgerStore } from '@/stores/animation-job-ledger.store'
import { useAssetsStore } from '@/stores/assets.store'
import {
  buildAnimationAsset,
  findLedgerEntry,
  runRecoverPass,
  selectAutoRecoverJobIds,
} from '@/lib/animation-job-ledger'
import type { AnimationRecoverDeps } from '@/lib/animation-job-ledger'
import { resolveAnimationProvider } from '@/services/animation-provider.service'
import { ANIMATION_GENERIC_ERROR } from '@/constants/animation'
import type { AnimationJobLedgerEntry, AnimationJobStatus } from '@/types'

/** Saves a recovered job's frames to the Assets library only (no canvas side effects). */
export const saveAnimationToAssets = async (
  entry: AnimationJobLedgerEntry,
  frames: readonly string[],
): Promise<string> => {
  const animation = buildAnimationAsset(entry, frames, crypto.randomUUID(), Date.now())
  useAssetsStore.getState().addAnimation(animation)
  return animation.id
}

/** Wires `recoverAnimationJob` to the ledger store, a provider's `poll` and a save strategy. */
export const createLedgerRecoverDeps = (
  poll: (jobId: string) => Promise<AnimationJobStatus>,
  save: AnimationRecoverDeps['save'],
): AnimationRecoverDeps => ({
  getEntry: (jobId) => findLedgerEntry(useAnimationJobLedgerStore.getState().entries, jobId),
  claim: (jobId) => useAnimationJobLedgerStore.getState().claimRecovery(jobId),
  release: (jobId) => useAnimationJobLedgerStore.getState().releaseRecovery(jobId),
  poll,
  save,
  update: (jobId, patch) => useAnimationJobLedgerStore.getState().update(jobId, patch),
  now: Date.now,
  genericError: ANIMATION_GENERIC_ERROR,
})

/**
 * App-load guard for paid animation jobs (mounted by the sprite editor shell,
 * so it runs even when the Animate tab never opens):
 * 1. Copies a pre-ledger `animatePending` (sessionStorage) into the ledger.
 * 2. Once the Assets library is on IndexedDB, checks every `pending` entry
 *    ONCE — a job that finished while the tab was closed lands in Assets.
 *    The job an Animate polling loop owns (`animatePending`) is skipped.
 * No retries and no loop: unfinished entries wait for a manual Recover.
 */
export function useAnimationJobRecovery(): void {
  const pixelLabApiKey = usePixelLabApiKey()
  const isLibraryReady = useAssetsStore((s) => s.repository !== null)
  const attemptedRef = useRef(false)

  const provider = useMemo(
    () => resolveAnimationProvider({ apiKey: pixelLabApiKey ?? undefined }),
    [pixelLabApiKey],
  )

  useEffect(() => {
    const pending = useAIJobsStore.getState().animatePending
    if (!pending) return
    useAnimationJobLedgerStore.getState().record({
      jobId: pending.jobId,
      submittedAt: pending.startedAt,
      label: pending.label,
      assetType: pending.assetType,
      frameCount: null,
      canvasSize: null,
    })
  }, [])

  useEffect(() => {
    if (attemptedRef.current || !isLibraryReady) return
    attemptedRef.current = true
    const activeJobId = useAIJobsStore.getState().animatePending?.jobId ?? null
    const jobIds = selectAutoRecoverJobIds(useAnimationJobLedgerStore.getState().entries, activeJobId)
    if (jobIds.length === 0) return
    runRecoverPass(jobIds, createLedgerRecoverDeps(provider.poll, saveAnimationToAssets)).catch((e) => {
      console.error('Automatic recovery of unfinished animation jobs failed', e)
    })
  }, [isLibraryReady, provider])
}

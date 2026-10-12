import { useCallback, useMemo, useState } from 'react'

import { usePixelLabApiKey } from '@/sprites/hooks/useSpriteEditorStore.hook'
import { useAIJobsStore } from '@/stores/ai-jobs.store'
import { useAnimationJobLedgerStore } from '@/stores/animation-job-ledger.store'
import { createLedgerRecoverDeps } from '@/hooks/useAnimationJobRecovery.hook'
import { useFinishAnimation } from './useFinishAnimation.hook'
import {
  ledgerEntryStateMessage,
  recoverAnimationJob,
  recoverNoticeFor,
  selectUnfinishedEntries,
} from '@/lib/animation-job-ledger'
import { resolveAnimationProvider } from '@/services/animation-provider.service'
import { ANIMATION_LEDGER_TIME_FORMAT } from '@/constants/animation'
import type { AnimationJobLedgerEntry, AnimationRecoverNotice, UnfinishedAnimationJobItem } from '@/types'

export interface UseUnfinishedJobsReturn {
  readonly items: readonly UnfinishedAnimationJobItem[]
  readonly notice: AnimationRecoverNotice | null
  /** True when there is anything to show: unfinished rows or a fresh notice. */
  readonly isVisible: boolean
  readonly handleRecover: (jobId: string) => void
}

/**
 * "Unfinished jobs" in the Animate tab: ledger entries (pending/discarded)
 * whose frames never reached Assets, minus the job the main polling loop owns.
 * Recover polls ONCE; a completed job takes the same path as a normal
 * completion (`useFinishAnimation`).
 */
export const useUnfinishedJobs = (): UseUnfinishedJobsReturn => {
  const entries = useAnimationJobLedgerStore((s) => s.entries)
  const recoveringIds = useAnimationJobLedgerStore((s) => s.recoveringIds)
  const activeJobId = useAIJobsStore((s) => s.animatePending?.jobId ?? null)
  const pixelLabApiKey = usePixelLabApiKey()
  const presentAnimation = useFinishAnimation()
  const [notice, setNotice] = useState<AnimationRecoverNotice | null>(null)

  const provider = useMemo(
    () => resolveAnimationProvider({ apiKey: pixelLabApiKey ?? undefined }),
    [pixelLabApiKey],
  )

  const items = useMemo<UnfinishedAnimationJobItem[]>(
    () =>
      selectUnfinishedEntries(entries, activeJobId).map((entry) => ({
        jobId: entry.jobId,
        label: entry.label,
        submittedLabel: new Date(entry.submittedAt).toLocaleString(undefined, ANIMATION_LEDGER_TIME_FORMAT),
        isDiscarded: entry.status === 'discarded',
        stateMessage: ledgerEntryStateMessage(entry),
        isRecovering: recoveringIds.includes(entry.jobId),
      })),
    [entries, activeJobId, recoveringIds],
  )

  const handleRecover = useCallback(
    (jobId: string) => {
      setNotice(null)
      const save = (entry: AnimationJobLedgerEntry, frames: readonly string[]) => presentAnimation(entry, frames)
      recoverAnimationJob(jobId, createLedgerRecoverDeps(provider.poll, save))
        .then((outcome) => setNotice(recoverNoticeFor(outcome)))
        .catch((e) => console.error('Failed to recover animation job', e))
    },
    [provider, presentAnimation],
  )

  return { items, notice, isVisible: items.length > 0 || notice !== null, handleRecover }
}

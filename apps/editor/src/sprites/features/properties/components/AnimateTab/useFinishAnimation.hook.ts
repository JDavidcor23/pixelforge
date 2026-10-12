import { useCallback } from 'react'

import { useApplyAsset } from '@/sprites/hooks/useApplyAsset.hook'
import { useSpriteEditorStore } from '@/sprites/hooks/useSpriteEditorStore.hook'
import { useAIJobsStore } from '@/stores/ai-jobs.store'
import { useAssetsStore } from '@/stores/assets.store'
import { buildAnimationAsset } from '@/lib/animation-job-ledger'
import { isCanvasBlank } from '@/lib/canvas-blank'
import type { AssetType } from '@/types'

interface FinishedJob {
  readonly label: string
  readonly assetType: AssetType
}

/**
 * The one completion path for an animation job's frames — the normal polling
 * loop and the Animate tab's Recover both go through it: save to Assets,
 * apply to a blank timeline, show the result card. `onSaved` runs right after
 * the Assets write and before any await, so the ledger is marked in the same
 * tick the frames are saved.
 */
export const useFinishAnimation = () => {
  const { applyAnimation } = useApplyAsset()
  const addAnimation = useAssetsStore((s) => s.addAnimation)
  const setAnimateJob = useAIJobsStore((s) => s.setAnimateJob)

  return useCallback(
    async (job: FinishedJob, frames: readonly string[], onSaved?: (animationId: string) => void): Promise<string> => {
      const animation = buildAnimationAsset(job, frames, crypto.randomUUID(), Date.now())
      addAnimation(animation)
      onSaved?.(animation.id)

      const canApplyAutomatically = isCanvasBlank(useSpriteEditorStore.getState().timeline.frames)
      if (canApplyAutomatically) {
        await applyAnimation({ frames: animation.frames, frameDurationMs: animation.frameDurationMs })
      }
      setAnimateJob({
        result: {
          frames: animation.frames,
          frameDurationMs: animation.frameDurationMs,
          label: animation.label,
          autoApplied: canApplyAutomatically,
        },
      })
      return animation.id
    },
    [addAnimation, applyAnimation, setAnimateJob],
  )
}

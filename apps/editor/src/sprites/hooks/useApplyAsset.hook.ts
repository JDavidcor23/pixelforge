import { useCallback } from 'react'

import { base64ToNativePixels } from '@/lib/image-decode'
import { decodeGeneratedSprite } from '@/lib/retro-diffusion-utils'
import { useImportAnimationFrames, useOverwriteWithPixels } from './useSpriteEditorStore.hook'
import { AI_SPRITE_DEFAULT_SIZE } from '@/constants'

export interface ApplyGenerationParams {
  readonly base64: string
  readonly width: number
}

export interface ApplyAnimationParams {
  readonly frames: readonly string[]
  readonly frameDurationMs: number
}

/**
 * The single "apply an AI result to the document" path — used by the Assets
 * tab (picking a saved generation/animation) AND by the Create > Generate /
 * Animate result cards ("Use on canvas" / "Use on timeline"), so there is
 * exactly one place that knows how to decode an AI image into pixels.
 */
export const useApplyAsset = () => {
  const overwriteWithPixels = useOverwriteWithPixels()
  const importAnimationFrames = useImportAnimationFrames()

  const applyGeneration = useCallback(
    async ({ base64, width }: ApplyGenerationParams) => {
      const pixels = await decodeGeneratedSprite(base64, width)
      overwriteWithPixels(pixels, base64)
    },
    [overwriteWithPixels],
  )

  const applyAnimation = useCallback(
    async ({ frames, frameDurationMs }: ApplyAnimationParams) => {
      const firstFrame = frames[0]
      if (!firstFrame) return

      // Bug fix: trust the frame's own pixel dimensions instead of the
      // hardcoded AI default size. An animation recorded at a different size
      // (e.g. 128px) was being forced through the 64px path, which scales/crops
      // instead of using the pixels verbatim — mangling the result. Reading the
      // real size off the decoded image works for every record, old or new.
      const native = await base64ToNativePixels(firstFrame)
      const frameSize = native.w === native.h && native.w > 0 ? native.w : AI_SPRITE_DEFAULT_SIZE

      const decodedFrames = await Promise.all(
        frames.map((dataUri) => decodeGeneratedSprite(dataUri, frameSize)),
      )
      importAnimationFrames(decodedFrames, frameDurationMs)
    },
    [importAnimationFrames],
  )

  return { applyGeneration, applyAnimation }
}

import { useEffect } from 'react'

import { useSpriteEditorStore } from '@/stores'
import {
  useIsPlaying,
  useTimelineFps,
  useGoToNextFrame,
  useTogglePlayback,
} from '@/sprites/hooks/useSpriteEditorStore.hook'

export const useAnimationPlayback = () => {
  const isPlaying = useIsPlaying()
  const fps = useTimelineFps()
  const goToNextFrame = useGoToNextFrame()
  const togglePlayback = useTogglePlayback()

  useEffect(() => {
    if (!isPlaying) return

    const intervalMs = Math.round(1000 / fps)

    const id = setInterval(() => {
      const { currentFrameIndex, frames, loop, isPlaying } =
        useSpriteEditorStore.getState().timeline

      if (!isPlaying) {
        clearInterval(id)
        return
      }

      const isLastFrame = currentFrameIndex === frames.length - 1

      if (isLastFrame && !loop) {
        clearInterval(id)
        togglePlayback()
        return
      }

      goToNextFrame()
    }, intervalMs)

    return () => clearInterval(id)
  }, [isPlaying, fps, goToNextFrame, togglePlayback])
}

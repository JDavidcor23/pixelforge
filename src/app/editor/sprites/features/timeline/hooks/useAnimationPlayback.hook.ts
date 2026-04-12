'use client'

import { useEffect } from 'react'

import { useSpriteEditorStore } from '@/app/editor/stores'
import {
  useTimeline,
  useGoToNextFrame,
  useTogglePlayback,
} from '@/app/editor/sprites/hooks/useSpriteEditorStore.hook'

export const useAnimationPlayback = () => {
  const timeline = useTimeline()
  const goToNextFrame = useGoToNextFrame()
  const togglePlayback = useTogglePlayback()

  useEffect(() => {
    if (!timeline.isPlaying) return

    const intervalMs = Math.round(1000 / timeline.fps)

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
  }, [timeline.isPlaying, timeline.fps, goToNextFrame, togglePlayback])
}

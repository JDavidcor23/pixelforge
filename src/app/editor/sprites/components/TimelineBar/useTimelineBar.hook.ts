'use client'

import { useCallback } from 'react'

import { SPRITE_EDITOR_TIMELINE } from '@/app/editor/constants'
import {
  useTimeline,
  useAddFrame,
  useRemoveFrame,
  useSetCurrentFrame,
  useSetFps,
  useTogglePlayback,
} from '../../hooks/useSpriteEditorStore.hook'

export const useTimelineBar = () => {
  const timeline = useTimeline()
  const addFrame = useAddFrame()
  const removeFrame = useRemoveFrame()
  const setCurrentFrame = useSetCurrentFrame()
  const setFps = useSetFps()
  const togglePlayback = useTogglePlayback()

  const handleFpsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value)
      const clamped = Math.min(
        SPRITE_EDITOR_TIMELINE.MAX_FPS,
        Math.max(SPRITE_EDITOR_TIMELINE.MIN_FPS, value)
      )
      setFps(clamped)
    },
    [setFps]
  )

  const handleAddFrame = useCallback(() => {
    addFrame()
  }, [addFrame])

  const handleSelectFrame = useCallback(
    (index: number) => {
      setCurrentFrame(index)
    },
    [setCurrentFrame]
  )

  const handleTogglePlayback = useCallback(() => {
    togglePlayback()
  }, [togglePlayback])

  return {
    timeline,
    handleFpsChange,
    handleAddFrame,
    handleSelectFrame,
    handleTogglePlayback,
  }
}


'use client'

import { useCallback } from 'react'

import { useSpriteEditorStore } from '@/app/editor/stores'
import { exportFrameAsPng, exportSpriteSheetAsPng } from '@/app/editor/lib'

export const useExport = () => {
  const canvasWidth = useSpriteEditorStore((s) => s.canvasWidth)
  const canvasHeight = useSpriteEditorStore((s) => s.canvasHeight)
  const layers = useSpriteEditorStore((s) => s.layers)
  const timeline = useSpriteEditorStore((s) => s.timeline)

  const handleExportFrame = useCallback(() => {
    exportFrameAsPng(canvasWidth, canvasHeight, layers, 'frame.png')
  }, [canvasWidth, canvasHeight, layers])

  const handleExportSpriteSheet = useCallback(() => {
    // Collect frames from the timeline
    // Note: The store state 'layers' usually represents the current frame's layers.
    // However, for a full sprite sheet, we need all frames.
    const allFrames = timeline.frames
    
    // If the duration/FPS is available, we could even export a GIF, 
    // but for now only PNG as requested.
    exportSpriteSheetAsPng(canvasWidth, canvasHeight, allFrames, 'spritesheet.png')
  }, [canvasWidth, canvasHeight, timeline])

  return {
    handleExportFrame,
    handleExportSpriteSheet,
  }
}

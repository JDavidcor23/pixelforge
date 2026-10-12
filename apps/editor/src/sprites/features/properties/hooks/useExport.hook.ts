import { useCallback } from 'react'

import { useSpriteEditorStore } from '@/stores'
import { exportFrameAsPng, exportSpriteSheetAsPng } from '@/lib'

/**
 * Reads `canvasWidth`/`canvasHeight`/`layers`/`timeline` straight off
 * `getState()` inside each click handler instead of subscribing to them —
 * this hook backs the TopBar Export menu, so subscribing would re-render the
 * whole TopBar on every pixel while drawing (every `stroke.points` dispatch
 * replaces `timeline`). The export only ever needs a one-off read at click
 * time, never a live value.
 */
export const useExport = () => {
  const handleExportFrame = useCallback(() => {
    const { canvasWidth, canvasHeight, layers } = useSpriteEditorStore.getState()
    exportFrameAsPng(canvasWidth, canvasHeight, layers, 'frame.png')
  }, [])

  const handleExportSpriteSheet = useCallback(() => {
    const { canvasWidth, canvasHeight, timeline } = useSpriteEditorStore.getState()
    // Collect frames from the timeline
    // Note: The store state 'layers' usually represents the current frame's layers.
    // However, for a full sprite sheet, we need all frames.
    const allFrames = timeline.frames

    // If the duration/FPS is available, we could even export a GIF,
    // but for now only PNG as requested.
    exportSpriteSheetAsPng(canvasWidth, canvasHeight, allFrames, 'spritesheet.png')
  }, [])

  return {
    handleExportFrame,
    handleExportSpriteSheet,
  }
}

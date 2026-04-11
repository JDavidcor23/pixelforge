'use client'

import { SPRITE_EDITOR_VIEWPORT } from '@/app/editor/constants'
import { useViewport, useCursorPixel } from '../../hooks/useSpriteEditorStore.hook'

export const useCanvasOverlay = () => {
  const viewport = useViewport()
  const cursorPixel = useCursorPixel()

  const zoomPercentage = `${viewport.zoom * SPRITE_EDITOR_VIEWPORT.PERCENTAGE_MULTIPLIER}%`
  const positionText = cursorPixel
    ? `X: ${cursorPixel.x}  Y: ${cursorPixel.y}`
    : '\u2014'

  return { zoomPercentage, positionText }
}


import { SPRITE_EDITOR_CANVAS, SPRITE_EDITOR_VIEWPORT } from '@/constants'
import {
  useViewport,
  useCursorPixel,
  useResetViewport,
} from '@/sprites/hooks/useSpriteEditorStore.hook'

export const useCanvasOverlay = () => {
  const viewport = useViewport()
  const cursorPixel = useCursorPixel()
  const resetViewport = useResetViewport()

  const zoomPercentage = `${viewport.zoom * SPRITE_EDITOR_VIEWPORT.PERCENTAGE_MULTIPLIER}%`
  const positionText = cursorPixel
    ? `X: ${cursorPixel.x}  Y: ${cursorPixel.y}`
    : '—'

  const centerViewLabel = `Center view (${
    SPRITE_EDITOR_CANVAS.RESET_VIEW_ZOOM * SPRITE_EDITOR_VIEWPORT.PERCENTAGE_MULTIPLIER
  }%)  ·  Ctrl+0`

  const isViewCentered =
    viewport.offsetX === 0 &&
    viewport.offsetY === 0 &&
    viewport.zoom === SPRITE_EDITOR_CANVAS.RESET_VIEW_ZOOM

  return {
    zoomPercentage,
    positionText,
    centerViewLabel,
    isViewCentered,
    handleCenterView: resetViewport,
  }
}

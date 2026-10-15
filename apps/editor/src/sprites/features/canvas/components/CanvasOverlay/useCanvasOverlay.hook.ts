import { CURSOR_POSITION_FALLBACK, SPRITE_EDITOR_VIEWPORT } from '@/constants'
import {
  useViewport,
  useCursorPixel,
  useResetViewport,
  useCanvasDimensions,
} from '@/sprites/hooks/useSpriteEditorStore.hook'
import { getCenterViewZoom } from '@/stores/slices/viewport.slice'

export const useCanvasOverlay = () => {
  const viewport = useViewport()
  const cursorPixel = useCursorPixel()
  const resetViewport = useResetViewport()
  const { width: canvasWidth, height: canvasHeight } = useCanvasDimensions()

  const zoomPercentage = `${viewport.zoom * SPRITE_EDITOR_VIEWPORT.PERCENTAGE_MULTIPLIER}%`
  const positionText = cursorPixel
    ? `X ${cursorPixel.x}  Y ${cursorPixel.y}`
    : CURSOR_POSITION_FALLBACK

  const centerViewZoom = getCenterViewZoom(canvasWidth, canvasHeight)

  const centerViewLabel = `Center view (${
    centerViewZoom * SPRITE_EDITOR_VIEWPORT.PERCENTAGE_MULTIPLIER
  }%)  ·  Ctrl+0`

  const isViewCentered =
    viewport.offsetX === 0 && viewport.offsetY === 0 && viewport.zoom === centerViewZoom

  return {
    zoomPercentage,
    positionText,
    centerViewLabel,
    isViewCentered,
    handleCenterView: () => resetViewport(canvasWidth, canvasHeight),
  }
}

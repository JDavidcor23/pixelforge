import type { PixelCoord, ViewportState } from '@/types'
import { getDrawOffset } from './buffer-to-canvas'

/**
 * Only live export of this file (phase 2 cleanup, carry-over item C):
 * `renderPixelGrid` and its private helpers (`renderCheckerboard`,
 * `renderLayers`, `renderGridLines`, `renderSelectionOverlay`) were dead
 * code — their only call chain was
 * `useCanvasArea.hook.ts` -> `useCanvasRenderer.hook.ts`, and nothing
 * imported `useCanvasArea.hook.ts` (confirmed via `rg`): the app renders
 * through the Konva-based `CanvasArea.tsx`, which does its own inline
 * resize logic and composes `konva/{SpriteLayers,SelectionOverlay}.tsx`
 * instead. Both dead files and `renderPixelGrid`/helpers were deleted; the
 * repaint bench now targets the live path, `lib/buffer-to-canvas.ts`'s
 * `renderPixelsToCanvas` (see `buffer-to-canvas.bench.ts`).
 */
export function screenToPixel(
  screenX: number,
  screenY: number,
  viewport: ViewportState,
  gridWidth: number,
  gridHeight: number,
  canvasWidth: number,
  canvasHeight: number
): PixelCoord | null {
  const { startX, startY } = getDrawOffset(viewport, gridWidth, gridHeight, canvasWidth, canvasHeight)

  const x = Math.floor((screenX - startX) / viewport.zoom)
  const y = Math.floor((screenY - startY) / viewport.zoom)

  if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) {
    return null
  }

  return { x, y }
}

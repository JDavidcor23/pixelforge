import type { PixelBuffer, Rect, ViewportState } from '@/types'

/**
 * Screen-space origin of the pixel grid: the point where grid (0,0) lands on
 * the canvas element, given the current zoom/pan. Shared by the main
 * renderer, the Konva sprite layers and the selection overlay — previously
 * duplicated 3x (`canvas-renderer.ts`, `SpriteLayers.tsx`, `SelectionOverlay.tsx`).
 */
export function getDrawOffset(
  viewport: ViewportState,
  gridWidth: number,
  gridHeight: number,
  canvasWidth: number,
  canvasHeight: number
): { startX: number; startY: number } {
  const { zoom, offsetX, offsetY } = viewport
  const startX = Math.round(canvasWidth / 2 - (gridWidth * zoom) / 2 + offsetX)
  const startY = Math.round(canvasHeight / 2 - (gridHeight * zoom) / 2 + offsetY)
  return { startX, startY }
}

export interface RenderPixelsToCanvasOptions {
  /**
   * Rect (in buffer pixel coords) to force fully transparent in the OUTPUT
   * canvas only — does not mutate `buffer`. Used to punch the floating-
   * selection hole out of its source layer while it is being dragged.
   */
  readonly maskRect?: Rect | null
}

/**
 * Renders a flat `PixelBuffer` onto a same-size offscreen canvas via
 * `putImageData`. `putImageData` ignores `globalAlpha`, so callers that need
 * layer opacity or scaling draw the RETURNED canvas with `drawImage` instead
 * of drawing into it directly.
 */
export function renderPixelsToCanvas(
  buffer: PixelBuffer,
  options?: RenderPixelsToCanvasOptions
): HTMLCanvasElement | null {
  const { w, h, data } = buffer
  if (w === 0 || h === 0) return null

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.imageSmoothingEnabled = false

  // Copy, never alias: the mask below (and any future caller) must not mutate
  // the buffer that still lives in the store/document.
  const imageData = new ImageData(new Uint8ClampedArray(data), w, h)

  const mask = options?.maskRect
  if (mask) {
    const x0 = Math.max(0, mask.x)
    const y0 = Math.max(0, mask.y)
    const x1 = Math.min(w, mask.x + mask.w)
    const y1 = Math.min(h, mask.y + mask.h)
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        imageData.data[(y * w + x) * 4 + 3] = 0
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

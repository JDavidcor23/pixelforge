import { renderPixelsToCanvas } from './buffer-to-canvas'
import { base64ToNativePixels } from './image-decode'

/**
 * Pure layout math for `composeHorizontalSheet`, split out so it is
 * unit-testable under the `environment: 'node'` test runner (see
 * `vite.config.ts`) without a real `<canvas>`/`Image`.
 */
export function computeHorizontalSheetLayout(
  frameWidth: number,
  frameHeight: number,
  frameCount: number
): {
  readonly sheetWidth: number
  readonly sheetHeight: number
  readonly offsets: readonly number[]
} {
  return {
    sheetWidth: frameWidth * frameCount,
    sheetHeight: frameHeight,
    offsets: Array.from({ length: frameCount }, (_, i) => i * frameWidth),
  }
}

/**
 * Composes an `AIAnimation`'s persisted `frames` (same-size PNG data URIs)
 * into a single horizontal sprite sheet PNG data URI, left-to-right.
 *
 * Replaces the old `animationSheetCache` download path: Retro Diffusion no
 * longer generates animations (ADR 0009), so there is no raw provider sheet
 * to cache — every frame already lives in `AIAnimation.frames`, so the sheet
 * is rebuilt from them on demand instead.
 */
export async function composeHorizontalSheet(frameDataUris: readonly string[]): Promise<string> {
  if (frameDataUris.length === 0) return ''

  const buffers = await Promise.all(frameDataUris.map(base64ToNativePixels))
  const { w: frameWidth, h: frameHeight } = buffers[0]
  const { sheetWidth, sheetHeight, offsets } = computeHorizontalSheetLayout(
    frameWidth,
    frameHeight,
    buffers.length
  )
  if (sheetWidth === 0 || sheetHeight === 0) return ''

  const canvas = document.createElement('canvas')
  canvas.width = sheetWidth
  canvas.height = sheetHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.imageSmoothingEnabled = false

  buffers.forEach((buffer, i) => {
    const frameCanvas = renderPixelsToCanvas(buffer)
    if (!frameCanvas) return
    ctx.drawImage(frameCanvas, offsets[i], 0)
  })

  return canvas.toDataURL('image/png')
}

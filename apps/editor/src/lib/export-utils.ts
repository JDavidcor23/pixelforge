import type { Layer, AnimationFrame, PixelBuffer } from '@/types'
import { renderPixelsToCanvas } from './buffer-to-canvas'

/**
 * Triggers a download of a canvas as a PNG file.
 */
export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a')
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

/**
 * Renders a set of layers to a canvas. Each layer goes through its own
 * native-size offscreen canvas (`putImageData`) and is composited with
 * `drawImage`, which is where the width/height scale and layer opacity
 * happen — `putImageData` itself ignores `globalAlpha` and cannot scale.
 */
function renderLayersToCanvas(
  ctx: CanvasRenderingContext2D,
  layers: Layer[],
  width: number,
  height: number,
  offsetX: number = 0,
  offsetY: number = 0
) {
  for (const layer of layers) {
    if (!layer.visible) continue

    const offscreen = renderPixelsToCanvas(layer.pixels)
    if (!offscreen) continue

    ctx.globalAlpha = layer.opacity / 100
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(offscreen, offsetX, offsetY, width, height)
    ctx.globalAlpha = 1
  }
}

/**
 * Exports a single frame as a PNG.
 */
export function exportFrameAsPng(
  width: number,
  height: number,
  layers: Layer[],
  filename: string = 'frame.png'
) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  renderLayersToCanvas(ctx, layers, width, height)
  downloadCanvasAsPng(canvas, filename)
}

/**
 * Exports all frames as a sprite sheet PNG (Horizontal).
 */
export function exportSpriteSheetAsPng(
  width: number,
  height: number,
  frames: AnimationFrame[],
  filename: string = 'spritesheet.png'
) {
  if (frames.length === 0) return

  const canvas = document.createElement('canvas')
  canvas.width = width * frames.length
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  for (let i = 0; i < frames.length; i++) {
    renderLayersToCanvas(ctx, frames[i].layers, width, height, i * width, 0)
  }

  downloadCanvasAsPng(canvas, filename)
}

/**
 * Renders visible layers to an offscreen canvas and returns a base64 data URL.
 * Used to export the current frame as a reference_image for AI animation generation.
 */
export function layersToBase64(
  width: number,
  height: number,
  layers: Layer[]
): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  renderLayersToCanvas(ctx, layers, width, height)
  return canvas.toDataURL('image/png')
}

/**
 * Renders a raw PixelBuffer (already-cropped animation frame) to a small PNG
 * data-URI. Used to store animation history frames compactly in
 * localStorage — a decoded 64x64 PNG is a few KB, versus the ~1MB raw
 * sprite sheet the model returns, which would blow the localStorage quota.
 */
export function pixelBufferToDataUri(buffer: PixelBuffer): string {
  const canvas = renderPixelsToCanvas(buffer)
  if (!canvas) return ''
  return canvas.toDataURL('image/png')
}

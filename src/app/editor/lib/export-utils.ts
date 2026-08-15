import type { Layer, AnimationFrame, PixelBuffer } from '@/app/editor/types'
import { rgbaToString } from './color-utils'

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
 * Renders a set of layers to a canvas.
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

    ctx.globalAlpha = layer.opacity / 100
    const pixels = layer.pixels
    
    // Calculamos la escala basada en el tamaño del buffer vs el tamaño objetivo
    const sourceHeight = pixels.length
    const sourceWidth = pixels[0]?.length || 1
    const scaleX = width / sourceWidth
    const scaleY = height / sourceHeight

    for (let y = 0; y < sourceHeight; y++) {
      for (let x = 0; x < sourceWidth; x++) {
        const color = pixels[y][x]
        if (color.a === 0) continue

        ctx.fillStyle = rgbaToString(color)
        // Dibujamos el píxel escalado
        ctx.fillRect(
          offsetX + (x * scaleX), 
          offsetY + (y * scaleY), 
          scaleX, 
          scaleY
        )
      }
    }

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
 * sprite sheet Codex returns, which would blow the localStorage quota.
 */
export function pixelBufferToDataUri(buffer: PixelBuffer): string {
  const height = buffer.length
  const width = buffer[0]?.length ?? 0
  if (width === 0 || height === 0) return ''

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const imageData = ctx.createImageData(width, height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const { r, g, b, a } = buffer[y][x]
      const i = (y * width + x) * 4
      imageData.data[i] = r
      imageData.data[i + 1] = g
      imageData.data[i + 2] = b
      imageData.data[i + 3] = a
    }
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

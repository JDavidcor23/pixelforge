import type { Layer, AnimationFrame } from '@/app/editor/types'
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

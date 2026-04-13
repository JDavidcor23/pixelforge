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

    for (let y = 0; y < pixels.length; y++) {
      for (let x = 0; x < pixels[y].length; x++) {
        const color = pixels[y][x]
        if (color.a === 0) continue

        ctx.fillStyle = rgbaToString(color)
        ctx.fillRect(offsetX + x, offsetY + y, 1, 1)
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

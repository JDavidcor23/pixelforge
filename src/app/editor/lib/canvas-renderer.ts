import type { Layer, PixelCoord, ViewportState } from '@/app/editor/types'
import { SPRITE_EDITOR_CANVAS, SPRITE_EDITOR_COLORS } from '@/app/editor/constants'
import { rgbaToString } from './color-utils'

export function screenToPixel(
  screenX: number,
  screenY: number,
  viewport: ViewportState,
  gridWidth: number,
  gridHeight: number
): PixelCoord | null {
  const x = Math.floor((screenX - viewport.offsetX) / viewport.zoom)
  const y = Math.floor((screenY - viewport.offsetY) / viewport.zoom)

  if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) {
    return null
  }

  return { x, y }
}

function renderCheckerboard(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportState,
  gridWidth: number,
  gridHeight: number
): void {
  const { zoom, offsetX, offsetY } = viewport

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const isEven = (x + y) % 2 === 0
      ctx.fillStyle = isEven
        ? SPRITE_EDITOR_COLORS.TRANSPARENT_CHECKER_A
        : SPRITE_EDITOR_COLORS.TRANSPARENT_CHECKER_B
      ctx.fillRect(offsetX + x * zoom, offsetY + y * zoom, zoom, zoom)
    }
  }
}

function renderLayers(
  ctx: CanvasRenderingContext2D,
  layers: Layer[],
  viewport: ViewportState
): void {
  const { zoom, offsetX, offsetY } = viewport

  for (const layer of layers) {
    if (!layer.visible) continue

    ctx.globalAlpha = layer.opacity / 100
    const pixels = layer.pixels

    for (let y = 0; y < pixels.length; y++) {
      for (let x = 0; x < pixels[y].length; x++) {
        const color = pixels[y][x]
        if (color.a === 0) continue

        ctx.fillStyle = rgbaToString(color)
        ctx.fillRect(offsetX + x * zoom, offsetY + y * zoom, zoom, zoom)
      }
    }

    ctx.globalAlpha = 1
  }
}

function renderGridLines(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportState,
  gridWidth: number,
  gridHeight: number
): void {
  const { zoom, offsetX, offsetY } = viewport

  ctx.strokeStyle = SPRITE_EDITOR_CANVAS.GRID_LINE_COLOR
  ctx.lineWidth = SPRITE_EDITOR_CANVAS.GRID_LINE_WIDTH

  for (let x = 0; x <= gridWidth; x++) {
    ctx.beginPath()
    ctx.moveTo(offsetX + x * zoom, offsetY)
    ctx.lineTo(offsetX + x * zoom, offsetY + gridHeight * zoom)
    ctx.stroke()
  }

  for (let y = 0; y <= gridHeight; y++) {
    ctx.beginPath()
    ctx.moveTo(offsetX, offsetY + y * zoom)
    ctx.lineTo(offsetX + gridWidth * zoom, offsetY + y * zoom)
    ctx.stroke()
  }
}

export function renderPixelGrid(
  ctx: CanvasRenderingContext2D,
  layers: Layer[],
  viewport: ViewportState,
  gridWidth: number,
  gridHeight: number,
  canvasElWidth: number,
  canvasElHeight: number
): void {
  ctx.clearRect(0, 0, canvasElWidth, canvasElHeight)

  ctx.fillStyle = SPRITE_EDITOR_COLORS.BACKGROUND
  ctx.fillRect(0, 0, canvasElWidth, canvasElHeight)

  renderCheckerboard(ctx, viewport, gridWidth, gridHeight)
  renderLayers(ctx, layers, viewport)
  renderGridLines(ctx, viewport, gridWidth, gridHeight)
}


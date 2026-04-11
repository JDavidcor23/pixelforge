import type { Layer, PixelCoord, ViewportState, SelectionState } from '@/app/editor/types'
import { SPRITE_EDITOR_CANVAS, SPRITE_EDITOR_COLORS } from '@/app/editor/constants'
import { rgbaToString } from './color-utils'

function getDrawOffset(
  viewport: ViewportState,
  gridWidth: number,
  gridHeight: number,
  canvasWidth: number,
  canvasHeight: number
) {
  const { zoom, offsetX, offsetY } = viewport
  const startX = Math.round(canvasWidth / 2 - (gridWidth * zoom) / 2) + offsetX
  const startY = Math.round(canvasHeight / 2 - (gridHeight * zoom) / 2) + offsetY
  return { startX, startY }
}

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

function renderCheckerboard(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportState,
  gridWidth: number,
  gridHeight: number,
  startX: number,
  startY: number
): void {
  const { zoom } = viewport

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const isEven = (x + y) % 2 === 0
      ctx.fillStyle = isEven
        ? SPRITE_EDITOR_COLORS.TRANSPARENT_CHECKER_A
        : SPRITE_EDITOR_COLORS.TRANSPARENT_CHECKER_B
      ctx.fillRect(startX + x * zoom, startY + y * zoom, zoom, zoom)
    }
  }
}

function renderLayers(
  ctx: CanvasRenderingContext2D,
  layers: Layer[],
  viewport: ViewportState,
  startX: number,
  startY: number,
  activeLayerId: string,
  onionSkinEnabled: boolean
): void {
  const { zoom } = viewport
  const ONION_SKIN_OPACITY_FACTOR = 0.1

  for (const layer of layers) {
    if (!layer.visible) continue

    let effectiveOpacity = layer.opacity / 100

    if (onionSkinEnabled && layer.id !== activeLayerId) {
      effectiveOpacity *= ONION_SKIN_OPACITY_FACTOR
    }

    ctx.globalAlpha = effectiveOpacity
    const pixels = layer.pixels

    for (let y = 0; y < pixels.length; y++) {
      for (let x = 0; x < pixels[y].length; x++) {
        const color = pixels[y][x]
        if (color.a === 0) continue

        ctx.fillStyle = rgbaToString(color)
        ctx.fillRect(startX + x * zoom, startY + y * zoom, zoom, zoom)
      }
    }

    ctx.globalAlpha = 1
  }
}

function renderGridLines(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportState,
  gridWidth: number,
  gridHeight: number,
  startX: number,
  startY: number
): void {
  const { zoom } = viewport

  ctx.strokeStyle = SPRITE_EDITOR_CANVAS.GRID_LINE_COLOR
  ctx.lineWidth = SPRITE_EDITOR_CANVAS.GRID_LINE_WIDTH

  for (let x = 0; x <= gridWidth; x++) {
    ctx.beginPath()
    ctx.moveTo(startX + x * zoom, startY)
    ctx.lineTo(startX + x * zoom, startY + gridHeight * zoom)
    ctx.stroke()
  }

  for (let y = 0; y <= gridHeight; y++) {
    ctx.beginPath()
    ctx.moveTo(startX, startY + y * zoom)
    ctx.lineTo(startX + gridWidth * zoom, startY + y * zoom)
    ctx.stroke()
  }
}


function renderSelectionOverlay(
  ctx: CanvasRenderingContext2D,
  selection: SelectionState,
  viewport: ViewportState,
  startX: number,
  startY: number
): void {
  const { zoom } = viewport
  const { rect } = selection

  const x = startX + rect.x * zoom
  const y = startY + rect.y * zoom
  const w = rect.width * zoom
  const h = rect.height * zoom

  ctx.save()

  // 1. Draw dashed border (marching ants)
  ctx.strokeStyle = SPRITE_EDITOR_COLORS.ACCENT
  ctx.lineWidth = 1.5
  ctx.setLineDash([5, 3])
  ctx.strokeRect(x, y, w, h)

  // 2. Draw handles
  const handleSize = 6
  ctx.fillStyle = SPRITE_EDITOR_COLORS.ACCENT
  ctx.setLineDash([])

  // Corners
  ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize) // Top-left
  ctx.fillRect(x + w - handleSize / 2, y - handleSize / 2, handleSize, handleSize) // Top-right
  ctx.fillRect(x - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize) // Bottom-left
  ctx.fillRect(x + w - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize) // Bottom-right

  // 3. Draw floating pixels
  if (selection.floatingPixels) {
    for (let py = 0; py < selection.floatingPixels.length; py++) {
      for (let px = 0; px < selection.floatingPixels[py].length; px++) {
        const color = selection.floatingPixels[py][px]
        if (color.a === 0) continue
        ctx.fillStyle = rgbaToString(color)
        ctx.fillRect(x + px * zoom, y + py * zoom, zoom, zoom)
      }
    }
  }

  ctx.restore()
}

export function renderPixelGrid(
  ctx: CanvasRenderingContext2D,
  layers: Layer[],
  viewport: ViewportState,
  gridWidth: number,
  gridHeight: number,
  canvasElWidth: number,
  canvasElHeight: number,
  selection: SelectionState | null,
  activeLayerId: string,
  onionSkinEnabled: boolean
): void {
  ctx.clearRect(0, 0, canvasElWidth, canvasElHeight)

  ctx.fillStyle = SPRITE_EDITOR_COLORS.BACKGROUND
  ctx.fillRect(0, 0, canvasElWidth, canvasElHeight)

  const { startX, startY } = getDrawOffset(viewport, gridWidth, gridHeight, canvasElWidth, canvasElHeight)

  renderCheckerboard(ctx, viewport, gridWidth, gridHeight, startX, startY)
  renderLayers(ctx, layers, viewport, startX, startY, activeLayerId, onionSkinEnabled)
  renderGridLines(ctx, viewport, gridWidth, gridHeight, startX, startY)

  if (selection) {
    renderSelectionOverlay(ctx, selection, viewport, startX, startY)
  }
}


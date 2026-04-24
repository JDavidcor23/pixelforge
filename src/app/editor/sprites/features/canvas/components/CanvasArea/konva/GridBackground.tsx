'use client'

import { useMemo } from 'react'
import { Layer, Rect, Image, Group } from 'react-konva'
import { SPRITE_EDITOR_COLORS } from '@/app/editor/constants'
import type { ViewportState } from '@/app/editor/types'
import { hexToRgba } from '@/app/editor/lib/color-utils'

interface GridBackgroundProps {
  readonly viewport: ViewportState
  readonly gridWidth: number
  readonly gridHeight: number
  readonly canvasElWidth: number
  readonly canvasElHeight: number
}

function getDrawOffset(
  viewport: ViewportState,
  gridWidth: number,
  gridHeight: number,
  canvasWidth: number,
  canvasHeight: number
) {
  const { zoom, offsetX, offsetY } = viewport
  const startX = Math.round(canvasWidth / 2 - (gridWidth * zoom) / 2 + offsetX)
  const startY = Math.round(canvasHeight / 2 - (gridHeight * zoom) / 2 + offsetY)
  return { startX, startY }
}

function renderCheckerboardToCanvas(width: number, height: number): HTMLCanvasElement | null {
  if (width === 0 || height === 0) return null

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.imageSmoothingEnabled = false

  const imageData = ctx.createImageData(width, height)
  let i = 0

  // We need to parse the HEX colors from SPRITE_EDITOR_COLORS
  const colorA = hexToRgba(SPRITE_EDITOR_COLORS.TRANSPARENT_CHECKER_A)
  const colorB = hexToRgba(SPRITE_EDITOR_COLORS.TRANSPARENT_CHECKER_B)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isEven = (x + y) % 2 === 0
      const color = isEven ? colorA : colorB

      imageData.data[i++] = color.r
      imageData.data[i++] = color.g
      imageData.data[i++] = color.b
      imageData.data[i++] = 255 // The constants are actually hex strings, so we use full alpha
    }
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

export const GridBackground = ({
  viewport,
  gridWidth,
  gridHeight,
  canvasElWidth,
  canvasElHeight,
}: GridBackgroundProps) => {
  const { zoom } = viewport
  const { startX, startY } = getDrawOffset(
    viewport,
    gridWidth,
    gridHeight,
    canvasElWidth,
    canvasElHeight
  )

  const canvas = useMemo(() => {
    return renderCheckerboardToCanvas(gridWidth, gridHeight)
  }, [gridWidth, gridHeight])

  return (
    <Layer listening={false} imageSmoothingEnabled={false}>
      <Rect
        x={0}
        y={0}
        width={canvasElWidth}
        height={canvasElHeight}
        fill={SPRITE_EDITOR_COLORS.BACKGROUND}
        listening={false}
      />
      <Group x={startX} y={startY} listening={false}>
        {canvas && (
          <Image
            image={canvas}
            x={0}
            y={0}
            width={gridWidth * zoom}
            height={gridHeight * zoom}
            listening={false}
            imageSmoothingEnabled={false}
          />
        )}
      </Group>
    </Layer>
  )
}

'use client'

import { Layer, Rect, Line, Group } from 'react-konva'
import { SPRITE_EDITOR_COLORS } from '@/app/editor/constants'
import type { ViewportState } from '@/app/editor/types'

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

  const checkerSize = zoom

  // Generate checkerboard based on rects
  const checkers = []
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const isEven = (x + y) % 2 === 0
      checkers.push(
        <Rect
          key={`checker-${x}-${y}`}
          x={x * checkerSize}
          y={y * checkerSize}
          width={checkerSize + 0.5}
          height={checkerSize + 0.5}
          fill={
            isEven
              ? SPRITE_EDITOR_COLORS.TRANSPARENT_CHECKER_A
              : SPRITE_EDITOR_COLORS.TRANSPARENT_CHECKER_B
          }
          listening={false}
        />
      )
    }
  }

  return (
    <Layer listening={false}>
      <Rect
        x={0}
        y={0}
        width={canvasElWidth}
        height={canvasElHeight}
        fill={SPRITE_EDITOR_COLORS.BACKGROUND}
        listening={false}
      />
      <Group x={startX} y={startY} listening={false}>
        {checkers}
      </Group>
    </Layer>
  )
}

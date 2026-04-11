'use client'

import { Layer, Line, Group } from 'react-konva'
import { SPRITE_EDITOR_CANVAS } from '@/app/editor/constants'
import type { ViewportState } from '@/app/editor/types'

interface GridOverlayProps {
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

export const GridOverlay = ({
  viewport,
  gridWidth,
  gridHeight,
  canvasElWidth,
  canvasElHeight,
}: GridOverlayProps) => {
  const { zoom } = viewport
  
  // Ocultar la grilla si el zoom es muy pequeño para evitar que manche todo el dibujo
  if (zoom < 4) return null;

  const { startX, startY } = getDrawOffset(
    viewport,
    gridWidth,
    gridHeight,
    canvasElWidth,
    canvasElHeight
  )

  const gridLines = []
  
  // Usar un color semitransparente para que deje ver el color del pixel debajo
  const gridColor = 'rgba(128, 128, 128, 0.3)'
  
  for (let x = 0; x <= gridWidth; x++) {
    gridLines.push(
      <Line
        key={`vline-${x}`}
        points={[x * zoom, 0, x * zoom, gridHeight * zoom]}
        stroke={gridColor}
        strokeWidth={SPRITE_EDITOR_CANVAS.GRID_LINE_WIDTH}
        listening={false}
      />
    )
  }
  for (let y = 0; y <= gridHeight; y++) {
    gridLines.push(
      <Line
        key={`hline-${y}`}
        points={[0, y * zoom, gridWidth * zoom, y * zoom]}
        stroke={gridColor}
        strokeWidth={SPRITE_EDITOR_CANVAS.GRID_LINE_WIDTH}
        listening={false}
      />
    )
  }

  return (
    <Layer listening={false}>
      <Group x={startX} y={startY} listening={false}>
        {gridLines}
      </Group>
    </Layer>
  )
}

'use client'

import { Layer as KonvaLayer, Group, Rect } from 'react-konva'
import type { Layer, ViewportState, SelectionState } from '@/app/editor/types'
import { rgbaToString } from '@/app/editor/lib'

interface SpriteLayersProps {
  readonly layers: Layer[]
  readonly viewport: ViewportState
  readonly gridWidth: number
  readonly gridHeight: number
  readonly canvasElWidth: number
  readonly canvasElHeight: number
  readonly activeLayerId: string
  readonly selection: SelectionState | null
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

export const SpriteLayers = ({
  layers,
  viewport,
  gridWidth,
  gridHeight,
  canvasElWidth,
  canvasElHeight,
  activeLayerId,
  selection,
}: SpriteLayersProps) => {
  const { startX, startY } = getDrawOffset(
    viewport,
    gridWidth,
    gridHeight,
    canvasElWidth,
    canvasElHeight
  )
  const { zoom } = viewport

  return (
    <KonvaLayer listening={false}>
      <Group x={startX} y={startY} listening={false}>
        {layers.map((layer) => {
          if (!layer.visible) return null

          const pixels = layer.pixels
          const rects = []

          for (let y = 0; y < pixels.length; y++) {
            for (let x = 0; x < pixels[y].length; x++) {
              const color = pixels[y][x]
              if (color.a === 0) continue

              if (
                selection?.floatingPixels &&
                selection.originalArea &&
                layer.id === activeLayerId
              ) {
                const { originalArea } = selection
                if (
                  x >= originalArea.x &&
                  x < originalArea.x + originalArea.width &&
                  y >= originalArea.y &&
                  y < originalArea.y + originalArea.height
                ) {
                  continue
                }
              }

              rects.push(
                <Rect
                  key={`${layer.id}-${x}-${y}`}
                  x={Math.round(x * zoom)}
                  y={Math.round(y * zoom)}
                  width={zoom + 0.5}
                  height={zoom + 0.5}
                  fill={rgbaToString(color)}
                  listening={false}
                  perfectDrawEnabled={false}
                />
              )
            }
          }

          return (
            <Group key={layer.id} opacity={layer.opacity / 100} listening={false}>
              {rects}
            </Group>
          )
        })}
      </Group>
    </KonvaLayer>
  )
}

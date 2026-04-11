'use client'

import { useRef, useEffect } from 'react'
import { Layer, Group, Rect, Transformer } from 'react-konva'
import Konva from 'konva'

import type { ViewportState, SelectionState } from '@/app/editor/types'
import { rgbaToString } from '@/app/editor/lib'
import { useSpriteEditorStore } from '@/app/editor/stores'

interface SelectionOverlayProps {
  readonly selection: SelectionState
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
  const startX = Math.round(canvasWidth / 2 - (gridWidth * zoom) / 2) + offsetX
  const startY = Math.round(canvasHeight / 2 - (gridHeight * zoom) / 2) + offsetY
  return { startX, startY }
}

export const SelectionOverlay = ({
  selection,
  viewport,
  gridWidth,
  gridHeight,
  canvasElWidth,
  canvasElHeight,
}: SelectionOverlayProps) => {
  const groupRef = useRef<Konva.Group>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const setSelectionTransform = useSpriteEditorStore((state) => state.setSelectionTransform)

  const { startX, startY } = getDrawOffset(
    viewport,
    gridWidth,
    gridHeight,
    canvasElWidth,
    canvasElHeight
  )
  const { zoom } = viewport

  useEffect(() => {
    if (selection.floatingPixels && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [selection.floatingPixels])

  const rects = []
  if (selection.floatingPixels) {
    for (let y = 0; y < selection.floatingPixels.length; y++) {
      for (let x = 0; x < selection.floatingPixels[y].length; x++) {
        const color = selection.floatingPixels[y][x]
        if (color.a === 0) continue

        rects.push(
          <Rect
            key={`floating-${x}-${y}`}
            x={x * zoom}
            y={y * zoom}
            width={zoom}
            height={zoom}
            fill={rgbaToString(color)}
          />
        )
      }
    }
  }

  const baseX = startX + selection.rect.x * zoom
  const baseY = startY + selection.rect.y * zoom

  return (
    <Layer>
      <Group
        ref={groupRef}
        x={baseX}
        y={baseY}
        draggable={!!selection.floatingPixels}
        visible={!!selection.floatingPixels}
        rotation={selection.rotation || 0}
        scaleX={selection.scaleX || 1}
        scaleY={selection.scaleY || 1}
        onDragEnd={(e) => {
          const node = e.target
          const screenX = node.x() - startX
          const screenY = node.y() - startY
          const gridX = Math.round(screenX / zoom)
          const gridY = Math.round(screenY / zoom)

          setSelectionTransform({
            x: gridX,
            y: gridY,
            rotation: node.rotation(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
          })

          node.position({
            x: startX + gridX * zoom,
            y: startY + gridY * zoom,
          })
        }}
        onTransformEnd={() => {
          const node = groupRef.current
          if (!node) return
          const screenX = node.x() - startX
          const screenY = node.y() - startY
          const gridX = Math.round(screenX / zoom)
          const gridY = Math.round(screenY / zoom)

          setSelectionTransform({
            x: gridX,
            y: gridY,
            rotation: node.rotation(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
          })

          node.position({
            x: startX + gridX * zoom,
            y: startY + gridY * zoom,
          })
        }}
        onMouseEnter={(e) => {
          const stage = e.target.getStage()
          if (stage) stage.container().style.cursor = 'move'
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage()
          if (stage) stage.container().style.cursor = 'crosshair'
        }}
      >
        <Rect
          x={0}
          y={0}
          width={selection.rect.width * zoom}
          height={selection.rect.height * zoom}
          fill="transparent"
        />
        {rects}
      </Group>

      {selection.floatingPixels && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => newBox}
          keepRatio={false}
          rotateEnabled={false}
          padding={5}
          anchorSize={8}
          anchorCornerRadius={4}
          borderStroke="#00f5ff"
          anchorStroke="#00f5ff"
          anchorFill="#00f5ff"
          borderDash={[5, 3]}
        />
      )}

      <Rect
        visible={!selection.floatingPixels}
        x={baseX}
        y={baseY}
        width={selection.rect.width * zoom}
        height={selection.rect.height * zoom}
        stroke="#00f5ff"
        strokeWidth={1.5}
        dash={[5, 3]}
        listening={false}
      />
    </Layer>
  )
}

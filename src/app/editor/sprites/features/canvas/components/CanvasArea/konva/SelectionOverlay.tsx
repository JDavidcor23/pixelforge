'use client'

import { useRef, useEffect, useMemo } from 'react'
import { Layer, Group, Rect, Transformer, Image } from 'react-konva'
import Konva from 'konva'

import type { ViewportState, SelectionState, RgbaColor } from '@/app/editor/types'
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
  const startX = Math.round(canvasWidth / 2 - (gridWidth * zoom) / 2 + offsetX)
  const startY = Math.round(canvasHeight / 2 - (gridHeight * zoom) / 2 + offsetY)
  return { startX, startY }
}

function renderPixelsToCanvas(pixels: RgbaColor[][]): HTMLCanvasElement | null {
  const height = pixels.length
  if (height === 0) return null
  const width = pixels[0]?.length || 0
  if (width === 0) return null

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.imageSmoothingEnabled = false

  const imageData = ctx.createImageData(width, height)
  let i = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = pixels[y][x]
      imageData.data[i++] = color.r
      imageData.data[i++] = color.g
      imageData.data[i++] = color.b
      imageData.data[i++] = color.a
    }
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas
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

  const floatingCanvas = useMemo(() => {
    if (!selection.floatingPixels) return null
    return renderPixelsToCanvas(selection.floatingPixels)
  }, [selection.floatingPixels])

  const baseX = startX + selection.rect.x * zoom
  const baseY = startY + selection.rect.y * zoom

  return (
    <Layer imageSmoothingEnabled={false}>
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
        {floatingCanvas && (
          <Image
            image={floatingCanvas}
            x={0}
            y={0}
            width={selection.rect.width * zoom}
            height={selection.rect.height * zoom}
            listening={false}
            imageSmoothingEnabled={false}
          />
        )}
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

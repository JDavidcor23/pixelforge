'use client'

import { useMemo } from 'react'
import { Layer as KonvaLayer, Group, Image } from 'react-konva'
import type { Layer, ViewportState, SelectionState, RgbaColor } from '@/app/editor/types'

interface SpriteLayersProps {
  readonly layers: Layer[]
  readonly viewport: ViewportState
  readonly gridWidth: number
  readonly gridHeight: number
  readonly canvasElWidth: number
  readonly canvasElHeight: number
  readonly activeLayerId: string
  readonly selection: SelectionState | null
  readonly onionSkinEnabled: boolean
  readonly previousFrameLayers: Layer[] | null
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

function renderPixelsToCanvas(
  pixels: RgbaColor[][],
  selection?: SelectionState | null,
  activeLayerId?: string,
  layerId?: string
): HTMLCanvasElement | null {
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
      
      let skip = false
      if (
        selection?.floatingPixels &&
        selection.originalArea &&
        layerId === activeLayerId
      ) {
        const { originalArea } = selection
        if (
          x >= originalArea.x &&
          x < originalArea.x + originalArea.width &&
          y >= originalArea.y &&
          y < originalArea.y + originalArea.height
        ) {
          skip = true
        }
      }

      imageData.data[i++] = color.r
      imageData.data[i++] = color.g
      imageData.data[i++] = color.b
      imageData.data[i++] = skip ? 0 : color.a
    }
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

const SpriteLayerImage = ({
  layer,
  zoom,
  selection,
  activeLayerId,
}: {
  layer: Layer
  zoom: number
  selection?: SelectionState | null
  activeLayerId?: string
}) => {
  const canvas = useMemo(() => {
    return renderPixelsToCanvas(layer.pixels, selection, activeLayerId, layer.id)
  }, [layer.pixels, selection, activeLayerId, layer.id])

  if (!canvas) return null

  const effectiveOpacity = layer.opacity / 100

  return (
    <Image
      image={canvas}
      x={0}
      y={0}
      width={canvas.width * zoom}
      height={canvas.height * zoom}
      opacity={effectiveOpacity}
      listening={false}
      imageSmoothingEnabled={false}
    />
  )
}

const OnionLayerImage = ({ layer, zoom }: { layer: Layer; zoom: number }) => {
  const canvas = useMemo(() => {
    return renderPixelsToCanvas(layer.pixels)
  }, [layer.pixels])

  if (!canvas) return null

  return (
    <Image
      image={canvas}
      x={0}
      y={0}
      width={canvas.width * zoom}
      height={canvas.height * zoom}
      opacity={0.3}
      listening={false}
      imageSmoothingEnabled={false}
    />
  )
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
  onionSkinEnabled,
  previousFrameLayers,
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
    <KonvaLayer listening={false} imageSmoothingEnabled={false}>
      <Group x={startX} y={startY} listening={false}>
        {/* Onion skin: previous frame rendered dimmed */}
        {onionSkinEnabled &&
          previousFrameLayers &&
          previousFrameLayers.map((layer) => {
            if (!layer.visible) return null
            return <OnionLayerImage key={`onion-${layer.id}`} layer={layer} zoom={zoom} />
          })}

        {/* Current frame layers */}
        {layers.map((layer) => {
          if (!layer.visible) return null
          return (
            <SpriteLayerImage
              key={layer.id}
              layer={layer}
              zoom={zoom}
              selection={selection}
              activeLayerId={activeLayerId}
            />
          )
        })}
      </Group>
    </KonvaLayer>
  )
}

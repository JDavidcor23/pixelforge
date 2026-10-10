import { useMemo } from 'react'
import { Layer as KonvaLayer, Group, Image } from 'react-konva'
import type { Layer, ViewportState, SelectionState } from '@/types'
import { getDrawOffset, renderPixelsToCanvas } from '@/lib/buffer-to-canvas'

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
  /** Per-layer dirty counter from the core (judgment-day round 2, finding 1) — see `SpriteLayerImage`'s render-contract comment below. */
  readonly layerRevisions: Readonly<Record<string, number>>
}

const SpriteLayerImage = ({
  layer,
  zoom,
  selection,
  activeLayerId,
  revision,
}: {
  layer: Layer
  zoom: number
  selection?: SelectionState | null
  activeLayerId?: string
  revision: number
}) => {
  const canvas = useMemo(() => {
    // Punch the floating-selection hole out of the layer it was lifted from,
    // so the dragged copy doesn't show through twice.
    const maskRect =
      selection?.floatingPixels && selection.originalArea && layer.id === activeLayerId
        ? {
            x: selection.originalArea.x,
            y: selection.originalArea.y,
            w: selection.originalArea.width,
            h: selection.originalArea.height,
          }
        : null
    return renderPixelsToCanvas(layer.pixels, { maskRect })
    // judgment-day round 2 (finding 1, CRITICAL): keyed on `revision`
    // (the core's per-layer dirty counter), NOT `layer.pixels` identity.
    // `stroke.points` mutates ONE buffer in place across an entire drag
    // gesture (phase 2c's "zero clones per batch" perf fix) and republishes
    // the SAME reference every pointer move — memoizing on buffer identity
    // means this canvas never regenerates mid-stroke. `revision` is the
    // render contract a future Wasm core needs too: its buffers are views,
    // where identity is meaningless, but a revision counter is cheap to
    // expose regardless of where the bytes live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, selection, activeLayerId, layer.id])

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

const OnionLayerImage = ({ layer, zoom, revision }: { layer: Layer; zoom: number; revision: number }) => {
  const canvas = useMemo(() => {
    return renderPixelsToCanvas(layer.pixels)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, layer.id])

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
  layerRevisions,
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
            return (
              <OnionLayerImage
                key={`onion-${layer.id}`}
                layer={layer}
                zoom={zoom}
                revision={layerRevisions[layer.id] ?? 0}
              />
            )
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
              revision={layerRevisions[layer.id] ?? 0}
            />
          )
        })}
      </Group>
    </KonvaLayer>
  )
}

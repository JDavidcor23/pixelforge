import type { HistoryEntry, Layer } from '@/app/editor/types'
import { cloneBuffer } from './pixel-buffer'

export function cloneLayers(layers: Layer[]): Layer[] {
  return layers.map((layer) => ({
    ...layer,
    pixels: cloneBuffer(layer.pixels),
  }))
}

export function createSnapshot(
  layers: Layer[],
  activeLayerId: string,
  description: string
): HistoryEntry {
  return {
    layers: cloneLayers(layers),
    activeLayerId,
    description,
  }
}


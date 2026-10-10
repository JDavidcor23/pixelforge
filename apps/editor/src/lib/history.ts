import type { AnimationFrame, HistoryEntry, Layer } from '@/app/editor/types'
import { cloneBuffer } from './pixel-buffer'

export function cloneLayers(layers: Layer[]): Layer[] {
  return layers.map((layer) => ({
    ...layer,
    pixels: cloneBuffer(layer.pixels),
  }))
}

export function cloneFrames(frames: AnimationFrame[]): AnimationFrame[] {
  return frames.map((frame) => ({
    ...frame,
    layers: cloneLayers(frame.layers),
  }))
}

export function createSnapshot(
  layers: Layer[],
  activeLayerId: string,
  description: string,
  frames: AnimationFrame[],
  currentFrameIndex: number
): HistoryEntry {
  return {
    layers: cloneLayers(layers),
    activeLayerId,
    description,
    frames: cloneFrames(frames),
    currentFrameIndex,
  }
}



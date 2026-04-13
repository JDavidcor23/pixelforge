import type { StateCreator } from 'zustand'

import type { SpriteEditorStore } from '@/app/editor/types'
import {
  setPixelInBuffer,
  floodFill as floodFillBuffer,
  createEmptyBuffer,
} from '@/app/editor/lib'

import type { PixelSlice } from '../types/slices'

export const createPixelSlice: StateCreator<
  SpriteEditorStore,
  [['zustand/persist', unknown]],
  [],
  PixelSlice
> = (set, get) => ({
  setPixel: (layerId, x, y, color) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId
          ? { ...layer, pixels: setPixelInBuffer(layer.pixels, x, y, color) }
          : layer
      ),
    })),

  setPixelBatch: (layerId, pixels) =>
    set((state) => ({
      layers: state.layers.map((layer) => {
        if (layer.id !== layerId) return layer

        let buffer = layer.pixels
        for (const { coord, color } of pixels) {
          buffer = setPixelInBuffer(buffer, coord.x, coord.y, color)
        }

        return { ...layer, pixels: buffer }
      }),
    })),

  floodFill: (layerId, x, y, color) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId
          ? { ...layer, pixels: floodFillBuffer(layer.pixels, x, y, color) }
          : layer
      ),
    })),

  clearLayer: (layerId) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId
          ? {
              ...layer,
              pixels: createEmptyBuffer(state.canvasWidth, state.canvasHeight),
            }
          : layer
      ),
    })),
})

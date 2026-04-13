import type { StateCreator } from 'zustand'

import type { PixelBuffer, SpriteEditorStore } from '@/app/editor/types'
import { transformPixels } from '@/app/editor/lib'

import type { SelectionSlice } from '../types/slices'

export const createSelectionSlice: StateCreator<
  SpriteEditorStore,
  [['zustand/persist', unknown]],
  [],
  SelectionSlice
> = (set) => ({
  selection: null,

  setSelection: (selection) => set({ selection }),

  floatSelection: () =>
    set((state) => {
      if (!state.selection || state.selection.floatingPixels) return {}

      const { rect } = state.selection
      const activeLayer = state.layers.find((l) => l.id === state.activeLayerId)
      if (!activeLayer) return {}

      const captured: PixelBuffer = []
      for (let y = 0; y < rect.height; y++) {
        captured[y] = []
        for (let x = 0; x < rect.width; x++) {
          const pxY = rect.y + y
          const pxX = rect.x + x
          if (
            pxY >= 0 &&
            pxY < state.canvasHeight &&
            pxX >= 0 &&
            pxX < state.canvasWidth
          ) {
            captured[y][x] = activeLayer.pixels[pxY][pxX]
          } else {
            captured[y][x] = { r: 0, g: 0, b: 0, a: 0 }
          }
        }
      }

      return {
        selection: {
          ...state.selection,
          floatingPixels: captured,
          originalArea: { ...rect },
        },
      }
    }),

  setSelectionTransform: ({ x, y, rotation, scaleX, scaleY }) =>
    set((state) => {
      if (!state.selection) return state
      return {
        selection: {
          ...state.selection,
          rect: { ...state.selection.rect, x, y },
          rotation,
          scaleX,
          scaleY,
        },
      }
    }),

  commitTransformation: () =>
    set((state) => {
      if (!state.selection || !state.selection.floatingPixels) return {}

      const { rect, floatingPixels, originalArea, rotation, scaleX, scaleY } = state.selection
      const activeLayerId = state.activeLayerId

      const newLayers = state.layers.map((layer) => {
        if (layer.id !== activeLayerId) return layer

        const buffer = layer.pixels.map((row) => [...row])

        if (originalArea) {
          for (let y = 0; y < originalArea.height; y++) {
            for (let x = 0; x < originalArea.width; x++) {
              const pixelY = Math.floor(originalArea.y + y)
              const pixelX = Math.floor(originalArea.x + x)
              if (
                pixelY >= 0 &&
                pixelY < state.canvasHeight &&
                pixelX >= 0 &&
                pixelX < state.canvasWidth
              ) {
                buffer[pixelY][pixelX] = { r: 0, g: 0, b: 0, a: 0 }
              }
            }
          }
        }

        const bakedPixels = transformPixels(
          floatingPixels,
          rotation || 0,
          scaleX || 1,
          scaleY || 1,
          state.canvasWidth,
          state.canvasHeight,
          rect.x,
          rect.y
        )

        for (let y = 0; y < state.canvasHeight; y++) {
          for (let x = 0; x < state.canvasWidth; x++) {
            const color = bakedPixels[y][x]
            if (color.a > 0) {
              buffer[y][x] = color
            }
          }
        }

        return { ...layer, pixels: buffer }
      })

      return {
        layers: newLayers,
        selection: null,
      }
    }),
})

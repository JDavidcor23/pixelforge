import type { StateCreator } from 'zustand'

import type { PixelBuffer, SpriteEditorStore } from '@/app/editor/types'

import type { ClipboardSlice } from '../types/slices'

export const createClipboardSlice: StateCreator<
  SpriteEditorStore,
  [['zustand/persist', unknown]],
  [],
  ClipboardSlice
> = (set) => ({
  clipboard: null,

  copySelection: () =>
    set((state) => {
      if (!state.selection) return {}

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
            captured[y][x] = { ...activeLayer.pixels[pxY][pxX] }
          } else {
            captured[y][x] = { r: 0, g: 0, b: 0, a: 0 }
          }
        }
      }

      return { clipboard: captured }
    }),

  cutSelection: () =>
    set((state) => {
      if (!state.selection) return {}

      const { rect } = state.selection
      const activeLayer = state.layers.find((l) => l.id === state.activeLayerId)
      if (!activeLayer) return {}

      // Capture pixels into clipboard
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
            captured[y][x] = { ...activeLayer.pixels[pxY][pxX] }
          } else {
            captured[y][x] = { r: 0, g: 0, b: 0, a: 0 }
          }
        }
      }

      // Erase selection from layer
      const newLayers = state.layers.map((layer) => {
        if (layer.id !== state.activeLayerId) return layer

        const buffer = layer.pixels.map((row) => [...row])
        for (let y = 0; y < rect.height; y++) {
          for (let x = 0; x < rect.width; x++) {
            const pxY = rect.y + y
            const pxX = rect.x + x
            if (
              pxY >= 0 &&
              pxY < state.canvasHeight &&
              pxX >= 0 &&
              pxX < state.canvasWidth
            ) {
              buffer[pxY][pxX] = { r: 0, g: 0, b: 0, a: 0 }
            }
          }
        }

        return { ...layer, pixels: buffer }
      })

      return { clipboard: captured, layers: newLayers, selection: null }
    }),

  deleteSelection: () =>
    set((state) => {
      if (!state.selection) return {}

      const { rect } = state.selection
      const activeLayerId = state.activeLayerId

      return {
        layers: state.layers.map((layer) => {
          if (layer.id !== activeLayerId) return layer

          const buffer = layer.pixels.map((row) => [...row])
          for (let y = 0; y < rect.height; y++) {
            for (let x = 0; x < rect.width; x++) {
              const pxY = rect.y + y
              const pxX = rect.x + x
              if (
                pxY >= 0 &&
                pxY < state.canvasHeight &&
                pxX >= 0 &&
                pxX < state.canvasWidth
              ) {
                buffer[pxY][pxX] = { r: 0, g: 0, b: 0, a: 0 }
              }
            }
          }

          return { ...layer, pixels: buffer }
        }),
        selection: null,
      }
    }),
})

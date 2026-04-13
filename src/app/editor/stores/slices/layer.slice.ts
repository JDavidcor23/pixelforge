import type { StateCreator } from 'zustand'

import type { Layer, SpriteEditorStore } from '@/app/editor/types'
import { SPRITE_EDITOR_DEFAULTS } from '@/app/editor/constants'
import { createEmptyBuffer } from '@/app/editor/lib'

import type { LayerSlice } from '../types/slices'
import { initialLayer } from '../helpers'

export const createLayerSlice: StateCreator<
  SpriteEditorStore,
  [['zustand/persist', unknown]],
  [],
  LayerSlice
> = (set) => ({
  layers: [initialLayer],
  activeLayerId: initialLayer.id,

  addLayer: () =>
    set((state) => {
      const newLayer: Layer = {
        id: crypto.randomUUID(),
        name: `${SPRITE_EDITOR_DEFAULTS.LAYER_NAME_PREFIX} ${state.layers.length + 1}`,
        visible: true,
        locked: false,
        opacity: 100,
        pixels: createEmptyBuffer(state.canvasWidth, state.canvasHeight),
      }

      return {
        layers: [...state.layers, newLayer],
        activeLayerId: newLayer.id,
      }
    }),

  removeLayer: (id) =>
    set((state) => {
      if (state.layers.length <= 1) return state

      const filtered = state.layers.filter((layer) => layer.id !== id)
      const activeLayerId =
        state.activeLayerId === id ? filtered[0].id : state.activeLayerId

      return { layers: filtered, activeLayerId }
    }),

  toggleLayerVisibility: (id) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      ),
    })),

  toggleLayerLock: (id) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, locked: !layer.locked } : layer
      ),
    })),

  setLayerOpacity: (id, opacity) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, opacity } : layer
      ),
    })),

  reorderLayers: (fromIndex, toIndex) =>
    set((state) => {
      const newLayers = [...state.layers]
      const [moved] = newLayers.splice(fromIndex, 1)
      newLayers.splice(toIndex, 0, moved)

      return { layers: newLayers }
    }),

  setActiveLayer: (id) => set({ activeLayerId: id }),

  updateLayerName: (id, name) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, name } : layer
      ),
    })),
})

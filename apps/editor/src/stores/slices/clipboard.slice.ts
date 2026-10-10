import type { StateCreator } from 'zustand'

import type { SpriteEditorStore } from '@/types'
import { createEmptyBuffer, getPixel, putPixel } from '@/lib'
import { TRANSPARENT_COLOR } from '@/constants'

import type { ClipboardSlice } from '../types/slices'

export const createClipboardSlice: StateCreator<
  SpriteEditorStore,
  [['zustand/persist', unknown]],
  [],
  ClipboardSlice
> = (set, get) => ({
  clipboard: null,

  copySelection: () =>
    set((state) => {
      if (!state.selection) return {}

      const { rect } = state.selection
      const activeLayer = state.layers.find((l) => l.id === state.activeLayerId)
      if (!activeLayer) return {}

      const captured = createEmptyBuffer(rect.width, rect.height)
      for (let y = 0; y < rect.height; y++) {
        for (let x = 0; x < rect.width; x++) {
          const pxY = rect.y + y
          const pxX = rect.x + x
          const color =
            pxY >= 0 && pxY < state.canvasHeight && pxX >= 0 && pxX < state.canvasWidth
              ? getPixel(activeLayer.pixels, pxX, pxY)
              : TRANSPARENT_COLOR
          putPixel(captured, x, y, color)
        }
      }

      return { clipboard: captured }
    }),

  /**
   * Captures the selection into the clipboard AND erases it from the active
   * layer. The erase is routed through `dispatch({type:'region.clear'})`
   * (phase 2b, design D3) instead of a direct `set({layers})` — same rect,
   * same per-pixel bounds clipping, single owner for the write.
   */
  cutSelection: () => {
    const state = get()
    if (!state.selection) return

    const { rect } = state.selection
    const activeLayer = state.layers.find((l) => l.id === state.activeLayerId)
    if (!activeLayer) return

    const captured = createEmptyBuffer(rect.width, rect.height)
    for (let y = 0; y < rect.height; y++) {
      for (let x = 0; x < rect.width; x++) {
        const pxY = rect.y + y
        const pxX = rect.x + x
        const inBounds = pxY >= 0 && pxY < state.canvasHeight && pxX >= 0 && pxX < state.canvasWidth
        putPixel(captured, x, y, inBounds ? getPixel(activeLayer.pixels, pxX, pxY) : TRANSPARENT_COLOR)
      }
    }

    get().dispatch({
      type: 'region.clear',
      layerId: state.activeLayerId,
      rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
    })
    set({ clipboard: captured, selection: null })
  },

  /**
   * Erases the selection from the active layer. Routed through
   * `dispatch({type:'region.clear'})` — see `cutSelection`.
   */
  deleteSelection: () => {
    const state = get()
    if (!state.selection) return

    const { rect } = state.selection
    get().dispatch({
      type: 'region.clear',
      layerId: state.activeLayerId,
      rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
    })
    set({ selection: null })
  },
})

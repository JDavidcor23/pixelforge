import type { StateCreator } from 'zustand'

import type { EditorPrefsStore } from '@/app/editor/types'
import { SPRITE_EDITOR_CANVAS } from '@/app/editor/constants'

import type { ViewportSlice } from '../types/slices'

export const createViewportSlice: StateCreator<
  EditorPrefsStore,
  [['zustand/persist', unknown]],
  [],
  ViewportSlice
> = (set, get) => ({
  viewport: {
    zoom: SPRITE_EDITOR_CANVAS.DEFAULT_ZOOM,
    offsetX: 0,
    offsetY: 0,
  },

  setZoom: (zoom) =>
    set({
      viewport: {
        ...get().viewport,
        zoom: Math.max(
          SPRITE_EDITOR_CANVAS.MIN_ZOOM,
          Math.min(SPRITE_EDITOR_CANVAS.MAX_ZOOM, zoom)
        ),
      },
    }),

  setViewportOffset: (x, y) =>
    set((state) => ({
      viewport: { ...state.viewport, offsetX: x, offsetY: y },
    })),
})

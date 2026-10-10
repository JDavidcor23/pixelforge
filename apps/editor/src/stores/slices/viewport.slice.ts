import type { StateCreator } from 'zustand'

import type { EditorPrefsStore } from '@/types'
import { SPRITE_EDITOR_CANVAS } from '@/constants'

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

  /**
   * Offset 0,0 IS the centre: every drawing helper computes its origin as
   * `canvasSize / 2 - gridSize * zoom / 2 + offset`, so zeroing the offset puts
   * the sprite dead centre regardless of viewport size or grid dimensions.
   *
   * Zoom and offset are written in ONE `set` call on purpose — doing it as
   * setZoom + setViewportOffset would publish an intermediate state where the
   * new zoom is paired with the old pan, and the canvas would visibly jump
   * before settling.
   */
  resetViewport: () =>
    set({
      viewport: {
        zoom: SPRITE_EDITOR_CANVAS.RESET_VIEW_ZOOM,
        offsetX: 0,
        offsetY: 0,
      },
    }),
})

import type { StateCreator } from 'zustand'

import type { EditorPrefsStore } from '@/types'
import { SPRITE_EDITOR_CANVAS } from '@/constants'

import type { ViewportSlice } from '../types/slices'

/** Shared clamp — the one place `zoom` is kept inside [MIN_ZOOM, MAX_ZOOM]. */
const clampZoom = (zoom: number) =>
  Math.max(SPRITE_EDITOR_CANVAS.MIN_ZOOM, Math.min(SPRITE_EDITOR_CANVAS.MAX_ZOOM, zoom))

/**
 * Center-view zoom for a given canvas size, anchored to the 900%-at-64px
 * baseline (`SPRITE_EDITOR_CANVAS.RESET_VIEW_ZOOM`) so the sprite's ON-SCREEN
 * pixel size at center-view stays roughly constant regardless of resolution —
 * a 128x128 canvas renders at ~450%, a 256x256 canvas at ~225%, instead of
 * all three overflowing the viewport at the same flat 900%.
 *
 * Exported so `useCanvasOverlay.hook.ts` and `useKeyboardShortcuts.hook.ts`
 * can derive the same `centerViewLabel`/`isViewCentered` value this slice
 * uses for the actual reset, instead of duplicating the arithmetic.
 */
export const getCenterViewZoom = (canvasWidth: number, canvasHeight: number) =>
  clampZoom(
    SPRITE_EDITOR_CANVAS.RESET_VIEW_ZOOM *
      (SPRITE_EDITOR_CANVAS.DEFAULT_WIDTH / Math.max(canvasWidth, canvasHeight))
  )

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
        zoom: clampZoom(zoom),
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
  resetViewport: (canvasWidth, canvasHeight) =>
    set({
      viewport: {
        zoom: getCenterViewZoom(canvasWidth, canvasHeight),
        offsetX: 0,
        offsetY: 0,
      },
    }),
})

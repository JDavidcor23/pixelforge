import type { StateCreator } from 'zustand'

import type { SpriteEditorStore } from '@/types'
import { cloneBuffer, createEmptyBuffer, getPixel, putPixel, transformPixels } from '@/lib'
import { diffRect, extractRect } from '@/lib/pixel-buffer'
import { TRANSPARENT_COLOR } from '@/constants'

import type { SelectionSlice } from '../types/slices'

export const createSelectionSlice: StateCreator<
  SpriteEditorStore,
  [['zustand/persist', unknown]],
  [],
  SelectionSlice
> = (set, get) => ({
  selection: null,

  setSelection: (selection) => set({ selection }),

  floatSelection: () =>
    set((state) => {
      if (!state.selection || state.selection.floatingPixels) return {}

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

      return {
        selection: {
          ...state.selection,
          floatingPixels: captured,
          originalArea: { ...rect },
          // Bug #3: bind the float to where it was lifted FROM — the only
          // thing `commitTransformation` is allowed to bake into later,
          // regardless of what the user switches to while it's floating.
          sourceFrameId: state.timeline.frames[state.timeline.currentFrameIndex]?.id,
          sourceLayerId: state.activeLayerId,
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

  /**
   * Bakes the floating selection back into the active layer. Routed through
   * `dispatch({type:'selection.commit'})` (phase 2b, design D3) — the
   * baking math (transform + erase-original-area) is unchanged, only the
   * final write moves from a direct `set({layers})` to the core API, so
   * there's a single owner for the layer's pixels.
   *
   * Phase 2e: `selection.commit`'s payload is now a RECT PATCH, not a
   * whole-canvas buffer — baking still happens here (stays in the TS
   * selection slice, per design), but only the smallest changed rect is
   * sent to the core (`diffRect`/`extractRect`, the same dirty-rect helpers
   * the core itself uses for undo patches).
   *
   * Bug #3 (floating selection baked into the wrong layer/frame): a float
   * is bound to the frame+layer it was lifted FROM (`sourceFrameId`/
   * `sourceLayerId`, set by `floatSelection`), never to whatever is active
   * NOW. Every action that can change the active layer/frame or the
   * document's structure (`setActiveLayer`, `setCurrentFrame`, `addLayer`/
   * `removeLayer`, `addFrame`/`removeFrame`, `pasteFrames*`, `undo`/`redo`,
   * `overwriteWithPixels`/`importAnimationFrames`) commits (or cancels) the
   * float BEFORE actually switching — see those slices' guard calls — so by
   * the time we get here the current frame/layer should always still BE the
   * source. The lookup below is the defensive half of that contract: if the
   * source frame or layer no longer exists, or somehow isn't current any
   * more, the float is CANCELLED (discarded) instead of silently baking
   * into whatever happens to be active.
   */
  commitTransformation: () => {
    const state = get()
    if (!state.selection || !state.selection.floatingPixels) return

    const { rect, floatingPixels, originalArea, rotation, scaleX, scaleY, sourceFrameId, sourceLayerId } = state.selection

    const activeFrame = state.timeline.frames[state.timeline.currentFrameIndex]
    const frame = sourceFrameId ? state.timeline.frames.find((f) => f.id === sourceFrameId) : activeFrame
    if (!frame || frame.id !== activeFrame?.id) {
      set({ selection: null }) // source frame no longer exists (or isn't current) — cancel, never bake into the wrong frame
      return
    }

    const activeLayerId = sourceLayerId ?? state.activeLayerId
    const layer = frame.layers.find((l) => l.id === activeLayerId)
    if (!layer) {
      set({ selection: null }) // source layer no longer exists — cancel, never bake into the wrong layer
      return
    }

    const buffer = cloneBuffer(layer.pixels)

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
            putPixel(buffer, pixelX, pixelY, TRANSPARENT_COLOR)
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
        const color = getPixel(bakedPixels, x, y)
        if (color.a > 0) {
          putPixel(buffer, x, y, color)
        }
      }
    }

    const changedRect = diffRect(layer.pixels, buffer)
    if (changedRect) {
      const patch = extractRect(buffer, changedRect)
      get().dispatch({
        type: 'selection.commit',
        layerId: activeLayerId,
        at: changedRect,
        pixels: new Uint8ClampedArray(patch.buffer, patch.byteOffset, patch.byteLength),
      })
    }
    set({ selection: null })
  },
})

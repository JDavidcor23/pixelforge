import type { StateCreator } from 'zustand'

import type { SpriteEditorStore } from '@/types'
import { SPRITE_EDITOR_TIMELINE } from '@/constants'

import type { TimelineSlice } from '../types/slices'
import { initialLayer, createInitialFrame } from '../helpers'

/**
 * Phase 2b (design D3): `saveCurrentFrameSnapshot`/`restoreFrameSnapshot`
 * were removed. They existed only to keep a second, independently-mutated
 * copy of "the current frame's layers" (`state.layers`) in sync with
 * `timeline.frames[i].layers` around a frame switch — the exact duplication
 * design.md's Code Facts flagged. Now that `timeline.frames[i].layers` is
 * the only copy (see `lib/core/ts-core.ts`), switching frames is just
 * `dispatch({ type: 'frame.select', index })` — there is nothing to save or
 * restore, because nothing was ever copied out in the first place.
 *
 * Phase 2c (judgment-day fixes): `setFps`/`toggleLoop`/`setFrameSelection`
 * used to write `timeline` directly via `set({timeline...})`, bypassing
 * `dispatch` — exactly the "no direct `set({timeline})` that bypasses the
 * core for document data" the architecture decision called out. They now
 * route through `dispatch({type:'timeline.*'})` (`lib/core/commands.ts`),
 * which are non-undoable (playback/view prefs, not document edits) but
 * still have core as their single writer.
 */
export const createTimelineSlice: StateCreator<
  SpriteEditorStore,
  [['zustand/persist', unknown]],
  [],
  TimelineSlice
> = (_set, get) => ({
  timeline: {
    frames: [createInitialFrame([initialLayer], initialLayer.id)],
    currentFrameIndex: 0,
    isPlaying: false,
    fps: SPRITE_EDITOR_TIMELINE.DEFAULT_FPS,
    loop: true,
    selectedFrameIndices: [0],
  },
  frameClipboard: null,

  setFps: (fps) => {
    get().dispatch({ type: 'timeline.setFps', fps })
  },

  toggleLoop: () => {
    get().dispatch({ type: 'timeline.toggleLoop' })
  },

  setFrameSelection: (indices) => {
    get().dispatch({ type: 'timeline.setFrameSelection', indices })
  },
})

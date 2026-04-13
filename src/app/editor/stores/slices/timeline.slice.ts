import type { StateCreator } from 'zustand'

import type { SpriteEditorStore } from '@/app/editor/types'
import { SPRITE_EDITOR_TIMELINE } from '@/app/editor/constants'
import { cloneLayers } from '@/app/editor/lib'

import type { TimelineSlice } from '../types/slices'
import { initialLayer, createInitialFrame } from '../helpers'

export const createTimelineSlice: StateCreator<
  SpriteEditorStore,
  [['zustand/persist', unknown]],
  [],
  TimelineSlice
> = (set, get) => ({
  timeline: {
    frames: [createInitialFrame([initialLayer], initialLayer.id)],
    currentFrameIndex: 0,
    isPlaying: false,
    fps: SPRITE_EDITOR_TIMELINE.DEFAULT_FPS,
    loop: true,
    selectedFrameIndices: [0],
  },
  frameClipboard: null,

  saveCurrentFrameSnapshot: () => {
    const state = get()
    const { frames, currentFrameIndex } = state.timeline
    const frame = frames[currentFrameIndex]
    if (!frame) return

    const updatedFrames = frames.map((f, i) =>
      i === currentFrameIndex
        ? { ...f, layers: cloneLayers(state.layers), activeLayerId: state.activeLayerId }
        : f
    )

    set((s) => ({ timeline: { ...s.timeline, frames: updatedFrames } }))
  },

  restoreFrameSnapshot: (index) => {
    const state = get()
    const frame = state.timeline.frames[index]
    if (!frame) return

    set({
      layers: cloneLayers(frame.layers),
      activeLayerId: frame.activeLayerId,
    })
  },

  setFps: (fps) =>
    set((state) => ({
      timeline: {
        ...state.timeline,
        fps: Math.max(
          SPRITE_EDITOR_TIMELINE.MIN_FPS,
          Math.min(SPRITE_EDITOR_TIMELINE.MAX_FPS, fps)
        ),
      },
    })),

  toggleLoop: () =>
    set((state) => ({
      timeline: { ...state.timeline, loop: !state.timeline.loop },
    })),

  setFrameSelection: (indices) =>
    set((state) => ({
      timeline: { ...state.timeline, selectedFrameIndices: indices },
    })),
})

import type { StateCreator } from 'zustand'

import type { SpriteEditorStore } from '@/app/editor/types'
import { cloneLayers, cloneFrames } from '@/app/editor/lib'

import type { HistorySlice } from '../types/slices'

export const createHistorySlice: StateCreator<
  SpriteEditorStore,
  [['zustand/persist', unknown]],
  [],
  HistorySlice
> = (set) => ({
  history: [],
  historyIndex: -1,

  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state

      const newIndex = state.historyIndex - 1
      const entry = state.history[newIndex]

      return {
        historyIndex: newIndex,
        layers: cloneLayers(entry.layers),
        activeLayerId: entry.activeLayerId,
        timeline: {
          ...state.timeline,
          frames: cloneFrames(entry.frames),
          currentFrameIndex: entry.currentFrameIndex,
          selectedFrameIndices: [entry.currentFrameIndex],
        },
      }
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state

      const newIndex = state.historyIndex + 1
      const entry = state.history[newIndex]

      return {
        historyIndex: newIndex,
        layers: cloneLayers(entry.layers),
        activeLayerId: entry.activeLayerId,
        timeline: {
          ...state.timeline,
          frames: cloneFrames(entry.frames),
          currentFrameIndex: entry.currentFrameIndex,
          selectedFrameIndices: [entry.currentFrameIndex],
        },
      }
    }),
})

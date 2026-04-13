import type { StateCreator } from 'zustand'

import type { EditorUIStore } from '@/app/editor/types'

import type { UISlice } from '../types/slices'

export const createUISlice: StateCreator<
  EditorUIStore,
  [['zustand/persist', unknown]],
  [],
  UISlice
> = (set) => ({
  leftSidebarTab: 'layers',
  ui: {
    leftSidebarOpen: true,
    rightSidebarOpen: true,
    timelineOpen: true,
    toolbarOpen: true,
    toolbarPosition: null,
  },

  setLeftSidebarTab: (tab) => set({ leftSidebarTab: tab }),

  toggleLeftSidebar: () =>
    set((state) => ({
      ui: { ...state.ui, leftSidebarOpen: !state.ui.leftSidebarOpen },
    })),

  toggleRightSidebar: () =>
    set((state) => ({
      ui: { ...state.ui, rightSidebarOpen: !state.ui.rightSidebarOpen },
    })),

  toggleTimeline: () =>
    set((state) => ({
      ui: { ...state.ui, timelineOpen: !state.ui.timelineOpen },
    })),

  toggleToolbar: () =>
    set((state) => ({
      ui: { ...state.ui, toolbarOpen: !state.ui.toolbarOpen },
    })),

  toggleZenMode: () =>
    set((state) => {
      const anyOpen =
        state.ui.leftSidebarOpen ||
        state.ui.rightSidebarOpen ||
        state.ui.timelineOpen ||
        state.ui.toolbarOpen

      const newState = !anyOpen

      return {
        ui: {
          ...state.ui,
          leftSidebarOpen: newState,
          rightSidebarOpen: newState,
          timelineOpen: newState,
          toolbarOpen: newState,
        },
      }
    }),

  setToolbarPosition: (position) =>
    set((state) => ({
      ui: { ...state.ui, toolbarPosition: position },
    })),
})

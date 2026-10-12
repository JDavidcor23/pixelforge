import type { StateCreator } from 'zustand'

import { DEFAULT_ASSET_TYPE, DEFAULT_CREATE_METHOD, RESIZABLE_PANELS } from '@/constants'
import type { EditorUIStore } from '@/types'

import type { UISlice } from '../types/slices'

export const createUISlice: StateCreator<
  EditorUIStore,
  [['zustand/persist', unknown]],
  [],
  UISlice
> = (set) => ({
  settingsOpen: false,
  ui: {
    leftSidebarOpen: true,
    rightSidebarOpen: true,
    timelineOpen: true,
    toolbarOpen: true,
    toolbarPosition: null,
    inspectorTab: 'properties',
    bottomPanelTab: 'timeline',
    createMethod: DEFAULT_CREATE_METHOD,
    createAssetType: DEFAULT_ASSET_TYPE,
    focusPromptRequest: 0,
    leftSidebarWidth: RESIZABLE_PANELS.LEFT.DEFAULT,
    rightSidebarWidth: RESIZABLE_PANELS.RIGHT.DEFAULT,
    bottomPanelHeight: RESIZABLE_PANELS.BOTTOM.DEFAULT,
  },

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

  setInspectorTab: (tab) =>
    set((state) => ({
      ui: { ...state.ui, inspectorTab: tab },
    })),

  setBottomPanelTab: (tab) =>
    set((state) => ({
      ui: { ...state.ui, bottomPanelTab: tab },
    })),

  setCreateMethod: (method) =>
    set((state) => ({
      ui: { ...state.ui, createMethod: method },
    })),

  setCreateAssetType: (assetType) =>
    set((state) => ({
      ui: { ...state.ui, createAssetType: assetType },
    })),

  requestFocusPrompt: () =>
    set((state) => ({
      ui: { ...state.ui, focusPromptRequest: state.ui.focusPromptRequest + 1 },
    })),

  setLeftSidebarWidth: (width) =>
    set((state) => ({
      ui: {
        ...state.ui,
        leftSidebarWidth: Math.min(RESIZABLE_PANELS.LEFT.MAX, Math.max(RESIZABLE_PANELS.LEFT.MIN, width)),
      },
    })),

  setRightSidebarWidth: (width) =>
    set((state) => ({
      ui: {
        ...state.ui,
        rightSidebarWidth: Math.min(RESIZABLE_PANELS.RIGHT.MAX, Math.max(RESIZABLE_PANELS.RIGHT.MIN, width)),
      },
    })),

  setBottomPanelHeight: (height) =>
    set((state) => ({
      ui: {
        ...state.ui,
        bottomPanelHeight: Math.min(RESIZABLE_PANELS.BOTTOM.MAX, Math.max(RESIZABLE_PANELS.BOTTOM.MIN, height)),
      },
    })),

  resetPanelSizes: () =>
    set((state) => ({
      ui: {
        ...state.ui,
        leftSidebarWidth: RESIZABLE_PANELS.LEFT.DEFAULT,
        rightSidebarWidth: RESIZABLE_PANELS.RIGHT.DEFAULT,
        bottomPanelHeight: RESIZABLE_PANELS.BOTTOM.DEFAULT,
        leftSidebarOpen: true,
        rightSidebarOpen: true,
        timelineOpen: true,
      },
    })),

  openSettings: () => set({ settingsOpen: true }),

  closeSettings: () => set({ settingsOpen: false }),
})

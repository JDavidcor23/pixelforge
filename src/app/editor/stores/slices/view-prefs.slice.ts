import type { StateCreator } from 'zustand'

import type { EditorPrefsStore } from '@/app/editor/types'

import type { ViewPrefsSlice } from '../types/slices'

export const createViewPrefsSlice: StateCreator<
  EditorPrefsStore,
  [['zustand/persist', unknown]],
  [],
  ViewPrefsSlice
> = (set) => ({
  showGrid: true,
  onionSkinEnabled: true,

  setShowGrid: (show) => set({ showGrid: show }),

  toggleOnionSkin: () =>
    set((state) => ({ onionSkinEnabled: !state.onionSkinEnabled })),
})

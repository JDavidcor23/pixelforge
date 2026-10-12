import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { EditorPrefsStore } from '@/types'
import { PREFS_STORAGE_KEY } from '@/constants/persistence'

import { createPaletteSlice } from './slices/palette.slice'
import { createViewPrefsSlice } from './slices/view-prefs.slice'
import { createViewportSlice } from './slices/viewport.slice'

import { createIntegrationsSlice } from './slices/integrations.slice'

export const useEditorPrefsStore = create<EditorPrefsStore>()(
  persist(
    (set, get, api) => ({
      ...createViewportSlice(set, get, api),
      ...createViewPrefsSlice(set, get, api),
      ...createPaletteSlice(set, get, api),
      ...createIntegrationsSlice(set, get, api),
    }),
    {
      name: PREFS_STORAGE_KEY,
      partialize: (state) => ({
        palette: state.palette,
        showGrid: state.showGrid,
        onionSkinEnabled: state.onionSkinEnabled,
        retroDiffusionApiKey: state.retroDiffusionApiKey,
      }),
    }
  )
)

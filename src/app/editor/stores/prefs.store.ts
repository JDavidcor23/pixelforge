import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { EditorPrefsStore } from '@/app/editor/types'

import { createPaletteSlice } from './slices/palette.slice'
import { createViewPrefsSlice } from './slices/view-prefs.slice'
import { createViewportSlice } from './slices/viewport.slice'

export const useEditorPrefsStore = create<EditorPrefsStore>()(
  persist(
    (set, get, api) => ({
      ...createViewportSlice(set, get, api),
      ...createViewPrefsSlice(set, get, api),
      ...createPaletteSlice(set, get, api),
    }),
    {
      name: 'sprite-editor-prefs',
      partialize: (state) => ({
        palette: state.palette,
        showGrid: state.showGrid,
        onionSkinEnabled: state.onionSkinEnabled,
      }),
    }
  )
)

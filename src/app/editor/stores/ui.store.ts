import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { EditorUIStore } from '@/app/editor/types'

import { createUISlice } from './slices/ui.slice'

export const useEditorUIStore = create<EditorUIStore>()(
  persist(
    (set, get, api) => ({
      ...createUISlice(set, get, api),
    }),
    {
      name: 'sprite-editor-ui',
      partialize: (state) => ({
        ui: state.ui,
        leftSidebarTab: state.leftSidebarTab,
      }),
    }
  )
)

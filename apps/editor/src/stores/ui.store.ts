import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { EditorUIStore } from '@/types'

import { createUISlice } from './slices/ui.slice'

export const useEditorUIStore = create<EditorUIStore>()(
  persist(
    (set, get, api) => ({
      ...createUISlice(set, get, api),
    }),
    {
      name: 'sprite-editor-ui',
      // `focusPromptRequest` is a one-shot, session-only signal (see
      // EditorUIState.ui) — never persist it at a non-zero value, or
      // reloading the app with Create > Generate already selected would
      // steal focus into the prompt textarea on mount.
      partialize: (state) => ({
        ui: { ...state.ui, focusPromptRequest: 0 },
      }),
      // Default zustand/persist merge replaces `ui` wholesale with whatever
      // was persisted. Deep-merge it instead so a persisted snapshot taken
      // before a new `ui` field existed doesn't leave that field `undefined`
      // after hydration.
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<EditorUIStore> | undefined
        return {
          ...currentState,
          ...persisted,
          ui: { ...currentState.ui, ...persisted?.ui },
        }
      },
    }
  )
)

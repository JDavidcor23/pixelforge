import type { StateCreator } from 'zustand'
import type { EditorPrefsStore } from '../../types'

export interface IntegrationsSlice {
  pixellabApiKey: string | null
  setPixelLabApiKey: (key: string | null) => void
}

export const createIntegrationsSlice: StateCreator<
  EditorPrefsStore,
  [],
  [],
  IntegrationsSlice
> = (set) => ({
  pixellabApiKey: null,
  setPixelLabApiKey: (key) => set({ pixellabApiKey: key }),
})

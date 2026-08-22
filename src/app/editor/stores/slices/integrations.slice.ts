import type { StateCreator } from 'zustand'
import type { EditorPrefsStore } from '../../types'

export interface IntegrationsSlice {
  /** BYOK: when set, generations bill this user's own Retro Diffusion balance. */
  retroDiffusionApiKey: string | null
  setRetroDiffusionApiKey: (key: string | null) => void
}

export const createIntegrationsSlice: StateCreator<
  EditorPrefsStore,
  [],
  [],
  IntegrationsSlice
> = (set) => ({
  retroDiffusionApiKey: null,
  setRetroDiffusionApiKey: (key) => set({ retroDiffusionApiKey: key }),
})

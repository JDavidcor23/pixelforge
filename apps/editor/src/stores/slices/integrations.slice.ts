import type { StateCreator } from 'zustand'
import type { EditorPrefsStore } from '../../types'

export interface IntegrationsSlice {
  /** BYOK: when set, generations bill this user's own Retro Diffusion balance. */
  retroDiffusionApiKey: string | null
  /** BYOK: when set, animations bill this user's own PixelLab balance (ADR 0009). */
  pixelLabApiKey: string | null
  setRetroDiffusionApiKey: (key: string | null) => void
  setPixelLabApiKey: (key: string | null) => void
}

export const createIntegrationsSlice: StateCreator<
  EditorPrefsStore,
  [],
  [],
  IntegrationsSlice
> = (set) => ({
  retroDiffusionApiKey: null,
  pixelLabApiKey: null,
  setRetroDiffusionApiKey: (key) => set({ retroDiffusionApiKey: key }),
  setPixelLabApiKey: (key) => set({ pixelLabApiKey: key }),
})

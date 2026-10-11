import type { StateCreator } from 'zustand'

import type { AudioUISlice, SoundsStore } from '@/stores/types/audio-slices'

export const createAudioUISlice: StateCreator<
  SoundsStore,
  [['zustand/persist', unknown]],
  [],
  AudioUISlice
> = (set) => ({
  isNewSoundOpen: false,
  newSoundSection: 'presets',
  newSoundOpenCount: 0,
  newSoundPrompt: '',
  newSoundMode: 'sfx',
  pendingGenerations: [],
  generationError: null,
  pendingDeleteId: null,

  openNewSound: (request) =>
    set((state) => ({
      isNewSoundOpen: true,
      newSoundOpenCount: state.newSoundOpenCount + 1,
      newSoundSection: request?.section ?? 'presets',
      newSoundPrompt: request?.prompt ?? state.newSoundPrompt,
      newSoundMode: request?.mode ?? state.newSoundMode,
    })),

  closeNewSound: () => set({ isNewSoundOpen: false }),

  setNewSoundPrompt: (prompt) => set({ newSoundPrompt: prompt, generationError: null }),

  setNewSoundMode: (mode) => set({ newSoundMode: mode }),

  addPendingGeneration: (generation) =>
    set((state) => ({ pendingGenerations: [generation, ...state.pendingGenerations] })),

  removePendingGeneration: (id) =>
    set((state) => ({
      pendingGenerations: state.pendingGenerations.filter((g) => g.id !== id),
    })),

  setGenerationError: (error) => set({ generationError: error }),

  requestDelete: (id) => set({ pendingDeleteId: id }),

  cancelDelete: () => set({ pendingDeleteId: null }),
})

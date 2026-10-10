import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { SoundsStore } from '@/stores/types/audio-slices'
import { SOUNDS_STORE_KEY } from '@/constants/audio'
import { createAudioSynthSlice } from './slices/audio-synth.slice'
import { createAudioLibrarySlice } from './slices/audio-library.slice'
import { createAudioPlaybackSlice } from './slices/audio-playback.slice'

export const useSoundsStore = create<SoundsStore>()(
  persist(
    (...a) => ({
      ...createAudioSynthSlice(...a),
      ...createAudioLibrarySlice(...a),
      ...createAudioPlaybackSlice(...a),
    }),
    {
      name: SOUNDS_STORE_KEY,
      partialize: (state) => ({
        synthParams: state.synthParams,
        volume: state.volume,
        loop: state.loop,
        generationHistory: state.generationHistory,
      }),
    }
  )
)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { SoundsStore } from '@/stores/types/audio-slices'
import { SOUNDS_STORE_KEY } from '@/constants/audio'
import { createAudioSynthSlice } from './slices/audio-synth.slice'
import { createAudioLibrarySlice } from './slices/audio-library.slice'
import { createAudioPlaybackSlice } from './slices/audio-playback.slice'
import { createAudioUISlice } from './slices/audio-ui.slice'
import { createSoundTimelineSlice } from './slices/sound-timeline.slice'

export const useSoundsStore = create<SoundsStore>()(
  persist(
    (...a) => ({
      ...createAudioSynthSlice(...a),
      ...createAudioLibrarySlice(...a),
      ...createAudioPlaybackSlice(...a),
      ...createAudioUISlice(...a),
      ...createSoundTimelineSlice(...a),
    }),
    {
      name: SOUNDS_STORE_KEY,
      // The timeline is session-only: library assets are not persisted either,
      // so persisted clips would point at sources that no longer exist.
      partialize: (state) => ({
        synthParams: state.synthParams,
        volume: state.volume,
        loop: state.loop,
        generationHistory: state.generationHistory,
      }),
    }
  )
)

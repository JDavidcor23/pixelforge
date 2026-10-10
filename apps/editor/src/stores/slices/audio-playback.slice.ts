import type { StateCreator } from 'zustand'

import type { AudioPlaybackSlice, SoundsStore } from '@/stores/types/audio-slices'
import { DEFAULT_VOLUME } from '@/constants/audio'

export const createAudioPlaybackSlice: StateCreator<
  SoundsStore,
  [['zustand/persist', unknown]],
  [],
  AudioPlaybackSlice
> = (set) => ({
  playbackState: 'idle',
  currentTime: 0,
  duration: 0,
  volume: DEFAULT_VOLUME,
  loop: false,
  activeAssetId: null,

  setPlaybackState: (state) => set({ playbackState: state }),

  setCurrentTime: (time) => set({ currentTime: time }),

  setDuration: (duration) => set({ duration }),

  setVolume: (volume) => set({ volume }),

  setLoop: (loop) => set({ loop }),

  setActiveAsset: (id) => set({ activeAssetId: id }),

  resetPlayback: () =>
    set({
      playbackState: 'idle',
      currentTime: 0,
      activeAssetId: null,
    }),
})

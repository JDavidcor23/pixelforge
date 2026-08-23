import type { StateCreator } from 'zustand'

import type { SynthParameters } from '@/app/editor/types/audio'
import type { AudioSynthSlice, SoundsStore } from '@/app/editor/stores/types/audio-slices'
import {
  OSCILLATOR_DEFAULTS,
  ADSR_DEFAULTS,
  FILTER_DEFAULTS,
  MASTER_GAIN_DEFAULT,
} from '@/app/editor/constants/audio'

const getDefaultSynthParams = (): SynthParameters => ({
  oscillator: { ...OSCILLATOR_DEFAULTS },
  envelope: { ...ADSR_DEFAULTS },
  filter: { ...FILTER_DEFAULTS },
  masterGain: MASTER_GAIN_DEFAULT,
})

export const createAudioSynthSlice: StateCreator<
  SoundsStore,
  [['zustand/persist', unknown]],
  [],
  AudioSynthSlice
> = (set) => ({
  synthParams: getDefaultSynthParams(),
  currentPresetId: null,
  generatedBuffer: null,
  isGenerating: false,

  setSynthParam: <K extends keyof SynthParameters>(key: K, value: SynthParameters[K]) =>
    set((state) => ({
      synthParams: { ...state.synthParams, [key]: value },
    })),

  setOscillatorParam: (key, value) =>
    set((state) => ({
      synthParams: {
        ...state.synthParams,
        oscillator: { ...state.synthParams.oscillator, [key]: value },
      },
    })),

  setEnvelopeParam: (key, value) =>
    set((state) => ({
      synthParams: {
        ...state.synthParams,
        envelope: { ...state.synthParams.envelope, [key]: value },
      },
    })),

  setFilterParam: (key, value) =>
    set((state) => ({
      synthParams: {
        ...state.synthParams,
        filter: { ...state.synthParams.filter, [key]: value },
      },
    })),

  setMasterGain: (gain) =>
    set((state) => ({
      synthParams: { ...state.synthParams, masterGain: gain },
    })),

  setCurrentPreset: (presetId) => set({ currentPresetId: presetId }),

  setGeneratedBuffer: (buffer) => set({ generatedBuffer: buffer }),

  setIsGenerating: (generating) => set({ isGenerating: generating }),

  resetSynthParams: () => set({ synthParams: getDefaultSynthParams() }),
})

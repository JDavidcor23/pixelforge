import { useCallback } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { audioEngine } from '@/lib/audio-engine'
import {
  HZ_PER_KHZ,
  OSCILLATOR_LIMITS,
  OSCILLATOR_TYPES,
  SYNTH_CONTROL_STEP,
  SYNTH_PREVIEW_DURATION_S,
} from '@/constants/audio'
import type { OscillatorType, SynthParameters } from '@/types/audio'

export function useOscillatorControls() {
  const oscillator = useSoundsStore((state) => state.synthParams.oscillator)
  const synthParams = useSoundsStore((state) => state.synthParams)
  const setOscillatorParam = useSoundsStore((state) => state.setOscillatorParam)

  const playPreview = useCallback(
    (params: SynthParameters) => {
      void audioEngine.resume()
      audioEngine.playSynth(params, SYNTH_PREVIEW_DURATION_S.OSCILLATOR)
    },
    []
  )

  const handleTypeChange = useCallback(
    (type: OscillatorType) => {
      setOscillatorParam('type', type)
      const updatedParams: SynthParameters = {
        ...synthParams,
        oscillator: { ...synthParams.oscillator, type },
      }
      playPreview(updatedParams)
    },
    [setOscillatorParam, synthParams, playPreview]
  )

  const handleFrequencyChange = useCallback(
    (frequency: number) => {
      setOscillatorParam('frequency', frequency)
    },
    [setOscillatorParam]
  )

  const handleFrequencyCommit = useCallback(
    (frequency: number) => {
      const updatedParams: SynthParameters = {
        ...synthParams,
        oscillator: { ...synthParams.oscillator, frequency },
      }
      playPreview(updatedParams)
    },
    [synthParams, playPreview]
  )

  const handleDetuneChange = useCallback(
    (detune: number) => {
      setOscillatorParam('detune', detune)
    },
    [setOscillatorParam]
  )

  const handleDetuneCommit = useCallback(
    (detune: number) => {
      const updatedParams: SynthParameters = {
        ...synthParams,
        oscillator: { ...synthParams.oscillator, detune },
      }
      playPreview(updatedParams)
    },
    [synthParams, playPreview]
  )

  const formatFrequency = useCallback((freq: number): string => {
    if (freq >= HZ_PER_KHZ) {
      return `${(freq / HZ_PER_KHZ).toFixed(1)}kHz`
    }
    return `${Math.round(freq)}Hz`
  }, [])

  return {
    oscillator,
    oscillatorTypes: OSCILLATOR_TYPES,
    frequencyLimits: OSCILLATOR_LIMITS.frequency,
    detuneLimits: OSCILLATOR_LIMITS.detune,
    frequencyStep: SYNTH_CONTROL_STEP.FREQUENCY_HZ,
    detuneStep: SYNTH_CONTROL_STEP.DETUNE_CENTS,
    handleTypeChange,
    handleFrequencyChange,
    handleFrequencyCommit,
    handleDetuneChange,
    handleDetuneCommit,
    formatFrequency,
  }
}

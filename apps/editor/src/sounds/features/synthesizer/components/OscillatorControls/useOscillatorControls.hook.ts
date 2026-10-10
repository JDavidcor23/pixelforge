import { useCallback } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { audioEngine } from '@/lib/audio-engine'
import { OSCILLATOR_TYPES, OSCILLATOR_LIMITS } from '@/constants/audio'
import type { OscillatorType, SynthParameters } from '@/types/audio'

const PREVIEW_DURATION = 0.3

export function useOscillatorControls() {
  const oscillator = useSoundsStore((state) => state.synthParams.oscillator)
  const synthParams = useSoundsStore((state) => state.synthParams)
  const setOscillatorParam = useSoundsStore((state) => state.setOscillatorParam)

  const playPreview = useCallback(
    (params: SynthParameters) => {
      void audioEngine.resume()
      audioEngine.playSynth(params, PREVIEW_DURATION)
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
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(1)}kHz`
    }
    return `${Math.round(freq)}Hz`
  }, [])

  return {
    oscillator,
    oscillatorTypes: OSCILLATOR_TYPES,
    frequencyLimits: OSCILLATOR_LIMITS.frequency,
    detuneLimits: OSCILLATOR_LIMITS.detune,
    handleTypeChange,
    handleFrequencyChange,
    handleFrequencyCommit,
    handleDetuneChange,
    handleDetuneCommit,
    formatFrequency,
  }
}

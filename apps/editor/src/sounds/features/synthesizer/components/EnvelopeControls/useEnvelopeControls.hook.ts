import { useCallback } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { audioEngine } from '@/lib/audio-engine'
import { ADSR_LIMITS } from '@/constants/audio'
import type { EnvelopeParameters, SynthParameters } from '@/types/audio'

const PREVIEW_DURATION = 0.5

export function useEnvelopeControls() {
  const envelope = useSoundsStore((state) => state.synthParams.envelope)
  const synthParams = useSoundsStore((state) => state.synthParams)
  const setEnvelopeParam = useSoundsStore((state) => state.setEnvelopeParam)

  const playPreview = useCallback(
    (params: SynthParameters) => {
      void audioEngine.resume()
      audioEngine.playSynth(params, PREVIEW_DURATION)
    },
    []
  )

  const handleParamChange = useCallback(
    (key: keyof EnvelopeParameters, value: number) => {
      setEnvelopeParam(key, value)
    },
    [setEnvelopeParam]
  )

  const handleParamCommit = useCallback(
    (key: keyof EnvelopeParameters, value: number) => {
      const updatedParams: SynthParameters = {
        ...synthParams,
        envelope: { ...synthParams.envelope, [key]: value },
      }
      playPreview(updatedParams)
    },
    [synthParams, playPreview]
  )

  const formatValue = useCallback((key: keyof EnvelopeParameters, value: number): string => {
    if (key === 'sustain') {
      return `${Math.round(value * 100)}%`
    }
    return `${Math.round(value)}ms`
  }, [])

  const generateAdsrPath = useCallback(
    (env: EnvelopeParameters): string => {
      const width = 200
      const height = 60
      const padding = 4

      const totalTime = env.attack + env.decay + 500 + env.release
      const scaleX = (ms: number) => padding + (ms / totalTime) * (width - padding * 2)
      const scaleY = (level: number) => padding + (1 - level) * (height - padding * 2)

      const attackEnd = scaleX(env.attack)
      const decayEnd = scaleX(env.attack + env.decay)
      const sustainEnd = scaleX(env.attack + env.decay + 500)
      const releaseEnd = scaleX(totalTime)

      return [
        `M ${padding} ${scaleY(0)}`,
        `L ${attackEnd} ${scaleY(1)}`,
        `L ${decayEnd} ${scaleY(env.sustain)}`,
        `L ${sustainEnd} ${scaleY(env.sustain)}`,
        `L ${releaseEnd} ${scaleY(0)}`,
      ].join(' ')
    },
    []
  )

  return {
    envelope,
    limits: ADSR_LIMITS,
    handleParamChange,
    handleParamCommit,
    formatValue,
    generateAdsrPath,
  }
}

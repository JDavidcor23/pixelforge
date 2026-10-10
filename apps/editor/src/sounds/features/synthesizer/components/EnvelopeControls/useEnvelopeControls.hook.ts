import { useCallback } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { audioEngine } from '@/lib/audio-engine'
import {
  ADSR_LIMITS,
  ADSR_VIEW,
  PERCENT_SCALE,
  SUSTAIN_HOLD_MS,
  SYNTH_CONTROL_STEP,
  SYNTH_PREVIEW_DURATION_S,
} from '@/constants/audio'
import type { EnvelopeParameters, SynthParameters } from '@/types/audio'

const VIEW_BOX = `0 0 ${ADSR_VIEW.WIDTH} ${ADSR_VIEW.HEIGHT}`
const BASELINE = {
  x1: ADSR_VIEW.PADDING,
  y1: ADSR_VIEW.HEIGHT - ADSR_VIEW.PADDING,
  x2: ADSR_VIEW.WIDTH - ADSR_VIEW.PADDING,
  y2: ADSR_VIEW.HEIGHT - ADSR_VIEW.PADDING,
} as const

const getStep = (key: keyof EnvelopeParameters): number =>
  key === 'sustain' ? SYNTH_CONTROL_STEP.LEVEL : SYNTH_CONTROL_STEP.TIME_MS

export function useEnvelopeControls() {
  const envelope = useSoundsStore((state) => state.synthParams.envelope)
  const synthParams = useSoundsStore((state) => state.synthParams)
  const setEnvelopeParam = useSoundsStore((state) => state.setEnvelopeParam)

  const playPreview = useCallback(
    (params: SynthParameters) => {
      void audioEngine.resume()
      audioEngine.playSynth(params, SYNTH_PREVIEW_DURATION_S.ENVELOPE)
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
      return `${Math.round(value * PERCENT_SCALE)}%`
    }
    return `${Math.round(value)}ms`
  }, [])

  const generateAdsrPath = useCallback(
    (env: EnvelopeParameters): string => {
      const { WIDTH: width, HEIGHT: height, PADDING: padding } = ADSR_VIEW

      const totalTime = env.attack + env.decay + SUSTAIN_HOLD_MS + env.release
      const scaleX = (ms: number) => padding + (ms / totalTime) * (width - padding * 2)
      const scaleY = (level: number) => padding + (1 - level) * (height - padding * 2)

      const attackEnd = scaleX(env.attack)
      const decayEnd = scaleX(env.attack + env.decay)
      const sustainEnd = scaleX(env.attack + env.decay + SUSTAIN_HOLD_MS)
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
    viewBox: VIEW_BOX,
    baseline: BASELINE,
    getStep,
    handleParamChange,
    handleParamCommit,
    formatValue,
    generateAdsrPath,
  }
}

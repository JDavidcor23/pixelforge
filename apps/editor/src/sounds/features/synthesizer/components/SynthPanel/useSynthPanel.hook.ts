import { useCallback } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { audioEngine } from '@/lib/audio-engine'
import type { SynthParameters } from '@/types/audio'

const SUSTAIN_HOLD_MS = 500

function calculateDuration(params: SynthParameters): number {
  const { attack, decay, release } = params.envelope
  return (attack + decay + SUSTAIN_HOLD_MS + release) / 1000
}

export function useSynthPanel() {
  const masterGain = useSoundsStore((state) => state.synthParams.masterGain)
  const synthParams = useSoundsStore((state) => state.synthParams)
  const isGenerating = useSoundsStore((state) => state.isGenerating)
  const setMasterGain = useSoundsStore((state) => state.setMasterGain)
  const setIsGenerating = useSoundsStore((state) => state.setIsGenerating)
  const setGeneratedBuffer = useSoundsStore((state) => state.setGeneratedBuffer)

  const handleMasterGainChange = useCallback(
    (gain: number) => {
      setMasterGain(gain)
    },
    [setMasterGain]
  )

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    try {
      void audioEngine.resume()
      const duration = calculateDuration(synthParams)
      const buffer = await audioEngine.renderToBuffer(synthParams, duration)
      setGeneratedBuffer(buffer)
    } catch (error) {
      console.error('Failed to generate audio buffer:', error)
      setGeneratedBuffer(null)
    } finally {
      setIsGenerating(false)
    }
  }, [synthParams, setIsGenerating, setGeneratedBuffer])

  return {
    masterGain,
    isGenerating,
    handleMasterGainChange,
    handleGenerate,
  }
}

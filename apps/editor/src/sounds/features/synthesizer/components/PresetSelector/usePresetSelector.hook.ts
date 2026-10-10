import { useCallback } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { audioEngine } from '@/lib/audio-engine'
import { getAllPresets } from '@/lib/audio-presets'
import type { SynthPreset } from '@/types/audio'

const PREVIEW_DURATION = 0.4

export function usePresetSelector() {
  const currentPresetId = useSoundsStore((state) => state.currentPresetId)
  const setCurrentPreset = useSoundsStore((state) => state.setCurrentPreset)
  const setSynthParam = useSoundsStore((state) => state.setSynthParam)

  const presets = getAllPresets()

  const handlePresetSelect = useCallback(
    (preset: SynthPreset) => {
      setSynthParam('oscillator', preset.params.oscillator)
      setSynthParam('envelope', preset.params.envelope)
      setSynthParam('filter', preset.params.filter)
      setSynthParam('masterGain', preset.params.masterGain)
      setCurrentPreset(preset.id)

      void audioEngine.resume()
      audioEngine.playSynth(preset.params, PREVIEW_DURATION)
    },
    [setSynthParam, setCurrentPreset]
  )

  return {
    presets,
    currentPresetId,
    handlePresetSelect,
  }
}

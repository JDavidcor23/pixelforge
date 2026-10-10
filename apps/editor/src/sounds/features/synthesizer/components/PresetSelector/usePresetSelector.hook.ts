'use client'

import { useCallback } from 'react'

import { useSoundsStore } from '@/app/editor/stores/sounds.store'
import { audioEngine } from '@/app/editor/lib/audio-engine'
import { getAllPresets } from '@/app/editor/lib/audio-presets'
import type { SynthPreset } from '@/app/editor/types/audio'

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

import { useCallback, useId, useState } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { applyTweak, synthParamsToTweaks } from '@/lib/tweak-mapping'
import { TWEAK_PARAMS, TWEAK_SLIDER } from '@/constants/sound-library'
import type { TweakParamKey, TweakValues } from '@/types/audio'

const NEUTRAL_TWEAKS: TweakValues = {
  pitch: TWEAK_SLIDER.NEUTRAL,
  length: TWEAK_SLIDER.NEUTRAL,
  punch: TWEAK_SLIDER.NEUTRAL,
  tone: TWEAK_SLIDER.NEUTRAL,
}

/**
 * The sliders edit the store's `synthParams`, which `useSynthAssetSync` keeps
 * loaded with the selected synth asset's recipe and writes back (+ re-renders
 * the audio) on change. The Advanced controls edit the same params.
 */
export function useTweakPanel(isSynth: boolean) {
  const advancedId = useId()
  const titleId = useId()
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const synthParams = useSoundsStore((state) => state.synthParams)
  const loadSynthParams = useSoundsStore((state) => state.loadSynthParams)

  const values = isSynth ? synthParamsToTweaks(synthParams) : NEUTRAL_TWEAKS

  const handleTweak = useCallback(
    (key: TweakParamKey, position: number) => {
      loadSynthParams(applyTweak(synthParams, key, position))
    },
    [synthParams, loadSynthParams]
  )

  const sliders = TWEAK_PARAMS.map((param) => ({
    ...param,
    value: values[param.key],
    valueText: `${param.label} ${values[param.key]} of ${TWEAK_SLIDER.MAX}`,
    onChange: (position: number) => handleTweak(param.key, position),
  }))

  const handleToggleAdvanced = useCallback(() => setIsAdvancedOpen((open) => !open), [])

  return {
    advancedId,
    titleId,
    sliders,
    range: TWEAK_SLIDER,
    isAdvancedOpen: isSynth && isAdvancedOpen,
    handleToggleAdvanced,
  }
}

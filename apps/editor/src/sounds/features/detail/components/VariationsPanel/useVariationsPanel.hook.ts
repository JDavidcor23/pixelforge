import { useCallback, useId, useState } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { useCreateSound } from '@/sounds/hooks/useCreateSound.hook'
import { useElevenLabsConnection } from '@/sounds/hooks/useElevenLabsConnection.hook'
import { getAssetKind } from '@/lib/sound-assets'
import { TAG_TO_MODE, VARIATION_COUNT } from '@/constants/sound-library'
import type { AudioAsset, VariationCardState } from '@/types/audio'

const NAME_SEPARATORS = /[_-]+/g

export function useVariationsPanel(asset: AudioAsset, isSynth: boolean) {
  const titleId = useId()
  const [isMakingVariations, setIsMakingVariations] = useState(false)

  const generationHistory = useSoundsStore((state) => state.generationHistory)
  const isRemaking = useSoundsStore((state) => state.pendingGenerations.length > 0)
  const openNewSound = useSoundsStore((state) => state.openNewSound)
  const { createVariations } = useCreateSound()
  const { isConnected, openSettings } = useElevenLabsConnection()

  const handleMakeVariations = useCallback(async () => {
    setIsMakingVariations(true)
    try {
      await createVariations(asset)
    } catch (error) {
      console.error('Failed to make variations:', error)
    } finally {
      setIsMakingVariations(false)
    }
  }, [createVariations, asset])

  const handleRemake = useCallback(() => {
    if (!isConnected) {
      openSettings()
      return
    }
    // Best prompt available: the asset's own, its generation record, else its name.
    const record = generationHistory.find((item) => item.resultAssetId === asset.id)
    const prompt = asset.prompt ?? record?.prompt ?? asset.name.replace(NAME_SEPARATORS, ' ')
    openNewSound({ section: 'ai', prompt, mode: TAG_TO_MODE[getAssetKind(asset)] })
  }, [isConnected, openSettings, generationHistory, asset, openNewSound])

  const variationsState: VariationCardState = isMakingVariations
    ? 'busy'
    : isSynth
      ? 'idle'
      : 'disabled'

  const remakeState: VariationCardState = isRemaking ? 'busy' : 'idle'

  return {
    titleId,
    variations: {
      title: `Make ${VARIATION_COUNT} variations`,
      state: variationsState,
      subtitle: isMakingVariations
        ? 'Making variations…'
        : isSynth
          ? 'Small random changes, keep the feel'
          : 'Only for sounds built with the synth',
      onClick: () => void handleMakeVariations(),
    },
    remake: {
      state: remakeState,
      subtitle: isRemaking
        ? 'Remaking…'
        : isConnected
          ? 'Describe what to change'
          : 'Connect ElevenLabs in Settings',
      onClick: handleRemake,
    },
  }
}

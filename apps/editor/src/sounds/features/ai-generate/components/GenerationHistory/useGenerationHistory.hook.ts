import { useCallback } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { GENERATION_HISTORY_LIMIT } from '@/constants/audio'

export function useGenerationHistory() {
  const generationHistory = useSoundsStore((s) => s.generationHistory)
  const assets = useSoundsStore((s) => s.assets)
  const setActiveAsset = useSoundsStore((s) => s.setActiveAsset)

  const visibleHistory = generationHistory.slice(0, GENERATION_HISTORY_LIMIT)

  const handleSelectGeneration = useCallback(
    (resultAssetId: string) => {
      const asset = assets.find((a) => a.id === resultAssetId)
      if (asset) {
        setActiveAsset(asset.id)
      }
    },
    [assets, setActiveAsset]
  )

  return {
    history: visibleHistory,
    isEmpty: visibleHistory.length === 0,
    handleSelectGeneration,
  }
}

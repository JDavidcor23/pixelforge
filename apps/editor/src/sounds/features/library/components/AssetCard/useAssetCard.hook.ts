import { useSoundsStore } from '@/stores/sounds.store'

export function useAssetCard(assetId: string) {
  const selectedAssetId = useSoundsStore((state) => state.selectedAssetId)
  const setSelectedAsset = useSoundsStore((state) => state.setSelectedAsset)
  const setActiveAsset = useSoundsStore((state) => state.setActiveAsset)

  const isSelected = selectedAssetId === assetId

  const handleSelect = () => {
    setSelectedAsset(assetId)
  }

  const handlePlay = () => {
    setActiveAsset(assetId)
  }

  return {
    isSelected,
    handleSelect,
    handlePlay,
  }
}

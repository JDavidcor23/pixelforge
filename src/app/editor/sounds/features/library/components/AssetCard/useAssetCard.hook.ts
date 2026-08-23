import { useSoundsStore } from '@/app/editor/stores/sounds.store'

export function useAssetCard(assetId: string) {
  const selectedAssetId = useSoundsStore((state) => state.selectedAssetId)
  const setSelectedAsset = useSoundsStore((state) => state.setSelectedAsset)
  const setActiveAsset = useSoundsStore((state) => state.setActiveAsset)

  const isSelected = selectedAssetId === assetId

  const handleSelect = () => {
    setSelectedAsset(assetId)
  }

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveAsset(assetId)
  }

  return {
    isSelected,
    handleSelect,
    handlePlay,
  }
}

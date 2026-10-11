import { useCallback } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { audioBufferCache } from '@/lib/audio-buffer-cache'
import { releaseObjectUrl } from '@/lib/sound-assets'

/**
 * The one way a sound leaves the library. `requestDelete` only opens the
 * shared confirm dialog; `deleteSound` is what the dialog runs on confirm.
 */
export function useDeleteSound() {
  const requestDelete = useSoundsStore((state) => state.requestDelete)
  const removeAsset = useSoundsStore((state) => state.removeAsset)
  const setSelectedAsset = useSoundsStore((state) => state.setSelectedAsset)

  const deleteSound = useCallback(
    (id: string) => {
      // Read at call time: the dialog may outlive the render that opened it.
      const { assets, selectedAssetId } = useSoundsStore.getState()
      const index = assets.findIndex((item) => item.id === id)
      if (index === -1) return

      const asset = assets[index]
      const neighbor = assets[index + 1] ?? assets[index - 1] ?? null
      removeAsset(id)
      audioBufferCache.delete(id)
      releaseObjectUrl(asset.localObjectUrl, useSoundsStore.getState().assets)
      // Deleting another row must not steal the current selection.
      if (selectedAssetId === id) setSelectedAsset(neighbor?.id ?? null)
    },
    [removeAsset, setSelectedAsset]
  )

  return { requestDelete, deleteSound }
}

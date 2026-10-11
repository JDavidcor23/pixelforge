import { useCallback } from 'react'

import { useDeleteSound } from '@/sounds/hooks/useDeleteSound.hook'
import { formatDuration, getAssetKindLabel, splitNameForTruncation } from '@/lib/sound-assets'
import { NAME_VISIBLE_TAIL_LENGTH } from '@/constants/sound-library'
import type { AudioAsset } from '@/types/audio'

export function useSoundListItem(asset: AudioAsset, onSelect: (id: string) => void) {
  const { requestDelete } = useDeleteSound()

  const meta = `${getAssetKindLabel(asset)} · ${formatDuration(asset.duration)}`
  const nameParts = splitNameForTruncation(asset.name, NAME_VISIBLE_TAIL_LENGTH)

  const handleClick = useCallback(() => onSelect(asset.id), [asset.id, onSelect])

  // The trash is a sibling of the option, but stop anyway so no row/list handler selects.
  const handleDeleteClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      requestDelete(asset.id)
    },
    [asset.id, requestDelete]
  )

  return { meta, nameParts, handleClick, handleDeleteClick }
}

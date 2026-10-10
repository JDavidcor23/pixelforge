import { useCallback } from 'react'

import { formatDuration, getAssetKindLabel, splitNameForTruncation } from '@/lib/sound-assets'
import { NAME_VISIBLE_TAIL_LENGTH } from '@/constants/sound-library'
import type { AudioAsset } from '@/types/audio'

export function useSoundListItem(asset: AudioAsset, onSelect: (id: string) => void) {
  const meta = `${getAssetKindLabel(asset)} · ${formatDuration(asset.duration)}`
  const nameParts = splitNameForTruncation(asset.name, NAME_VISIBLE_TAIL_LENGTH)

  const handleClick = useCallback(() => onSelect(asset.id), [asset.id, onSelect])

  return { meta, nameParts, handleClick }
}

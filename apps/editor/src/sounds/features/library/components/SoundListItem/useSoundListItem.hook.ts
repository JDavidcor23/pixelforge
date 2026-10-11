import { useCallback, useState } from 'react'

import { useAddToTimeline } from '@/sounds/hooks/useAddToTimeline.hook'
import { useDeleteSound } from '@/sounds/hooks/useDeleteSound.hook'
import { useSoundEditorView } from '@/sounds/hooks/useSoundEditorView.hook'
import { soundDragSession } from '@/lib/sound-drag-session'
import { formatDuration, getAssetKindLabel, splitNameForTruncation } from '@/lib/sound-assets'
import { NAME_VISIBLE_TAIL_LENGTH } from '@/constants/sound-library'
import { SOUND_DRAG_MIME } from '@/constants/timeline-view'
import type { AudioAsset } from '@/types/audio'

export function useSoundListItem(asset: AudioAsset, onSelect: (id: string) => void) {
  const [isDragging, setIsDragging] = useState(false)
  const { requestDelete } = useDeleteSound()
  const { addToTimeline } = useAddToTimeline()
  const { openSound } = useSoundEditorView()

  const meta = `${getAssetKindLabel(asset)} · ${formatDuration(asset.duration)}`
  const nameParts = splitNameForTruncation(asset.name, NAME_VISIBLE_TAIL_LENGTH)

  const handleClick = useCallback(() => onSelect(asset.id), [asset.id, onSelect])

  const handleDoubleClick = useCallback(() => openSound(asset.id), [asset.id, openSound])

  // The trash is a sibling of the option, but stop anyway so no row/list handler selects.
  const handleDeleteClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      requestDelete(asset.id)
    },
    [asset.id, requestDelete]
  )

  const handleAddClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      addToTimeline(asset.id)
    },
    [asset.id, addToTimeline]
  )

  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLButtonElement>) => {
      event.dataTransfer.setData(SOUND_DRAG_MIME, asset.id)
      event.dataTransfer.effectAllowed = 'copy'
      soundDragSession.start(asset.id)
      setIsDragging(true)
    },
    [asset.id]
  )

  const handleDragEnd = useCallback(() => {
    soundDragSession.end()
    setIsDragging(false)
  }, [])

  return {
    meta,
    nameParts,
    isDragging,
    handleClick,
    handleDoubleClick,
    handleDeleteClick,
    handleAddClick,
    handleDragStart,
    handleDragEnd,
  }
}

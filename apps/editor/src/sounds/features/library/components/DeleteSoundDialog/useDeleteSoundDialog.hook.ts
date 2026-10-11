import { useCallback, useEffect, useId, useRef } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { selectClipCountForAsset } from '@/stores/selectors/sound-timeline.selectors'
import { useDeleteSound } from '@/sounds/hooks/useDeleteSound.hook'
import { splitNameForTruncation } from '@/lib/sound-assets'
import { clipUsageMessage } from '@/lib/timeline-view'
import { NAME_VISIBLE_TAIL_LENGTH } from '@/constants/sound-library'

const selectedRowSelector = (id: string): string => `[data-asset-id="${id}"]`

export function useDeleteSoundDialog() {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  // Whatever had focus when the dialog opened (row, row trash, header trash).
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const wasOpenRef = useRef(false)
  const titleId = useId()
  const descriptionId = useId()

  const pendingDeleteId = useSoundsStore((state) => state.pendingDeleteId)
  const assets = useSoundsStore((state) => state.assets)
  const cancelDelete = useSoundsStore((state) => state.cancelDelete)
  const clipCount = useSoundsStore(selectClipCountForAsset(pendingDeleteId))
  const { deleteSound } = useDeleteSound()

  const asset = pendingDeleteId ? (assets.find((item) => item.id === pendingDeleteId) ?? null) : null
  const isOpen = asset !== null

  // A request for a sound that no longer exists is dropped.
  useEffect(() => {
    if (pendingDeleteId && !asset) cancelDelete()
  }, [pendingDeleteId, asset, cancelDelete])

  // Open: remember the trigger, land on Cancel (the safe default).
  // Close: runs after the commit, so a deleted row is already gone from the DOM.
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      returnFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      cancelRef.current?.focus()
    } else if (!isOpen && wasOpenRef.current) {
      const trigger = returnFocusRef.current
      returnFocusRef.current = null
      if (trigger?.isConnected) {
        trigger.focus()
      } else {
        const selectedId = useSoundsStore.getState().selectedAssetId
        if (selectedId) document.querySelector<HTMLElement>(selectedRowSelector(selectedId))?.focus()
      }
    }
    wasOpenRef.current = isOpen
  }, [isOpen])

  const handleCancel = useCallback(() => cancelDelete(), [cancelDelete])

  const handleConfirm = useCallback(() => {
    if (pendingDeleteId) deleteSound(pendingDeleteId)
    cancelDelete()
  }, [pendingDeleteId, deleteSound, cancelDelete])

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) cancelDelete()
    },
    [cancelDelete]
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        cancelDelete()
        return
      }
      if (event.key !== 'Tab') return

      // Focus trap: the dialog only has two stops, so Tab just toggles between them.
      event.preventDefault()
      const next = document.activeElement === cancelRef.current ? confirmRef : cancelRef
      next.current?.focus()
    },
    [cancelDelete]
  )

  return {
    isOpen,
    assetName: asset?.name ?? '',
    nameParts: splitNameForTruncation(asset?.name ?? '', NAME_VISIBLE_TAIL_LENGTH),
    clipUsage: clipUsageMessage(clipCount),
    cancelRef,
    confirmRef,
    titleId,
    descriptionId,
    handleCancel,
    handleConfirm,
    handleBackdropClick,
    handleKeyDown,
  }
}

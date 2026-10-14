import { useEffect, useRef, useState } from 'react'

import type { AssetLibraryItem, AssetType } from '@/types'

interface UseAssetTileParams {
  readonly item: AssetLibraryItem
  readonly onRename: (item: AssetLibraryItem, label: string) => void
  readonly onMoveToType: (item: AssetLibraryItem, assetType: AssetType) => void
}

/**
 * Local UI state for `AssetTile`'s rename (inline text edit, mirrors
 * `LayerItem`'s rename pattern) and "move to" (anchored popover around
 * `AssetTypeSelector`, mirrors `NewSoundPopover`'s trigger/outside-click
 * pattern) icon buttons — ADR 0010, Phase 2.
 */
export const useAssetTile = ({ item, onRename, onMoveToType }: UseAssetTileParams) => {
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(item.label)
  const [isMoveOpen, setIsMoveOpen] = useState(false)

  const renameInputRef = useRef<HTMLInputElement>(null)
  const moveTriggerRef = useRef<HTMLSpanElement>(null)
  const movePopoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isRenaming) {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    }
  }, [isRenaming])

  // Outside click closes the move-to popover. Trigger is excluded: it toggles on its own.
  useEffect(() => {
    if (!isMoveOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return
      if (movePopoverRef.current?.contains(event.target)) return
      if (moveTriggerRef.current?.contains(event.target)) return
      setIsMoveOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isMoveOpen])

  const handleStartRename = (event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation()
    setRenameValue(item.label)
    setIsMoveOpen(false)
    setIsRenaming(true)
  }

  const commitRename = () => {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== item.label) {
      onRename(item, trimmed)
    } else {
      setRenameValue(item.label)
    }
    setIsRenaming(false)
  }

  const handleRenameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') commitRename()
    if (event.key === 'Escape') {
      setRenameValue(item.label)
      setIsRenaming(false)
    }
  }

  const handleToggleMove = (event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation()
    setIsRenaming(false)
    setIsMoveOpen((open) => !open)
  }

  const handleMoveTypeChange = (assetType: AssetType) => {
    onMoveToType(item, assetType)
    setIsMoveOpen(false)
    moveTriggerRef.current?.focus()
  }

  const handleMovePopoverKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      setIsMoveOpen(false)
      moveTriggerRef.current?.focus()
    }
  }

  return {
    isRenaming,
    renameValue,
    setRenameValue,
    renameInputRef,
    handleStartRename,
    commitRename,
    handleRenameKeyDown,
    isMoveOpen,
    moveTriggerRef,
    movePopoverRef,
    handleToggleMove,
    handleMoveTypeChange,
    handleMovePopoverKeyDown,
  }
}

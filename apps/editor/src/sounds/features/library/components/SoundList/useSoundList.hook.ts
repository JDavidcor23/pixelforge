import { useCallback, useMemo, useRef } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { useAddToTimeline } from '@/sounds/hooks/useAddToTimeline.hook'
import { useDeleteSound } from '@/sounds/hooks/useDeleteSound.hook'
import { useSoundEditorView } from '@/sounds/hooks/useSoundEditorView.hook'
import { getAssetSource } from '@/lib/sound-assets'
import { DELETE_SOUND_KEYS, SOUND_KIND_LABELS } from '@/constants/sound-library'
import { ADD_TO_TIMELINE_KEY, OPEN_SOUND_KEY } from '@/constants/timeline-view'
import type {
  AudioAsset,
  AudioAssetTag,
  LibraryListState,
  SortDirection,
  SortField,
} from '@/types/audio'

const NAVIGATION_KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End'] as const
type NavigationKey = (typeof NAVIGATION_KEYS)[number]

const isNavigationKey = (key: string): key is NavigationKey =>
  (NAVIGATION_KEYS as readonly string[]).includes(key)

const SOUND_ROW_SELECTOR = '[data-sound-row]'

/** Never hijack Backspace/Delete while the user is editing text. */
function isTextEntry(target: EventTarget): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

/** The sound whose row (option or its trash button) owns the event target. */
function getRowAssetId(target: EventTarget): string | null {
  if (!(target instanceof HTMLElement)) return null
  return target.closest<HTMLElement>(SOUND_ROW_SELECTOR)?.dataset.soundRow ?? null
}

function filterAssets(assets: AudioAsset[], query: string, tag: AudioAssetTag | null): AudioAsset[] {
  const lowerQuery = query.trim().toLowerCase()
  return assets.filter(
    (asset) =>
      (!lowerQuery || asset.name.toLowerCase().includes(lowerQuery)) &&
      (!tag || asset.tags.includes(tag))
  )
}

function sortAssets(assets: AudioAsset[], sortBy: SortField, direction: SortDirection): AudioAsset[] {
  const sorted = [...assets].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'date':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'duration':
        return a.duration - b.duration
    }
  })
  return direction === 'desc' ? sorted.reverse() : sorted
}

function nextIndex(key: NavigationKey, current: number, length: number): number {
  switch (key) {
    case 'ArrowDown':
      return Math.min(length - 1, current + 1)
    case 'ArrowUp':
      return Math.max(0, current - 1)
    case 'Home':
      return 0
    case 'End':
      return length - 1
  }
}

export function useSoundList() {
  const listRef = useRef<HTMLDivElement>(null)

  const assets = useSoundsStore((state) => state.assets)
  const searchQuery = useSoundsStore((state) => state.searchQuery)
  const filterTag = useSoundsStore((state) => state.filterTag)
  const sortBy = useSoundsStore((state) => state.sortBy)
  const sortDirection = useSoundsStore((state) => state.sortDirection)
  const selectedAssetId = useSoundsStore((state) => state.selectedAssetId)
  const pendingGenerations = useSoundsStore((state) => state.pendingGenerations)
  const generationHistory = useSoundsStore((state) => state.generationHistory)
  const setSelectedAsset = useSoundsStore((state) => state.setSelectedAsset)
  const setSearchQuery = useSoundsStore((state) => state.setSearchQuery)
  const setFilterTag = useSoundsStore((state) => state.setFilterTag)
  const openNewSound = useSoundsStore((state) => state.openNewSound)
  const { requestDelete } = useDeleteSound()
  const { addToTimeline } = useAddToTimeline()
  const { openSound } = useSoundEditorView()

  const visibleAssets = useMemo(
    () => sortAssets(filterAssets(assets, searchQuery, filterTag), sortBy, sortDirection),
    [assets, searchQuery, filterTag, sortBy, sortDirection]
  )

  const hasSelectionInView = visibleAssets.some((asset) => asset.id === selectedAssetId)

  const items = visibleAssets.map((asset, index) => ({
    asset,
    isSelected: asset.id === selectedAssetId,
    isAI: getAssetSource(asset, generationHistory) === 'ai',
    // Roving tabindex: only one option is in the tab order.
    tabIndex: asset.id === selectedAssetId || (!hasSelectionInView && index === 0) ? 0 : -1,
  }))

  const listState: LibraryListState =
    assets.length === 0 && pendingGenerations.length === 0
      ? 'empty'
      : visibleAssets.length === 0 && pendingGenerations.length === 0
        ? 'no-results'
        : 'list'

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const hasModifier = event.altKey || event.ctrlKey || event.metaKey
      const isRowCommand =
        event.key === OPEN_SOUND_KEY || event.key.toLowerCase() === ADD_TO_TIMELINE_KEY
      // Only on the option itself: Enter on a clicked trash/plus button keeps its own meaning.
      const isOption = event.target instanceof HTMLElement && event.target.dataset.assetId !== undefined
      if (isRowCommand && isOption && !hasModifier) {
        const assetId = getRowAssetId(event.target)
        if (!assetId) return
        event.preventDefault()
        if (event.key === OPEN_SOUND_KEY) openSound(assetId)
        else addToTimeline(assetId)
        return
      }
      if (DELETE_SOUND_KEYS.includes(event.key)) {
        if (event.altKey || event.ctrlKey || event.metaKey || isTextEntry(event.target)) return
        const assetId = getRowAssetId(event.target)
        if (!assetId) return
        event.preventDefault()
        requestDelete(assetId)
        return
      }
      if (!isNavigationKey(event.key) || visibleAssets.length === 0) return
      event.preventDefault()

      const current = visibleAssets.findIndex((asset) => asset.id === selectedAssetId)
      const target = visibleAssets[nextIndex(event.key, current, visibleAssets.length)]
      setSelectedAsset(target.id)
      listRef.current
        ?.querySelector<HTMLElement>(`[data-asset-id="${target.id}"]`)
        ?.focus()
    },
    [visibleAssets, selectedAssetId, setSelectedAsset, requestDelete, openSound, addToTimeline]
  )

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setFilterTag(null)
  }, [setSearchQuery, setFilterTag])

  const handleOpenNewSound = useCallback(() => {
    openNewSound({ section: 'presets' })
  }, [openNewSound])

  return {
    listRef,
    items,
    pendingGenerations,
    listState,
    searchQuery,
    filterLabel: filterTag ? SOUND_KIND_LABELS[filterTag].toLowerCase() : null,
    handleSelect: setSelectedAsset,
    handleKeyDown,
    handleClearSearch,
    handleOpenNewSound,
  }
}

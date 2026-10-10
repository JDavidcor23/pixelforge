import { useMemo } from 'react'
import { useSoundsStore } from '@/app/editor/stores/sounds.store'
import type { AudioAsset, AudioAssetTag, SortField, SortDirection } from '@/app/editor/types/audio'

function filterBySearch(assets: AudioAsset[], query: string): AudioAsset[] {
  if (!query.trim()) return assets
  const lowerQuery = query.toLowerCase()
  return assets.filter((asset) => asset.name.toLowerCase().includes(lowerQuery))
}

function filterByTag(assets: AudioAsset[], tag: AudioAssetTag | null): AudioAsset[] {
  if (!tag) return assets
  return assets.filter((asset) => asset.tags.includes(tag))
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
      default:
        return 0
    }
  })

  return direction === 'desc' ? sorted.reverse() : sorted
}

export function useLibraryPanel() {
  const assets = useSoundsStore((state) => state.assets)
  const searchQuery = useSoundsStore((state) => state.searchQuery)
  const filterTag = useSoundsStore((state) => state.filterTag)
  const sortBy = useSoundsStore((state) => state.sortBy)
  const sortDirection = useSoundsStore((state) => state.sortDirection)
  const setSearchQuery = useSoundsStore((state) => state.setSearchQuery)
  const setFilterTag = useSoundsStore((state) => state.setFilterTag)
  const setSortBy = useSoundsStore((state) => state.setSortBy)
  const setSortDirection = useSoundsStore((state) => state.setSortDirection)

  const filteredAssets = useMemo(() => {
    let result = filterBySearch(assets, searchQuery)
    result = filterByTag(result, filterTag)
    result = sortAssets(result, sortBy, sortDirection)
    return result
  }, [assets, searchQuery, filterTag, sortBy, sortDirection])

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const handleFilterChange = (tag: AudioAssetTag | null) => {
    setFilterTag(tag)
  }

  const handleSortChange = (field: SortField) => {
    setSortBy(field)
  }

  const handleDirectionToggle = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
  }

  return {
    filteredAssets,
    searchQuery,
    filterTag,
    sortBy,
    sortDirection,
    handleSearchChange,
    handleFilterChange,
    handleSortChange,
    handleDirectionToggle,
  }
}

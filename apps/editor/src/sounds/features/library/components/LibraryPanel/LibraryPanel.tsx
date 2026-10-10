'use client'

import { Search, Music, ArrowUpDown } from 'lucide-react'
import type { AudioAssetTag, SortField } from '@/app/editor/types/audio'
import { AssetCard } from '../AssetCard/AssetCard'
import { useLibraryPanel } from './useLibraryPanel.hook'

const TAG_OPTIONS: { label: string; value: AudioAssetTag | null }[] = [
  { label: 'All', value: null },
  { label: 'SFX', value: 'sfx' },
  { label: 'Music', value: 'music' },
  { label: 'Dialog', value: 'dialog' },
]

const SORT_OPTIONS: { label: string; value: SortField }[] = [
  { label: 'Name', value: 'name' },
  { label: 'Date', value: 'date' },
  { label: 'Duration', value: 'duration' },
]

export function LibraryPanel() {
  const {
    filteredAssets,
    searchQuery,
    filterTag,
    sortBy,
    sortDirection,
    handleSearchChange,
    handleFilterChange,
    handleSortChange,
    handleDirectionToggle,
  } = useLibraryPanel()

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search sounds..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          aria-label="Search audio assets"
          className="w-full rounded-md border border-zinc-700 bg-zinc-800 py-1.5 pl-8 pr-3 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TAG_OPTIONS.map((option) => (
          <button
            key={option.label}
            onClick={() => handleFilterChange(option.value)}
            aria-label={`Filter by ${option.label}`}
            aria-pressed={filterTag === option.value}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              filterTag === option.value
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value as SortField)}
          aria-label="Sort by field"
          className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 outline-none focus:border-violet-500"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleDirectionToggle}
          aria-label={`Sort direction: ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
          className="rounded-md border border-zinc-700 bg-zinc-800 p-1.5 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
        >
          <ArrowUpDown className={`h-3.5 w-3.5 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Music className="h-10 w-10 text-zinc-600" />
            <p className="text-sm text-zinc-500">No audio assets yet</p>
            <p className="text-xs text-zinc-600">
              Generate sounds with the Synth or AI panel
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            {filteredAssets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

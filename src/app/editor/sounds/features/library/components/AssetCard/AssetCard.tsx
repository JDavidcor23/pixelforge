'use client'

import { Play } from 'lucide-react'
import type { AudioAsset } from '@/app/editor/types/audio'
import { useAssetCard } from './useAssetCard.hook'

interface AssetCardProps {
  asset: AudioAsset
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function AssetCard({ asset }: AssetCardProps) {
  const { isSelected, handleSelect, handlePlay } = useAssetCard(asset.id)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect() }}
      aria-label={`Select ${asset.name}`}
      aria-pressed={isSelected}
      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 text-left transition-colors ${
        isSelected
          ? 'border-violet-500 bg-violet-500/10'
          : 'border-zinc-800 bg-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-800'
      }`}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); handlePlay() }}
        aria-label={`Play ${asset.name}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition-colors hover:bg-violet-500"
      >
        <Play className="h-3 w-3" />
      </button>

      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-medium text-zinc-200">{asset.name}</p>
        <p className="text-xs text-zinc-500">{formatDuration(asset.duration)}</p>
      </div>

      <div className="flex flex-wrap gap-1">
        {asset.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-zinc-700 px-1.5 py-0.5 text-[10px] font-medium uppercase text-zinc-400"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

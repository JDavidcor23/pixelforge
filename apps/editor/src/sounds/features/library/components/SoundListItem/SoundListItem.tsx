import { Sparkles } from 'lucide-react'

import { MiniWave } from '../MiniWave/MiniWave'
import { useSoundListItem } from './useSoundListItem.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import type { AudioAsset } from '@/types/audio'

interface SoundListItemProps {
  asset: AudioAsset
  isSelected: boolean
  isAI: boolean
  tabIndex: number
  onSelect: (id: string) => void
}

export function SoundListItem({ asset, isSelected, isAI, tabIndex, onSelect }: SoundListItemProps) {
  const { meta, nameParts, handleClick } = useSoundListItem(asset, onSelect)

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      tabIndex={tabIndex}
      data-asset-id={asset.id}
      onClick={handleClick}
      className={`group flex h-12 w-full shrink-0 items-center gap-2.5 rounded border border-transparent px-2.5 py-2 text-left hover:bg-hover aria-selected:border-accent/25 aria-selected:bg-hover ${FOCUS_RING.SURFACE}`}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1.5">
          <span title={asset.name} className="flex min-w-0 font-mono text-xs text-ink">
            <span className="truncate">{nameParts.head}</span>
            {nameParts.tail && <span className="shrink-0">{nameParts.tail}</span>}
          </span>
          {isAI && (
            <Sparkles className="size-2.75 shrink-0 text-ai-ink" aria-label="Made with AI" role="img" />
          )}
        </span>
        <span className="text-2xs text-subtle">{meta}</span>
      </span>
      <MiniWave peaks={asset.peaks} isActive={isSelected} />
    </button>
  )
}

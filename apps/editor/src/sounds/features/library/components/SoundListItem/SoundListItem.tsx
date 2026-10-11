import { Sparkles, Trash2 } from 'lucide-react'

import { MiniWave } from '../MiniWave/MiniWave'
import { useSoundListItem } from './useSoundListItem.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import type { AudioAsset } from '@/types/audio'

interface SoundListItemProps {
  asset: AudioAsset
  isSelected: boolean
  isAI: boolean
  tabIndex: number
  onSelect: (id: string) => void
}

export function SoundListItem({ asset, isSelected, isAI, tabIndex, onSelect }: SoundListItemProps) {
  const { meta, nameParts, handleClick, handleDeleteClick } = useSoundListItem(asset, onSelect)

  return (
    <div
      role="none"
      data-sound-row={asset.id}
      data-selected={isSelected || undefined}
      className="group relative shrink-0"
    >
      <button
        type="button"
        role="option"
        aria-selected={isSelected}
        tabIndex={tabIndex}
        data-asset-id={asset.id}
        aria-keyshortcuts="Delete Backspace"
        onClick={handleClick}
        className={`flex h-12 w-full items-center gap-2.5 rounded border border-transparent px-2.5 py-2 text-left group-hover:bg-hover aria-selected:border-accent/25 aria-selected:bg-hover ${FOCUS_RING.SURFACE}`}
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
        {/* Reserved slot for the trash so revealing it never shifts the row. */}
        <span className="size-6 shrink-0" aria-hidden />
      </button>
      {/* Pointer-only affordance: kept out of the tab order so the listbox only
          exposes options; keyboard users delete with Delete/Backspace on the row. */}
      <button
        type="button"
        tabIndex={-1}
        onClick={handleDeleteClick}
        aria-label={`Delete ${asset.name}`}
        title="Delete sound (Delete)"
        className={`absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-subtle opacity-0 hover:bg-hover hover:text-danger focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 group-data-selected:opacity-100 ${MOTION.REVEAL} ${FOCUS_RING.SURFACE}`}
      >
        <Trash2 className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}

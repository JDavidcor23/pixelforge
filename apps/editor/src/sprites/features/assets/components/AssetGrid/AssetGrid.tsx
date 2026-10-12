import { Plus } from 'lucide-react'

import { AssetTile } from '../AssetTile/AssetTile'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import type { AssetLibraryItem } from '@/types'

interface AssetGridProps {
  readonly folderLabel: string
  readonly items: readonly AssetLibraryItem[]
  readonly search: string
  readonly isApplying: boolean
  readonly onSelectItem: (item: AssetLibraryItem) => void
  readonly onDownloadItem: (item: AssetLibraryItem) => void
  readonly onDownloadSource: (item: AssetLibraryItem) => void
  readonly onOpenCreate: () => void
}

const NEW_TILE = `flex size-23 shrink-0 flex-col items-center justify-center gap-1 rounded-sm border border-line-strong text-accent ${MOTION.COLORS} ${FOCUS_RING.SURFACE}`

export const AssetGrid = ({
  folderLabel,
  items,
  search,
  isApplying,
  onSelectItem,
  onDownloadItem,
  onDownloadSource,
  onOpenCreate,
}: AssetGridProps) => {
  const isSearching = search.trim().length > 0

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-3">
      <div className="mb-3 flex shrink-0 items-center gap-2">
        <span className="text-ui font-medium text-ink">{folderLabel}</span>
        <span className="font-mono text-3xs text-subtle">{items.length} ITEMS</span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
          <p className="text-xs text-muted">
            {isSearching ? `No assets match "${search}".` : 'No assets yet. Create one in the Create tab.'}
          </p>
          <button
            type="button"
            onClick={onOpenCreate}
            className={`rounded border border-line-strong px-3 py-1.5 text-xs text-muted hover:bg-hover hover:text-ink ${MOTION.COLORS} ${FOCUS_RING.SURFACE}`}
          >
            Open Create
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5" aria-busy={isApplying}>
          <button type="button" onClick={onOpenCreate} title="Create a new asset" className={NEW_TILE}>
            <Plus size={16} aria-hidden />
            <span className="font-mono text-3xs">New</span>
          </button>

          {items.map((item) => (
            <AssetTile
              key={`${item.kind}-${item.id}`}
              item={item}
              onSelect={onSelectItem}
              onDownload={onDownloadItem}
              onDownloadSource={onDownloadSource}
            />
          ))}
        </div>
      )}
    </div>
  )
}

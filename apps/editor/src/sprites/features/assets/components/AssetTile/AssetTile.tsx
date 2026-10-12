import { Download, FileJson, Trash2 } from 'lucide-react'

import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import type { AssetLibraryItem } from '@/types'

interface AssetTileProps {
  readonly item: AssetLibraryItem
  readonly onSelect: (item: AssetLibraryItem) => void
  readonly onDownload: (item: AssetLibraryItem) => void
  readonly onDownloadSource: (item: AssetLibraryItem) => void
  readonly onDelete: (item: AssetLibraryItem) => void
}

export const AssetTile = ({ item, onSelect, onDownload, onDownloadSource, onDelete }: AssetTileProps) => {
  const canDownload = item.kind === 'generation' || item.canDownloadSheet

  return (
    <div className="group flex w-23 flex-col gap-1">
      <button
        type="button"
        onClick={() => onSelect(item)}
        title={item.label}
        className={`relative size-23 overflow-hidden rounded-sm border border-line bg-sunken ${FOCUS_RING.SURFACE}`}
      >
        {item.thumbnailSrc && (
          <img src={item.thumbnailSrc} alt={item.label} className="image-pixelated h-full w-full object-contain" />
        )}

        {item.isAnimated && (
          <span className="absolute left-1 top-1 rounded-sm bg-ai/25 px-1 font-mono text-3xs text-ai-ink">
            ANIM
          </span>
        )}

        <div
          className={`absolute right-1 top-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100 ${MOTION.REVEAL}`}
        >
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              onDelete(item)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation()
                onDelete(item)
              }
            }}
            aria-label={`Delete ${item.label}`}
            title="Delete"
            className="flex size-5 items-center justify-center rounded-sm bg-raised/90 text-ink hover:bg-danger hover:text-on-accent"
          >
            <Trash2 size={11} aria-hidden />
          </span>

          <span
            role="button"
            tabIndex={canDownload ? 0 : -1}
            aria-disabled={!canDownload}
            onClick={(e) => {
              e.stopPropagation()
              if (canDownload) onDownload(item)
            }}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && canDownload) {
                e.stopPropagation()
                onDownload(item)
              }
            }}
            title={canDownload ? 'Download PNG' : 'Not available for download this session'}
            className={`flex size-5 items-center justify-center rounded-sm bg-raised/90 text-ink hover:bg-accent hover:text-on-accent ${
              canDownload ? '' : 'pointer-events-none opacity-40'
            }`}
          >
            <Download size={11} aria-hidden />
          </span>

          {item.kind === 'generation' && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                onDownloadSource(item)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation()
                  onDownloadSource(item)
                }
              }}
              title="Download source (JSON)"
              className="flex size-5 items-center justify-center rounded-sm bg-raised/90 text-ink hover:bg-accent hover:text-on-accent"
            >
              <FileJson size={11} aria-hidden />
            </span>
          )}
        </div>
      </button>
      <span className="truncate font-mono text-3xs text-muted" title={item.label}>
        {item.label}
      </span>
    </div>
  )
}

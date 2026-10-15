import { Download, FileJson, FolderInput, Pencil, Trash2 } from 'lucide-react'

import { useAssetTile } from './useAssetTile.hook'
import { AssetTypeSelector } from '@/sprites/features/properties/components/CreateTab/AssetTypeSelector'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import type { AssetLibraryItem, AssetType } from '@/types'

interface AssetTileProps {
  readonly item: AssetLibraryItem
  readonly onSelect: (item: AssetLibraryItem) => void
  readonly onDownload: (item: AssetLibraryItem) => void
  readonly onDownloadSource: (item: AssetLibraryItem) => void
  readonly onDelete: (item: AssetLibraryItem) => void
  readonly onRename: (item: AssetLibraryItem, label: string) => void
  readonly onMoveToType: (item: AssetLibraryItem, assetType: AssetType) => void
}

export const AssetTile = ({
  item,
  onSelect,
  onDownload,
  onDownloadSource,
  onDelete,
  onRename,
  onMoveToType,
}: AssetTileProps) => {
  const {
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
  } = useAssetTile({ item, onRename, onMoveToType })

  return (
    <div className="group relative flex w-23 flex-col gap-1">
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
            onClick={handleStartRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleStartRename(e)
            }}
            aria-label={`Rename ${item.label}`}
            title="Rename"
            className="flex size-5 items-center justify-center rounded-sm bg-raised/90 text-ink hover:bg-accent hover:text-on-accent"
          >
            <Pencil size={11} aria-hidden />
          </span>

          <span
            ref={moveTriggerRef}
            role="button"
            tabIndex={0}
            onClick={handleToggleMove}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleToggleMove(e)
            }}
            aria-haspopup="dialog"
            aria-expanded={isMoveOpen}
            aria-label={`Move ${item.label} to another asset type`}
            title="Move to…"
            className="flex size-5 items-center justify-center rounded-sm bg-raised/90 text-ink hover:bg-accent hover:text-on-accent"
          >
            <FolderInput size={11} aria-hidden />
          </span>

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
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              onDownload(item)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation()
                onDownload(item)
              }
            }}
            title="Download PNG"
            className="flex size-5 items-center justify-center rounded-sm bg-raised/90 text-ink hover:bg-accent hover:text-on-accent"
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

      {isMoveOpen && (
        <div
          ref={movePopoverRef}
          role="dialog"
          aria-label={`Move ${item.label} to another asset type`}
          onKeyDown={handleMovePopoverKeyDown}
          className={`absolute right-0 top-0 z-50 w-40 rounded-md border border-line-strong bg-raised p-2 shadow-popover ${MOTION.POPOVER_ENTER}`}
        >
          <AssetTypeSelector value={item.assetType} onChange={handleMoveTypeChange} compact />
        </div>
      )}

      {isRenaming ? (
        <input
          ref={renameInputRef}
          type="text"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleRenameKeyDown}
          onClick={(e) => e.stopPropagation()}
          className={`w-full rounded bg-hover px-1 py-0.5 font-mono text-3xs text-ink outline-none ring-1 ring-accent/50 focus:ring-accent ${FOCUS_RING.INPUT}`}
        />
      ) : (
        <span className="truncate font-mono text-3xs text-muted" title={item.label}>
          {item.label}
        </span>
      )}
    </div>
  )
}

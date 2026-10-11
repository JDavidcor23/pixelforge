import { Copy, Download, Loader2, Pencil, Sparkles, Trash2 } from 'lucide-react'

import { useSoundDetailHeader } from './useSoundDetailHeader.hook'
import { DISABLED_STATE, FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import type { AudioAsset, AudioAssetSource } from '@/types/audio'

interface SoundDetailHeaderProps {
  asset: AudioAsset
  source: AudioAssetSource
}

const SECONDARY_BUTTON = `group flex items-center gap-1.5 rounded border border-line-strong px-3 py-2 text-ui text-ink hover:bg-hover active:bg-raised ${MOTION.PRESS} ${DISABLED_STATE} ${FOCUS_RING.BASE}`

export function SoundDetailHeader({ asset, source }: SoundDetailHeaderProps) {
  const {
    renameButtonRef,
    isRenaming,
    draftName,
    isExporting,
    exportError,
    nameMaxLength,
    nameParts,
    kindLabel,
    meta,
    isAI,
    handleStartRename,
    handleDraftChange,
    handleRenameKeyDown,
    handleRenameFocus,
    handleRenameBlur,
    handleDuplicate,
    handleExport,
    handleDelete,
  } = useSoundDetailHeader(asset, source)

  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-center gap-2.5">
          {isRenaming ? (
            <input
              type="text"
              value={draftName}
              onChange={handleDraftChange}
              onKeyDown={handleRenameKeyDown}
              onFocus={handleRenameFocus}
              onBlur={handleRenameBlur}
              aria-label="Sound name"
              maxLength={nameMaxLength}
              spellCheck={false}
              autoFocus
              className="w-full min-w-0 rounded border border-accent bg-base px-1 font-mono text-title font-semibold text-ink outline-none"
            />
          ) : (
            <>
              <h2
                title={asset.name}
                className="flex min-w-0 font-mono text-title font-semibold text-ink"
              >
                <span className="truncate">{nameParts.head}</span>
                {nameParts.tail && <span className="shrink-0">{nameParts.tail}</span>}
              </h2>
              <button
                ref={renameButtonRef}
                type="button"
                onClick={handleStartRename}
                aria-label="Rename"
                title="Rename"
                className={`shrink-0 rounded p-1 text-subtle hover:text-accent ${FOCUS_RING.BASE}`}
              >
                <Pencil className="size-3.5" aria-hidden />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-hover px-2 py-0.75 text-2xs font-medium text-muted">
            {kindLabel}
          </span>
          <span className="flex items-center gap-1 text-xs text-subtle">
            {isAI && <Sparkles className="size-3 text-ai-ink" aria-hidden />}
            {meta}
          </span>
        </div>
        {exportError && (
          <p role="alert" className="text-xs text-danger">
            {exportError}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={handleDuplicate} className={SECONDARY_BUTTON}>
          <Copy className="size-3.5 text-muted group-hover:text-accent" aria-hidden />
          Duplicate
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          aria-busy={isExporting}
          className={SECONDARY_BUTTON}
        >
          {isExporting ? (
            <Loader2 className="size-3.5 animate-spin text-muted motion-reduce:animate-none" aria-hidden />
          ) : (
            <Download className="size-3.5 text-muted group-hover:text-accent" aria-hidden />
          )}
          Export WAV
        </button>
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Delete sound"
          title="Delete sound"
          className={`flex size-8.5 items-center justify-center rounded border border-line-strong text-muted hover:border-danger/40 hover:bg-danger/10 hover:text-danger ${MOTION.PRESS} ${FOCUS_RING.BASE}`}
        >
          <Trash2 className="size-3.5" aria-hidden />
        </button>
      </div>
    </header>
  )
}

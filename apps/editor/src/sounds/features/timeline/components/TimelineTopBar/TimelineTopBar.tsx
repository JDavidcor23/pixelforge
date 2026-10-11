import { Download, Loader2, Pencil, Redo2, Undo2 } from 'lucide-react'

import { useTimelineTopBar } from './useTimelineTopBar.hook'
import { DISABLED_STATE, FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

const ICON_ACTION = `flex size-8 items-center justify-center rounded text-muted hover:bg-hover hover:text-accent ${MOTION.PRESS} ${FOCUS_RING.BASE} ${DISABLED_STATE}`

export function TimelineTopBar() {
  const {
    renameButtonRef,
    projectName,
    isRenaming,
    draftName,
    nameMaxLength,
    saveStatus,
    canUndo,
    canRedo,
    undoTitle,
    redoTitle,
    isExporting,
    exportError,
    canExport,
    handleStartRename,
    handleDraftChange,
    handleRenameKeyDown,
    handleRenameFocus,
    handleRenameBlur,
    handleUndo,
    handleRedo,
    handleExport,
  } = useTimelineTopBar()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line px-6">
      <div className="flex min-w-0 items-center gap-3">
        {isRenaming ? (
          <input
            type="text"
            value={draftName}
            onChange={handleDraftChange}
            onKeyDown={handleRenameKeyDown}
            onFocus={handleRenameFocus}
            onBlur={handleRenameBlur}
            aria-label="Project name"
            maxLength={nameMaxLength}
            spellCheck={false}
            autoFocus
            className="min-w-0 rounded border border-accent bg-base px-1 font-mono text-base font-semibold text-ink outline-none"
          />
        ) : (
          <>
            <h2
              title={projectName}
              onDoubleClick={handleStartRename}
              className="truncate font-mono text-base font-semibold text-ink"
            >
              {projectName}
            </h2>
            <button
              ref={renameButtonRef}
              type="button"
              onClick={handleStartRename}
              aria-label="Rename project"
              title="Rename project"
              className={`shrink-0 rounded p-1 text-subtle hover:text-accent ${MOTION.COLORS} ${FOCUS_RING.BASE}`}
            >
              <Pencil className="size-3.25" aria-hidden />
            </button>
          </>
        )}
        <span title={saveStatus.TITLE} className="shrink-0 text-2xs text-muted">
          {saveStatus.LABEL}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {exportError && (
          <span role="alert" className="max-w-60 truncate text-xs text-danger" title={exportError}>
            {exportError}
          </span>
        )}
        <button
          type="button"
          onClick={handleUndo}
          disabled={!canUndo}
          aria-label="Undo"
          aria-keyshortcuts="Meta+Z Control+Z"
          title={undoTitle}
          className={ICON_ACTION}
        >
          <Undo2 className="size-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={handleRedo}
          disabled={!canRedo}
          aria-label="Redo"
          aria-keyshortcuts="Meta+Shift+Z Control+Shift+Z Control+Y"
          title={redoTitle}
          className={ICON_ACTION}
        >
          <Redo2 className="size-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={!canExport}
          aria-busy={isExporting}
          className={`group flex items-center gap-1.5 rounded border border-line-strong px-3 py-2 text-ui text-ink hover:bg-hover active:bg-raised ${MOTION.PRESS} ${FOCUS_RING.BASE} ${DISABLED_STATE}`}
        >
          {isExporting ? (
            <Loader2 className="size-3.5 animate-spin text-muted motion-reduce:animate-none" aria-hidden />
          ) : (
            <Download className="size-3.5 text-muted group-hover:text-accent" aria-hidden />
          )}
          {isExporting ? 'Exporting…' : 'Export mix'}
        </button>
      </div>
    </header>
  )
}

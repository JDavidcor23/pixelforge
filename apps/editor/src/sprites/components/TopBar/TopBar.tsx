import { ChevronDown, FileImage, PanelsTopLeft, Redo2, Undo2 } from 'lucide-react'

import { useTopBar } from './useTopBar.hook'
import { CanvasSizePopover } from './CanvasSizePopover/CanvasSizePopover'
import { SaveIndicator } from './SaveIndicator/SaveIndicator'
import { AccountMenu } from './AccountMenu/AccountMenu'
import { ImportSpriteSheetDialog } from './ImportSpriteSheetDialog/ImportSpriteSheetDialog'
import { ImportErrorNotice } from './ImportErrorNotice/ImportErrorNotice'
import { SPRITE_IMPORT_ACCEPT } from '@/constants'
import { FILE_MENU_COPY, FILE_MENU_ENTRY_KIND } from '@/constants/file-menu'
import { DISABLED_STATE, FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import { Z_INDEX } from '@/constants/z-index'

const CHIP =
  'rounded border border-line-strong px-1.5 py-0.5 font-mono text-3xs uppercase tracking-wider text-subtle'

const ICON_BUTTON = `flex size-7 items-center justify-center rounded text-muted hover:bg-hover hover:text-ink ${MOTION.PRESS} ${FOCUS_RING.SURFACE} ${DISABLED_STATE}`

const MENU_TRIGGER = `flex items-center gap-1 rounded px-2 py-1 text-xs text-muted hover:bg-hover hover:text-ink aria-expanded:bg-hover aria-expanded:text-ink ${MOTION.PRESS} ${FOCUS_RING.SURFACE}`

const MENU_ITEM = `flex w-full items-center px-3 py-2 text-left text-xs text-ink hover:bg-hover ${MOTION.COLORS}`

const RESET_LAYOUT_BUTTON = `flex items-center gap-1.5 rounded px-2 py-1 text-2xs text-muted hover:bg-hover hover:text-ink ${MOTION.PRESS} ${FOCUS_RING.SURFACE} ${DISABLED_STATE}`

export const TopBar = () => {
  const {
    documentName,
    frameCountLabel,
    canUndo,
    canRedo,
    undo,
    redo,
    isLayoutCustomized,
    handleResetLayout,
    isFileMenuOpen,
    fileMenuRef,
    fileTriggerRef,
    toggleFileMenu,
    fileMenuEntries,
    importFileInputRef,
    handleImportFileSelected,
    importDialogProps,
    importFileErrorProps,
  } = useTopBar()

  return (
    <header className="flex h-11 shrink-0 items-center gap-2.5 border-b border-line bg-surface px-4">
      <span className="font-mono text-2xs font-bold tracking-widest text-accent">PIXELFORGE</span>

      <div className="relative" ref={fileMenuRef}>
        <button
          ref={fileTriggerRef}
          type="button"
          onClick={toggleFileMenu}
          aria-haspopup="menu"
          aria-expanded={isFileMenuOpen}
          className={MENU_TRIGGER}
        >
          {FILE_MENU_COPY.TRIGGER}
          <ChevronDown size={12} aria-hidden />
        </button>

        {isFileMenuOpen && (
          <div
            role="menu"
            aria-label={FILE_MENU_COPY.MENU_LABEL}
            className={`absolute left-0 top-full ${Z_INDEX.POPOVER} mt-1 w-52 rounded border border-line-strong bg-raised py-1 shadow-popover ${MOTION.POPOVER_ENTER}`}
          >
            {fileMenuEntries.map((entry) =>
              entry.kind === FILE_MENU_ENTRY_KIND.SEPARATOR ? (
                <div key={entry.id} role="separator" className="my-1 h-px bg-line-strong" />
              ) : (
                <button key={entry.id} type="button" role="menuitem" onClick={entry.onSelect} className={MENU_ITEM}>
                  {entry.label}
                </button>
              ),
            )}
          </div>
        )}
      </div>

      <input
        ref={importFileInputRef}
        type="file"
        accept={SPRITE_IMPORT_ACCEPT}
        onChange={handleImportFileSelected}
        className="hidden"
        aria-hidden
        tabIndex={-1}
      />

      <div className="h-4 w-px shrink-0 bg-line-strong" />

      <FileImage size={14} className="shrink-0 text-subtle" aria-hidden />
      <span className="max-w-60 truncate text-ui font-medium text-ink" title={documentName}>
        {documentName}
      </span>

      <CanvasSizePopover />

      <span className={CHIP}>{frameCountLabel}</span>

      <SaveIndicator />

      <div className="flex-1" />

      <button
        type="button"
        onClick={handleResetLayout}
        disabled={!isLayoutCustomized}
        aria-label="Reset panel sizes"
        title="Reset panel sizes"
        className={RESET_LAYOUT_BUTTON}
      >
        <PanelsTopLeft size={14} aria-hidden />
        <span>Reset layout</span>
      </button>

      <div className="h-4 w-px shrink-0 bg-line-strong" />

      <button
        type="button"
        onClick={undo}
        disabled={!canUndo}
        aria-label="Undo"
        title="Undo (Ctrl+Z)"
        className={ICON_BUTTON}
      >
        <Undo2 size={14} aria-hidden />
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={!canRedo}
        aria-label="Redo"
        title="Redo (Ctrl+Shift+Z)"
        className={ICON_BUTTON}
      >
        <Redo2 size={14} aria-hidden />
      </button>

      <AccountMenu />

      {importDialogProps && <ImportSpriteSheetDialog {...importDialogProps} />}
      {importFileErrorProps && <ImportErrorNotice {...importFileErrorProps} />}
    </header>
  )
}

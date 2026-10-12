import { ChevronDown, Download, FileImage, PanelsTopLeft, Redo2, Undo2 } from 'lucide-react'

import { useTopBar } from './useTopBar.hook'
import { CanvasSizePopover } from './CanvasSizePopover/CanvasSizePopover'
import { SaveIndicator } from './SaveIndicator/SaveIndicator'
import { DISABLED_STATE, FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

const CHIP =
  'rounded border border-line-strong px-1.5 py-0.5 font-mono text-3xs uppercase tracking-wider text-subtle'

const ICON_BUTTON = `flex size-7 items-center justify-center rounded text-muted hover:bg-hover hover:text-ink ${MOTION.PRESS} ${FOCUS_RING.SURFACE} ${DISABLED_STATE}`

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
    isExportMenuOpen,
    exportMenuRef,
    exportTriggerRef,
    toggleExportMenu,
    handleExportFrameClick,
    handleExportSpriteSheetClick,
  } = useTopBar()

  return (
    <header className="flex h-11 shrink-0 items-center gap-2.5 border-b border-line bg-surface px-4">
      <span className="font-mono text-2xs font-bold tracking-widest text-accent">PIXELFORGE</span>

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

      <div className="h-4 w-px shrink-0 bg-line-strong" />

      <div className="relative" ref={exportMenuRef}>
        <button
          ref={exportTriggerRef}
          type="button"
          onClick={toggleExportMenu}
          aria-haspopup="menu"
          aria-expanded={isExportMenuOpen}
          className={`flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent hover:bg-accent-strong ${MOTION.PRESS} ${FOCUS_RING.SURFACE}`}
        >
          <Download size={14} aria-hidden />
          Export
          <ChevronDown size={12} aria-hidden />
        </button>

        {isExportMenuOpen && (
          <div
            role="menu"
            aria-label="Export options"
            className={`absolute right-0 top-full z-50 mt-1 w-52 rounded border border-line-strong bg-raised py-1 shadow-popover ${MOTION.POPOVER_ENTER}`}
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleExportFrameClick}
              className={`flex w-full items-center px-3 py-2 text-left text-xs text-ink hover:bg-hover ${MOTION.COLORS}`}
            >
              Export current frame
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleExportSpriteSheetClick}
              className={`flex w-full items-center px-3 py-2 text-left text-xs text-ink hover:bg-hover ${MOTION.COLORS}`}
            >
              Export sprite sheet
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

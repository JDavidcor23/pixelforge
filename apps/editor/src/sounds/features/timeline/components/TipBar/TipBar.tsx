import { Lightbulb, Trash2 } from 'lucide-react'

import { ShortcutsPopover } from '../ShortcutsPopover/ShortcutsPopover'
import { useTipBar } from './useTipBar.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

interface TipBarProps {
  isShortcutsOpen: boolean
  onToggleShortcuts: () => void
  onCloseShortcuts: () => void
}

export function TipBar({ isShortcutsOpen, onToggleShortcuts, onCloseShortcuts }: TipBarProps) {
  const {
    triggerRef,
    tip,
    hasDeleteNotice,
    noticeText,
    undoLabel,
    handleCloseShortcuts,
    handleUndoDelete,
  } = useTipBar(onCloseShortcuts)

  return (
    <div className="flex h-9 shrink-0 items-center gap-2 border-t border-line bg-surface px-6">
      {/* Only the delete notice is announced; the contextual tip changes too often. */}
      <span role="status" className="sr-only">
        {hasDeleteNotice ? noticeText : ''}
      </span>
      <div className="flex min-w-0 items-center gap-2">
        {hasDeleteNotice ? (
          <span className={`flex min-w-0 items-center gap-2 ${MOTION.FADE_ENTER}`}>
            <Trash2 className="size-3.25 shrink-0 text-muted" aria-hidden />
            <p className="truncate text-xs text-ink">{noticeText}</p>
            <button
              type="button"
              onClick={handleUndoDelete}
              className={`shrink-0 rounded px-1 text-xs font-medium text-accent hover:underline ${MOTION.COLORS} ${FOCUS_RING.SURFACE}`}
            >
              {undoLabel}
            </button>
          </span>
        ) : (
          <>
            <Lightbulb className="size-3.25 shrink-0 text-subtle" aria-hidden />
            <p title={tip} className="truncate text-xs text-muted">
              {tip}
            </p>
          </>
        )}
      </div>
      <span className="flex-1" />
      <div className="relative shrink-0">
        <button
          ref={triggerRef}
          type="button"
          onClick={onToggleShortcuts}
          aria-haspopup="dialog"
          aria-keyshortcuts="Shift+?"
          aria-expanded={isShortcutsOpen}
          className={`rounded px-1 text-xs text-muted hover:text-ink ${MOTION.COLORS} ${FOCUS_RING.SURFACE}`}
        >
          Keyboard shortcuts
        </button>
        {isShortcutsOpen && <ShortcutsPopover triggerRef={triggerRef} onClose={handleCloseShortcuts} />}
      </div>
    </div>
  )
}

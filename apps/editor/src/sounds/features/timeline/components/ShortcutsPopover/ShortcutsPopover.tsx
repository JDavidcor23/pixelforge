import { Fragment } from 'react'
import { X } from 'lucide-react'

import { KeyChip } from '../KeyChip/KeyChip'
import { useShortcutsPopover } from './useShortcutsPopover.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

interface ShortcutsPopoverProps {
  triggerRef: React.RefObject<HTMLButtonElement | null>
  onClose: (returnFocus: boolean) => void
}

export function ShortcutsPopover({ triggerRef, onClose }: ShortcutsPopoverProps) {
  const { popoverRef, closeRef, titleId, rows, handleKeyDown, handleClose } = useShortcutsPopover(
    triggerRef,
    onClose
  )

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
      className={`absolute right-0 bottom-full z-50 mb-2 flex w-72 flex-col overflow-hidden rounded-md border border-line-strong bg-raised shadow-popover ${MOTION.POPOVER_ENTER_UP}`}
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 id={titleId} className="text-sm font-semibold text-ink">
          Keyboard shortcuts
        </h2>
        <button
          ref={closeRef}
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className={`rounded p-1 text-subtle hover:text-ink ${MOTION.COLORS} ${FOCUS_RING.RAISED}`}
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
      <dl className="flex flex-col p-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 rounded px-2 py-1.5">
            <dt className="text-xs text-ink">{row.label}</dt>
            <dd className="flex items-center gap-1">
              {row.keys.map((key, index) => (
                <Fragment key={key}>
                  {row.alternatives && index > 0 && (
                    <span className="text-3xs text-subtle" aria-hidden>
                      /
                    </span>
                  )}
                  <KeyChip label={key} />
                </Fragment>
              ))}
              <span className="sr-only">{row.spokenKeys}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

import { Check, ChevronDown } from 'lucide-react'

import { useCanvasSizePopover } from './useCanvasSizePopover.hook'
import { CANVAS_SIZE_AI_HINT } from '@/constants'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

const CHIP =
  'rounded border border-line-strong px-1.5 py-0.5 font-mono text-3xs uppercase tracking-wider text-subtle'

const CHIP_BUTTON = `inline-flex items-center gap-1 ${CHIP} hover:bg-hover hover:text-ink ${MOTION.COLORS} ${FOCUS_RING.SURFACE}`

const MENU_ITEM = `flex w-full items-center justify-between px-3 py-2 text-left text-xs text-ink hover:bg-hover ${MOTION.COLORS} ${FOCUS_RING.INSET}`

export const CanvasSizePopover = () => {
  const {
    width,
    height,
    label,
    sizeOptions,
    isOpen,
    menuRef,
    triggerRef,
    toggle,
    handleSelectSize,
    handleMenuKeyDown,
    pendingSize,
    confirmResize,
    cancelResize,
    confirmMessage,
  } = useCanvasSizePopover()

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="Change the canvas size"
        className={CHIP_BUTTON}
      >
        {label}
        <ChevronDown size={10} aria-hidden />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Canvas size"
          onKeyDown={handleMenuKeyDown}
          className={`absolute left-0 top-full z-50 mt-1 w-56 rounded border border-line-strong bg-raised py-1 shadow-popover ${MOTION.POPOVER_ENTER}`}
        >
          {pendingSize === null ? (
            sizeOptions.map((size) => (
              <button key={size} type="button" role="menuitem" onClick={() => handleSelectSize(size)} className={MENU_ITEM}>
                <span className="flex flex-col">
                  <span>
                    {size} × {size}
                  </span>
                  {CANVAS_SIZE_AI_HINT[size] && <span className="text-3xs text-subtle">{CANVAS_SIZE_AI_HINT[size]}</span>}
                </span>
                {size === width && size === height && <Check size={14} className="shrink-0 text-accent" aria-hidden />}
              </button>
            ))
          ) : (
            <div className="px-3 py-2.5">
              <p className="text-xs text-ink">{confirmMessage}</p>
              <div className="mt-2.5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelResize}
                  className={`rounded px-2.5 py-1 text-xs text-muted hover:bg-hover ${MOTION.COLORS} ${FOCUS_RING.RAISED}`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmResize}
                  className={`rounded bg-accent px-2.5 py-1 text-xs font-semibold text-on-accent hover:bg-accent-strong ${MOTION.PRESS} ${FOCUS_RING.RAISED}`}
                >
                  Resize
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

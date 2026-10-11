import { Plus } from 'lucide-react'

import { DropZone } from '../DropZone/DropZone'
import { useAddTrackRow } from './useAddTrackRow.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

interface AddTrackRowProps {
  isEmpty: boolean
  /** Width of the lane area visible in the scroller; keeps the drop zone on screen. */
  visibleLaneWidth: number
}

export function AddTrackRow({ isEmpty, visibleLaneWidth }: AddTrackRowProps) {
  const {
    triggerRef,
    menuRef,
    isMenuOpen,
    options,
    handleToggleMenu,
    handleAddTrack,
    handleMenuKeyDown,
  } = useAddTrackRow()

  return (
    <div className={`flex ${isEmpty ? 'min-h-48 flex-1' : 'h-16 shrink-0'}`}>
      <div className="sticky left-0 z-10 flex w-42 shrink-0 border-r border-line bg-surface">
        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggleMenu}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          className={`flex h-16 w-full items-center gap-1.5 px-3 text-ui text-muted hover:bg-hover hover:text-ink ${MOTION.COLORS} ${FOCUS_RING.INSET}`}
        >
          <Plus className="size-3.25" aria-hidden />
          Add track
        </button>
        {isMenuOpen && (
          <div
            ref={menuRef}
            role="menu"
            aria-label="Track type"
            onKeyDown={handleMenuKeyDown}
            className={`absolute bottom-full left-3 z-30 mb-1 flex w-40 flex-col rounded-md border border-line-strong bg-raised p-1 shadow-popover ${MOTION.POPOVER_ENTER_UP_LEFT}`}
          >
            {options.map(({ kind, label, icon: Icon, iconClass }) => (
              <button
                key={kind}
                type="button"
                role="menuitem"
                onClick={() => handleAddTrack(kind)}
                className={`flex items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-ink hover:bg-hover ${MOTION.COLORS} ${FOCUS_RING.INSET}`}
              >
                <Icon className={`size-3.25 ${iconClass}`} aria-hidden />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div
        className={`sticky left-42 flex px-4 py-2.5 ${visibleLaneWidth > 0 ? 'flex-none' : 'flex-1'}`}
        style={visibleLaneWidth > 0 ? { width: visibleLaneWidth } : undefined}
      >
        <DropZone isEmpty={isEmpty} />
      </div>
    </div>
  )
}

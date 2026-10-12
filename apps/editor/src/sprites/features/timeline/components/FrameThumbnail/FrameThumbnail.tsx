import { memo } from 'react'
import { X } from 'lucide-react'

import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import { TIMELINE_THUMBNAIL_SIZE } from '@/constants'

interface FrameThumbnailProps {
  readonly frameIndex: number
  readonly isActive: boolean
  readonly isSelected: boolean
  readonly isOnly: boolean
  readonly onRemove: (index: number) => void
}

function getThumbnailBorderClass(isActive: boolean, isSelected: boolean): string {
  if (isActive) return 'border-2 border-accent'
  if (isSelected) return 'border-2 border-accent/50'
  return 'border border-line-strong hover:border-line-strong/80'
}

// Props are all primitives plus a stable `onRemove` callback (useCallback'd
// in `useTimelineBar`) — memoized so a re-render of TimelineBar (e.g. a
// frame added elsewhere) doesn't re-render every OTHER thumbnail.
export const FrameThumbnail = memo(function FrameThumbnail({
  frameIndex,
  isActive,
  isSelected,
  isOnly,
  onRemove,
}: FrameThumbnailProps) {
  return (
    <div className="group relative shrink-0" data-frame-index={frameIndex}>
      {/* Visual tile — interaction handled by the strip container */}
      <div
        style={{ width: TIMELINE_THUMBNAIL_SIZE, height: TIMELINE_THUMBNAIL_SIZE }}
        className={`checker-bg relative rounded-sm select-none ${getThumbnailBorderClass(isActive, isSelected)}`}
      >
        <span className="absolute left-0.5 top-0.5 rounded-sm bg-sunken px-1 font-mono text-3xs leading-none text-ink">
          {frameIndex + 1}
        </span>
      </div>

      {/* Delete button — own click handler, stops propagation. Visible on hover/focus
          of the thumbnail and always visible on the active frame — a filled red
          circle used to sit right on top of the red/cyan selection border and was
          nearly invisible, so this is a neutral square that only turns danger-red
          on hover/focus. */}
      <button
        type="button"
        data-is-delete-btn="true"
        onClick={(e) => {
          e.stopPropagation()
          if (!isOnly) onRemove(frameIndex)
        }}
        onPointerDown={(e) => e.stopPropagation()} // prevent strip drag from starting here
        disabled={isOnly}
        aria-label={`Delete frame ${frameIndex + 1}`}
        title={isOnly ? "Can't delete the only frame" : `Delete frame ${frameIndex + 1}`}
        className={`absolute -right-1 -top-1 size-4 items-center justify-center rounded-sm border border-line-strong bg-sunken text-muted ${MOTION.COLORS} ${FOCUS_RING.BASE} hover:border-danger hover:bg-danger hover:text-ink focus-visible:border-danger focus-visible:bg-danger focus-visible:text-ink disabled:pointer-events-none disabled:opacity-40 ${
          isActive ? 'flex' : 'hidden group-hover:flex group-focus-within:flex'
        }`}
      >
        <X size={10} aria-hidden />
      </button>
    </div>
  )
})

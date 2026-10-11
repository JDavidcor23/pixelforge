import { memo } from 'react'

import { ClipWave } from '../ClipWave/ClipWave'
import { useTimelineClip } from './useTimelineClip.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { CLIP_KEY_SHORTCUTS } from '@/constants/timeline-view'
import { MOTION } from '@/constants/motion'
import type { TimelineClip as TimelineClipModel, TimelineTrack } from '@/types/timeline'

interface TimelineClipProps {
  clip: TimelineClipModel
  track: TimelineTrack
  trackIndex: number
  /** Created after the timeline opened: plays the one-time arrival highlight. */
  isNew: boolean
  layerRef: React.RefObject<HTMLDivElement | null>
}

// Tiny clips (data-compact) move both handles OUTSIDE the body so it stays grabbable.
const TRIM_HANDLE =
  'absolute inset-y-0 z-10 flex w-3 -translate-x-1/2 cursor-col-resize items-center justify-center group-data-compact:w-2 group-data-compact:translate-x-0'
const TRIM_START_HANDLE = `left-0 group-data-compact:right-full group-data-compact:left-auto ${TRIM_HANDLE}`
const TRIM_END_HANDLE = `left-full ${TRIM_HANDLE}`
const TRIM_BAR =
  'hidden h-8 w-1.5 rounded-xs bg-muted group-hover:block group-data-selected:block group-data-selected:bg-accent hover:bg-ink group-data-selected:hover:bg-ink'

/** Memoized: dragging one clip replaces only that clip object, so the rest skip re-rendering. */
export const TimelineClip = memo(function TimelineClip({
  clip,
  track,
  trackIndex,
  isNew,
  layerRef,
}: TimelineClipProps) {
  const {
    name,
    peaks,
    sourceDuration,
    isSelected,
    isDragging,
    isTrimming,
    colorClasses,
    ariaLabel,
    geometry,
    waveWidth,
    guideX,
    isMuted,
    isNarrow,
    isCompact,
    handleBodyPointerDown,
    handleTrimStartPointerDown,
    handleTrimEndPointerDown,
    handlePointerMove,
    handlePointerUp,
    handleFocus,
  } = useTimelineClip({ clip, track, trackIndex, layerRef })

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={ariaLabel}
        aria-keyshortcuts={CLIP_KEY_SHORTCUTS}
        data-timeline-clip={clip.id}
        data-selected={isSelected || undefined}
        data-dragging={isDragging || undefined}
        data-trimming={isTrimming || undefined}
        data-muted={isMuted || undefined}
        data-narrow={isNarrow || undefined}
        data-compact={isCompact || undefined}
        onPointerDown={handleBodyPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onFocus={handleFocus}
        className={`group pointer-events-auto absolute h-16 cursor-grab touch-none rounded border select-none data-selected:z-10 data-dragging:z-20 data-dragging:cursor-grabbing data-dragging:opacity-90 data-dragging:shadow-popover data-muted:opacity-40 data-selected:border-accent data-selected:ring-1 data-selected:ring-accent/50 data-selected:ring-inset data-trimming:cursor-col-resize ${colorClasses.CLIP} ${MOTION.COLORS} ${isNew ? MOTION.ARRIVE : ''} ${FOCUS_RING.OUTLINE}`}
        style={{ left: geometry.left, top: geometry.top, width: geometry.width }}
      >
        {/* overflow-clip (not hidden) so the name can stay sticky while a long clip scrolls. */}
        <div className="flex h-full flex-col gap-1 overflow-clip px-2 py-1 group-data-compact:hidden">
          <span
            title={name}
            className="sticky left-44 max-w-full self-start truncate font-mono text-2xs text-muted group-data-narrow:invisible group-data-selected:text-ink"
          >
            {name}
          </span>
          <ClipWave
            clip={clip}
            peaks={peaks}
            sourceDuration={sourceDuration}
            widthPx={waveWidth}
            waveClass={colorClasses.WAVE}
          />
        </div>
        <div aria-hidden onPointerDown={handleTrimStartPointerDown} className={TRIM_START_HANDLE}>
          <span className={TRIM_BAR} />
        </div>
        <div aria-hidden onPointerDown={handleTrimEndPointerDown} className={TRIM_END_HANDLE}>
          <span className={TRIM_BAR} />
        </div>
      </div>
      {guideX !== null && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 z-30 w-px bg-accent/60"
          style={{ left: guideX }}
        />
      )}
    </>
  )
})

import { usePlayheadCap } from './usePlayheadCap.hook'
import { FOCUS_RING } from '@/constants/focus-ring'

export function PlayheadCap() {
  const { x, playheadTime, duration, valueText, handleKeyDown } = usePlayheadCap()

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Playhead"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={playheadTime}
      aria-valuetext={valueText}
      onKeyDown={handleKeyDown}
      className={`absolute bottom-0 left-0 h-3.5 w-3 -translate-x-1/2 cursor-ew-resize rounded-xs before:absolute before:-inset-x-2 before:-inset-y-1 ${FOCUS_RING.SURFACE}`}
      style={{ transform: `translateX(${x}px)` }}
    >
      <svg viewBox="0 0 12 14" className="size-full fill-accent" aria-hidden>
        <polygon points="0,0 12,0 12,8 6,14 0,8" />
      </svg>
    </div>
  )
}

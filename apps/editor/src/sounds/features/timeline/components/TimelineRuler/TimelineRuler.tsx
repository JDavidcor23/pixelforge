import { PlayheadCap } from '../PlayheadCap/PlayheadCap'
import { useTimelineRuler } from './useTimelineRuler.hook'

interface TimelineRulerProps {
  laneWidth: number
}

export function TimelineRuler({ laneWidth }: TimelineRulerProps) {
  const { ticks, handlePointerDown, handlePointerMove, handlePointerUp } = useTimelineRuler()

  return (
    <div className="sticky top-0 z-20 flex h-7 shrink-0 border-b border-line bg-surface">
      <div className="sticky left-0 z-10 flex w-42 shrink-0 items-center border-r border-line bg-surface px-3 font-mono text-3xs font-semibold tracking-widest text-muted uppercase">
        Tracks
      </div>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative flex-1 cursor-pointer select-none"
        style={{ minWidth: laneWidth }}
      >
        {ticks.map((tick) => (
          <div key={tick.time} aria-hidden className="absolute inset-y-0" style={{ left: tick.x }}>
            <span className={`absolute bottom-0 w-px bg-line-strong ${tick.major ? 'h-3.5' : 'h-2'}`} />
            {tick.label && (
              <span className="absolute top-0.5 ml-1 font-mono text-3xs text-muted tabular-nums">
                {tick.label}
              </span>
            )}
          </div>
        ))}
        <PlayheadCap />
      </div>
    </div>
  )
}

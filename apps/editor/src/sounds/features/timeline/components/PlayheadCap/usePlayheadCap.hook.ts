import { useCallback } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { formatSeconds } from '@/lib/sound-assets'
import { timelineDuration } from '@/lib/timeline-ops'
import { timeToX } from '@/lib/timeline-view'
import { SNAP_GRID_SECONDS } from '@/constants/timeline'
import { PLAYHEAD_LARGE_STEP_MULTIPLIER } from '@/constants/timeline-view'

/** The ruler's draggable/keyboard playhead handle — the ruler's only per-frame subscriber. */
export function usePlayheadCap() {
  const playheadTime = useSoundsStore((state) => state.playheadTime)
  const pxPerSecond = useSoundsStore((state) => state.pxPerSecond)
  const duration = useSoundsStore((state) => timelineDuration(state.clips))
  const setPlayhead = useSoundsStore((state) => state.setPlayhead)

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const step = SNAP_GRID_SECONDS * (event.shiftKey ? PLAYHEAD_LARGE_STEP_MULTIPLIER : 1)
      const next: Record<string, number> = {
        ArrowLeft: playheadTime - step,
        ArrowDown: playheadTime - step,
        ArrowRight: playheadTime + step,
        ArrowUp: playheadTime + step,
        Home: 0,
        End: duration,
      }
      if (!(event.key in next)) return
      event.preventDefault()
      setPlayhead(Math.min(duration, Math.max(0, next[event.key])))
    },
    [playheadTime, duration, setPlayhead]
  )

  return {
    x: timeToX(playheadTime, pxPerSecond),
    playheadTime,
    duration,
    valueText: `${formatSeconds(playheadTime)} seconds`,
    handleKeyDown,
  }
}

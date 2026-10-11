import { useSoundsStore } from '@/stores/sounds.store'
import { timelineDuration } from '@/lib/timeline-ops'
import { formatClock } from '@/lib/timeline-view'

/** "current / total" readout. Isolated so only the transport re-renders per frame. */
export function useTimelineClock() {
  const playheadTime = useSoundsStore((state) => state.playheadTime)
  const duration = useSoundsStore((state) => timelineDuration(state.clips))

  return { timeLabel: formatClock(playheadTime), totalLabel: formatClock(duration) }
}

import { useEffect } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { timeToX } from '@/lib/timeline-view'
import { TIMELINE_LAYOUT } from '@/constants/timeline-view'

/**
 * The only subscriber to `playheadTime` inside the track area, so a playing
 * timeline re-renders this line — not the lanes and clips around it.
 */
export function usePlayhead(scrollRef: React.RefObject<HTMLDivElement | null>, isPlaying: boolean) {
  const playheadTime = useSoundsStore((state) => state.playheadTime)
  const pxPerSecond = useSoundsStore((state) => state.pxPerSecond)

  const x = timeToX(playheadTime, pxPerSecond)

  // Keep the playhead in view while playing (page forward, or back on loop).
  useEffect(() => {
    const scroller = scrollRef.current
    if (!isPlaying || !scroller) return
    const visibleWidth = scroller.clientWidth - TIMELINE_LAYOUT.HEAD_WIDTH_PX
    const left = scroller.scrollLeft
    if (x < left || x > left + visibleWidth - TIMELINE_LAYOUT.FOLLOW_MARGIN_PX) {
      scroller.scrollLeft = Math.max(0, x - TIMELINE_LAYOUT.FOLLOW_MARGIN_PX)
    }
  }, [scrollRef, isPlaying, x])

  return { x }
}

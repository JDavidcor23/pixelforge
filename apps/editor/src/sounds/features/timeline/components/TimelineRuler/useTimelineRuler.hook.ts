import { useCallback } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { rulerTicks, visibleDuration, xToTime } from '@/lib/timeline-view'

/** Ticks + click/drag to seek. The playhead cap renders separately (per-frame updates). */
export function useTimelineRuler() {
  const clips = useSoundsStore((state) => state.clips)
  const pxPerSecond = useSoundsStore((state) => state.pxPerSecond)
  const setPlayhead = useSoundsStore((state) => state.setPlayhead)

  const seekToPointer = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      setPlayhead(xToTime(event.clientX - rect.left, pxPerSecond))
    },
    [pxPerSecond, setPlayhead]
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      event.currentTarget.setPointerCapture(event.pointerId)
      seekToPointer(event)
    },
    [seekToPointer]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) seekToPointer(event)
    },
    [seekToPointer]
  )

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  return {
    ticks: rulerTicks(visibleDuration(clips), pxPerSecond),
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  }
}

import { useCallback, useMemo, useRef } from 'react'

import { resamplePeaks } from '@/lib/audio-peaks'
import { formatDuration } from '@/lib/sound-assets'
import {
  PLACEHOLDER_PEAKS,
  SEEK_STEP_S,
  WAVE_BAR_COUNT,
  WAVE_BAR_GAP,
  WAVE_BAR_RADIUS,
  WAVE_BAR_WIDTH,
  WAVE_MIN_BAR_HEIGHT,
  WAVE_VIEW_HEIGHT,
} from '@/constants/sound-library'

const BAR_PITCH = WAVE_BAR_WIDTH + WAVE_BAR_GAP
const VIEW_WIDTH = WAVE_BAR_COUNT * BAR_PITCH - WAVE_BAR_GAP
const VIEW_BOX = `0 0 ${VIEW_WIDTH} ${WAVE_VIEW_HEIGHT}`

interface UseWaveformParams {
  peaks: readonly number[] | undefined
  progress: number
  currentTime: number
  duration: number
  onSeek: (time: number) => void
}

export function useWaveform({ peaks, progress, currentTime, duration, onSeek }: UseWaveformParams) {
  const isDraggingRef = useRef(false)

  const bars = useMemo(() => {
    const source = peaks && peaks.length > 0 ? peaks : PLACEHOLDER_PEAKS
    return resamplePeaks(source, WAVE_BAR_COUNT).map((peak, index) => {
      const height = Math.max(WAVE_MIN_BAR_HEIGHT, peak * WAVE_VIEW_HEIGHT)
      return { x: index * BAR_PITCH, y: (WAVE_VIEW_HEIGHT - height) / 2, height }
    })
  }, [peaks])

  const playedCount = Math.floor(Math.min(1, Math.max(0, progress)) * WAVE_BAR_COUNT)

  const seekToPointer = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (duration <= 0) return
      const rect = event.currentTarget.getBoundingClientRect()
      const ratio = (event.clientX - rect.left) / rect.width
      onSeek(Math.min(1, Math.max(0, ratio)) * duration)
    },
    [duration, onSeek]
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      isDraggingRef.current = true
      event.currentTarget.setPointerCapture(event.pointerId)
      seekToPointer(event)
    },
    [seekToPointer]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (isDraggingRef.current) seekToPointer(event)
    },
    [seekToPointer]
  )

  const handlePointerUp = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    isDraggingRef.current = false
    event.currentTarget.releasePointerCapture(event.pointerId)
  }, [])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<SVGSVGElement>) => {
      const target =
        event.key === 'ArrowRight' || event.key === 'ArrowUp'
          ? currentTime + SEEK_STEP_S
          : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
            ? currentTime - SEEK_STEP_S
            : event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? duration
                : null
      if (target === null) return
      event.preventDefault()
      onSeek(target)
    },
    [currentTime, duration, onSeek]
  )

  return {
    bars,
    playedCount,
    viewBox: VIEW_BOX,
    barWidth: WAVE_BAR_WIDTH,
    barRadius: WAVE_BAR_RADIUS,
    valueText: `${formatDuration(currentTime)} of ${formatDuration(duration)}`,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleKeyDown,
  }
}

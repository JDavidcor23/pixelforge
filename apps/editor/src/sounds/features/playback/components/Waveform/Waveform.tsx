import { useWaveform } from './useWaveform.hook'
import { FOCUS_RING } from '@/constants/focus-ring'

interface WaveformProps {
  peaks: readonly number[] | undefined
  progress: number
  currentTime: number
  duration: number
  onSeek: (time: number) => void
}

export function Waveform({ peaks, progress, currentTime, duration, onSeek }: WaveformProps) {
  const {
    bars,
    playedCount,
    viewBox,
    barWidth,
    barRadius,
    valueText,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleKeyDown,
  } = useWaveform({ peaks, progress, currentTime, duration, onSeek })

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="none"
      role="slider"
      tabIndex={0}
      aria-label="Playback position"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={currentTime}
      aria-valuetext={valueText}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      className={`h-42.5 w-full cursor-pointer touch-none rounded ${FOCUS_RING.SURFACE}`}
    >
      {bars.map((bar, index) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={bar.y}
          width={barWidth}
          height={bar.height}
          rx={barRadius}
          className={index < playedCount ? 'fill-accent' : 'fill-accent/30'}
        />
      ))}
    </svg>
  )
}

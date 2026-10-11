import { useClipWave } from './useClipWave.hook'
import type { TimelineClip } from '@/types/timeline'

interface ClipWaveProps {
  clip: TimelineClip
  peaks: readonly number[] | undefined
  sourceDuration: number
  widthPx: number
  /** TRACK_COLOR[kind].WAVE — fill classes keyed to the clip's selected state. */
  waveClass: string
}

export function ClipWave({ clip, peaks, sourceDuration, widthPx, waveClass }: ClipWaveProps) {
  const { bars, viewBox, barWidth, barRadius } = useClipWave(clip, peaks, sourceDuration, widthPx)

  return (
    <svg viewBox={viewBox} preserveAspectRatio="none" className="min-h-0 w-full flex-1" aria-hidden>
      {bars.map((bar) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={bar.y}
          width={barWidth}
          height={bar.height}
          rx={barRadius}
          className={waveClass}
        />
      ))}
    </svg>
  )
}

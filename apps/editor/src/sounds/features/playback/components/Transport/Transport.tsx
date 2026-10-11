import { Pause, Play, Repeat, Square, Volume2, VolumeX } from 'lucide-react'

import { TweakSlider } from '@/sounds/features/synthesizer'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import { VOLUME_RANGE } from '@/constants/sound-library'

interface TransportProps {
  isPlaying: boolean
  loop: boolean
  volume: number
  timeLabel: string
  /** Timeline style: "current / total" at `text-ui`, total in subtle ink. */
  totalLabel?: string
  /** Small caption before the volume icon (e.g. "Master"). */
  volumeLabel?: string
  onTogglePlay: () => void
  onStop: () => void
  onLoopToggle: () => void
  onVolumeChange: (volume: number) => void
}

const ICON_ACTION = `flex size-8 items-center justify-center rounded text-muted hover:text-accent aria-pressed:bg-hover aria-pressed:text-accent ${FOCUS_RING.SURFACE}`

export function Transport({
  isPlaying,
  loop,
  volume,
  timeLabel,
  totalLabel,
  volumeLabel,
  onTogglePlay,
  onStop,
  onLoopToggle,
  onVolumeChange,
}: TransportProps) {
  return (
    <div className="flex h-9 items-center gap-2.5">
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className={`flex size-9 items-center justify-center rounded-full bg-accent text-on-accent hover:bg-white active:bg-accent-strong ${MOTION.PRESS} ${FOCUS_RING.SURFACE}`}
      >
        {isPlaying ? (
          <Pause className="size-3.75 fill-current" aria-hidden />
        ) : (
          <Play className="size-3.75 fill-current" aria-hidden />
        )}
      </button>
      <button type="button" onClick={onStop} aria-label="Stop" className={ICON_ACTION}>
        <Square className="size-3.5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onLoopToggle}
        aria-label="Loop"
        aria-pressed={loop}
        className={ICON_ACTION}
      >
        <Repeat className="size-3.5" aria-hidden />
      </button>
      {totalLabel === undefined ? (
        <span className="font-mono text-xs text-muted tabular-nums">{timeLabel}</span>
      ) : (
        <span className="font-mono text-ui text-ink tabular-nums">
          {timeLabel}
          <span className="text-subtle"> / {totalLabel}</span>
        </span>
      )}

      <span className="flex-1" />

      {volumeLabel && <span className="text-2xs text-subtle">{volumeLabel}</span>}

      {volume > VOLUME_RANGE.MIN ? (
        <Volume2 className="size-3.5 text-muted" aria-hidden />
      ) : (
        <VolumeX className="size-3.5 text-muted" aria-hidden />
      )}
      <TweakSlider
        variant="compact"
        ariaLabel="Volume"
        value={volume}
        min={VOLUME_RANGE.MIN}
        max={VOLUME_RANGE.MAX}
        step={VOLUME_RANGE.STEP}
        onChange={onVolumeChange}
      />
    </div>
  )
}

import type { SnapOptions, TimelineClip } from '@/types/timeline'
import type { RulerTick, SnappedMove, WaveBar } from '@/types/timeline-view'
import {
  CLIP_WAVE,
  CLOCK_CENTISECONDS,
  RULER_LABEL_MAX_DECIMALS,
  RULER_MAJOR_STEPS,
  RULER_MIN_MAJOR_SPACING_PX,
  RULER_MINOR_DIVISIONS,
  TIMELINE_LAYOUT,
} from '@/constants/timeline-view'
import { SECONDS_PER_MINUTE } from '@/constants/sound-library'
import { TIME_EPSILON } from '@/constants/timeline'
import { resamplePeaks } from './audio-peaks'
import { formatSeconds } from './sound-assets'
import { snapTime, timelineDuration } from './timeline-ops'

// Pure geometry + formatting for the timeline view. Lanes start with
// LANE_PADDING_PX of breathing room before second 0.

export const timeToX = (time: number, pxPerSecond: number): number =>
  TIMELINE_LAYOUT.LANE_PADDING_PX + time * pxPerSecond

export const xToTime = (x: number, pxPerSecond: number): number =>
  Math.max(0, (x - TIMELINE_LAYOUT.LANE_PADDING_PX) / pxPerSecond)

/** Seconds the lanes show: the mix plus trailing room to drop into. */
export const visibleDuration = (clips: readonly TimelineClip[]): number =>
  timelineDuration(clips) + TIMELINE_LAYOUT.TRAILING_SECONDS

export const laneWidthPx = (clips: readonly TimelineClip[], pxPerSecond: number): number =>
  timeToX(visibleDuration(clips), pxPerSecond)

/** "1s", "0.5s", "0.25s" — no trailing zeros. */
export function formatTickLabel(seconds: number): string {
  return `${Number(seconds.toFixed(RULER_LABEL_MAX_DECIMALS))}s`
}

/** Labelled-tick spacing that stays readable at this zoom. */
export function rulerMajorStep(pxPerSecond: number): number {
  return (
    RULER_MAJOR_STEPS.find((step) => step * pxPerSecond >= RULER_MIN_MAJOR_SPACING_PX) ??
    RULER_MAJOR_STEPS[RULER_MAJOR_STEPS.length - 1]
  )
}

export function rulerTicks(durationSeconds: number, pxPerSecond: number): RulerTick[] {
  const major = rulerMajorStep(pxPerSecond)
  const minor = major / RULER_MINOR_DIVISIONS
  const count = Math.floor(durationSeconds / minor + TIME_EPSILON)
  return Array.from({ length: count + 1 }, (_, index) => {
    const time = index * minor
    const isMajor = index % RULER_MINOR_DIVISIONS === 0
    return {
      time,
      x: timeToX(time, pxPerSecond),
      major: isMajor,
      label: isMajor ? formatTickLabel(time) : null,
    }
  })
}

const pad2 = (value: number): string => String(value).padStart(2, '0')

/** 1.244 → "00:01.24", 75.5 → "01:15.50". */
export function formatClock(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  const totalCentis = Math.floor(safe * CLOCK_CENTISECONDS + TIME_EPSILON)
  const centis = totalCentis % CLOCK_CENTISECONDS
  const totalSeconds = Math.floor(totalCentis / CLOCK_CENTISECONDS)
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE)
  return `${pad2(minutes)}:${pad2(totalSeconds % SECONDS_PER_MINUTE)}.${pad2(centis)}`
}

/** "laser_01, Effects, starts 0.10s, 0.80s long" */
export function clipAriaLabel(name: string, trackName: string, clip: TimelineClip): string {
  return `${name}, ${trackName}, starts ${formatSeconds(clip.start)}s, ${formatSeconds(clip.duration)}s long`
}

/**
 * Snaps a moving clip by whichever edge (start or end) is closer to
 * something it can lock to. Returns the new start and the guide position.
 */
export function snapClipMove(start: number, duration: number, options: SnapOptions): SnappedMove {
  const snappedStart = snapTime(start, options)
  const snappedEnd = snapTime(start + duration, options)
  const startTravel = snappedStart === start ? Infinity : Math.abs(snappedStart - start)
  const endTravel = snappedEnd === start + duration ? Infinity : Math.abs(snappedEnd - (start + duration))
  if (startTravel === Infinity && endTravel === Infinity) return { start: Math.max(0, start), guide: null }
  if (startTravel <= endTravel) return { start: Math.max(0, snappedStart), guide: snappedStart }
  return { start: Math.max(0, snappedEnd - duration), guide: snappedEnd }
}

/** Bars that fit in a clip `widthPx` wide (content area, padding excluded). */
export function clipBarCount(widthPx: number): number {
  return Math.max(0, Math.floor(widthPx / (CLIP_WAVE.BAR_WIDTH + CLIP_WAVE.BAR_GAP)))
}

/**
 * The part of an asset's peaks a clip actually plays (its offset and
 * speed-adjusted span), resampled to `barCount` bars.
 */
export function clipPeaks(
  peaks: readonly number[],
  sourceDuration: number,
  clip: TimelineClip,
  barCount: number
): number[] {
  if (barCount <= 0) return []
  if (peaks.length === 0 || sourceDuration <= 0) return resamplePeaks(peaks, barCount)
  const span = clip.duration * clip.speed
  const from = Math.max(0, Math.floor((clip.offset / sourceDuration) * peaks.length))
  const to = Math.min(peaks.length, Math.ceil(((clip.offset + span) / sourceDuration) * peaks.length))
  const slice = to > from ? peaks.slice(from, to) : peaks.slice(from, from + 1)
  return resamplePeaks(slice, barCount)
}

/** Vertically centered bars in a `barCount × (BAR_WIDTH + BAR_GAP)` wide viewBox. */
export function waveBars(peaks: readonly number[]): WaveBar[] {
  return peaks.map((peak, index) => {
    const height = Math.max(CLIP_WAVE.MIN_BAR_HEIGHT, peak * CLIP_WAVE.VIEW_HEIGHT)
    return {
      x: index * (CLIP_WAVE.BAR_WIDTH + CLIP_WAVE.BAR_GAP),
      y: (CLIP_WAVE.VIEW_HEIGHT - height) / 2,
      height,
    }
  })
}

/** "It's also used in 2 clips on the timeline; they'll be removed." */
export function clipUsageMessage(count: number): string | null {
  if (count <= 0) return null
  return count === 1
    ? 'It’s also used in 1 clip on the timeline; it’ll be removed.'
    : `It’s also used in ${count} clips on the timeline; they’ll be removed.`
}

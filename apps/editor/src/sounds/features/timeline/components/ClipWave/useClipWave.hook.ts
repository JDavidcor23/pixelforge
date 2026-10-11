import { useMemo } from 'react'

import { clipBarCount, clipPeaks, waveBars } from '@/lib/timeline-view'
import { PLACEHOLDER_PEAKS } from '@/constants/sound-library'
import { CLIP_WAVE } from '@/constants/timeline-view'
import type { TimelineClip } from '@/types/timeline'

/** Bars for the slice of the asset this clip plays, as many as fit its width. */
export function useClipWave(
  clip: TimelineClip,
  peaks: readonly number[] | undefined,
  sourceDuration: number,
  widthPx: number
) {
  const barCount = clipBarCount(widthPx)
  const hasPeaks = peaks !== undefined && peaks.length > 0

  const bars = useMemo(
    () =>
      waveBars(
        hasPeaks
          ? clipPeaks(peaks, sourceDuration, clip, barCount)
          : clipPeaks(PLACEHOLDER_PEAKS, 0, clip, barCount)
      ),
    [hasPeaks, peaks, sourceDuration, clip, barCount]
  )

  return {
    bars,
    viewBox: `0 0 ${Math.max(1, barCount * (CLIP_WAVE.BAR_WIDTH + CLIP_WAVE.BAR_GAP))} ${CLIP_WAVE.VIEW_HEIGHT}`,
    barWidth: CLIP_WAVE.BAR_WIDTH,
    barRadius: CLIP_WAVE.BAR_RADIUS,
  }
}

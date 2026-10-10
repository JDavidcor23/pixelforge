import { useMemo } from 'react'

import { resamplePeaks } from '@/lib/audio-peaks'
import { MINI_WAVE, MINI_WAVE_BAR_COUNT, PLACEHOLDER_PEAKS } from '@/constants/sound-library'

const VIEW_BOX = `0 0 ${MINI_WAVE.VIEW_WIDTH} ${MINI_WAVE.VIEW_HEIGHT}`
// Center the 18-bar strip inside the 56-wide viewBox.
const STRIP_WIDTH = MINI_WAVE_BAR_COUNT * (MINI_WAVE.BAR_WIDTH + MINI_WAVE.BAR_GAP) - MINI_WAVE.BAR_GAP
const STRIP_OFFSET = (MINI_WAVE.VIEW_WIDTH - STRIP_WIDTH) / 2

export function useMiniWave(peaks: readonly number[] | undefined) {
  const bars = useMemo(() => {
    const source = peaks && peaks.length > 0 ? peaks : PLACEHOLDER_PEAKS
    return resamplePeaks(source, MINI_WAVE_BAR_COUNT).map((peak, index) => {
      const height = Math.max(MINI_WAVE.MIN_BAR_HEIGHT, peak * MINI_WAVE.VIEW_HEIGHT)
      return {
        x: STRIP_OFFSET + index * (MINI_WAVE.BAR_WIDTH + MINI_WAVE.BAR_GAP),
        y: (MINI_WAVE.VIEW_HEIGHT - height) / 2,
        height,
      }
    })
  }, [peaks])

  return { bars, viewBox: VIEW_BOX, barWidth: MINI_WAVE.BAR_WIDTH }
}

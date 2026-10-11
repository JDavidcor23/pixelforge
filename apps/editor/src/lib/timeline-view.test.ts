import { describe, expect, it } from 'vitest'

import type { TimelineClip } from '@/types/timeline'
import { CLIP_WAVE, TIMELINE_LAYOUT } from '@/constants/timeline-view'
import {
  clipAriaLabel,
  clipBarCount,
  clipPeaks,
  clipUsageMessage,
  formatClock,
  formatTickLabel,
  rulerMajorStep,
  rulerTicks,
  snapClipMove,
  timeToX,
  waveBars,
  xToTime,
} from './timeline-view'

const clip = (overrides: Partial<TimelineClip> = {}): TimelineClip => ({
  id: 'c1',
  trackId: 't1',
  assetId: 'a1',
  start: 0.1,
  offset: 0,
  duration: 0.8,
  gainDb: 0,
  fadeIn: 0,
  fadeOut: 0,
  speed: 1,
  ...overrides,
})

describe('time ↔ x', () => {
  it('offsets by the lane padding and round-trips', () => {
    expect(timeToX(0, 200)).toBe(TIMELINE_LAYOUT.LANE_PADDING_PX)
    expect(timeToX(1.5, 200)).toBe(TIMELINE_LAYOUT.LANE_PADDING_PX + 300)
    expect(xToTime(timeToX(1.5, 200), 200)).toBeCloseTo(1.5)
  })

  it('never returns negative time', () => {
    expect(xToTime(0, 200)).toBe(0)
  })
})

describe('ruler', () => {
  it('labels every second at the default 200 px/s, minor ticks every half second', () => {
    expect(rulerMajorStep(200)).toBe(1)
    const ticks = rulerTicks(2, 200)
    expect(ticks.map((tick) => tick.time)).toEqual([0, 0.5, 1, 1.5, 2])
    expect(ticks.map((tick) => tick.label)).toEqual(['0s', null, '1s', null, '2s'])
  })

  it('spreads labels out when zoomed out', () => {
    expect(rulerMajorStep(50)).toBe(5)
  })

  it('formats fractional labels without trailing zeros', () => {
    expect(formatTickLabel(0.25)).toBe('0.25s')
    expect(formatTickLabel(0.5)).toBe('0.5s')
  })
})

describe('formatClock', () => {
  it('reads mm:ss.cc', () => {
    expect(formatClock(1.24)).toBe('00:01.24')
    expect(formatClock(4)).toBe('00:04.00')
    expect(formatClock(75.5)).toBe('01:15.50')
    expect(formatClock(-1)).toBe('00:00.00')
  })
})

describe('snapClipMove', () => {
  const options = { grid: 0, edges: [0, 2], threshold: 0.1 }

  it('locks the start edge when it is closer', () => {
    expect(snapClipMove(1.95, 0.5, options)).toEqual({ start: 2, guide: 2 })
  })

  it('locks the end edge when it is closer', () => {
    const result = snapClipMove(1.47, 0.5, options)
    expect(result.start).toBeCloseTo(1.5)
    expect(result.guide).toBe(2)
  })

  it('leaves the clip alone when nothing is near', () => {
    expect(snapClipMove(1, 0.5, options)).toEqual({ start: 1, guide: null })
  })
})

describe('clip waveform', () => {
  it('fits bars to the width', () => {
    expect(clipBarCount(100)).toBe(Math.floor(100 / (CLIP_WAVE.BAR_WIDTH + CLIP_WAVE.BAR_GAP)))
    expect(clipBarCount(-5)).toBe(0)
  })

  it('slices the peaks the clip actually plays', () => {
    const peaks = [0, 0, 0, 0, 1, 1, 1, 1]
    // Source is 8s; the clip plays seconds 4..8.
    expect(clipPeaks(peaks, 8, clip({ offset: 4, duration: 4 }), 2)).toEqual([1, 1])
    // Speed 2 for 2s of timeline = 4s of source from offset 0.
    expect(clipPeaks(peaks, 8, clip({ offset: 0, duration: 2, speed: 2 }), 2)).toEqual([0, 0])
  })

  it('centers bars vertically', () => {
    const [bar] = waveBars([1])
    expect(bar.y).toBe(0)
    expect(bar.height).toBe(CLIP_WAVE.VIEW_HEIGHT)
    expect(waveBars([0])[0].height).toBe(CLIP_WAVE.MIN_BAR_HEIGHT)
  })
})

describe('copy helpers', () => {
  it('describes a clip for screen readers', () => {
    expect(clipAriaLabel('laser_01', 'Effects', clip())).toBe('laser_01, Effects, starts 0.10s, 0.80s long')
  })

  it('pluralizes the delete warning', () => {
    expect(clipUsageMessage(0)).toBeNull()
    expect(clipUsageMessage(1)).toContain('1 clip ')
    expect(clipUsageMessage(3)).toContain('3 clips')
  })
})

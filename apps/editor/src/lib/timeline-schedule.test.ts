import { describe, expect, it } from 'vitest'

import type { TimelineClip } from '@/types/timeline'
import { clipEnvelope, fadeEnvelopeAt, mixLength, scheduleClips } from './timeline-schedule'
import { dbToGain } from './timeline-ops'

const clip = (overrides: Partial<TimelineClip> = {}): TimelineClip => ({
  id: 'c1',
  trackId: 't1',
  assetId: 'a1',
  start: 1,
  offset: 0,
  duration: 2,
  gainDb: 0,
  fadeIn: 0,
  fadeOut: 0,
  speed: 1,
  ...overrides,
})

describe('scheduleClips', () => {
  it('waits for a clip that starts after the playhead', () => {
    const [entry] = scheduleClips([clip()], 0.25)
    expect(entry.when).toBeCloseTo(0.75)
    expect(entry.offset).toBe(0)
    expect(entry.playFor).toBe(2)
  })

  it('starts a clip under the playhead immediately, mid-way through its source', () => {
    const [entry] = scheduleClips([clip({ offset: 0.5 })], 1.5)
    expect(entry.when).toBe(0)
    expect(entry.offset).toBeCloseTo(1)
    expect(entry.playFor).toBeCloseTo(1.5)
  })

  it('advances the source offset by speed × elapsed timeline time', () => {
    const [entry] = scheduleClips([clip({ speed: 2, offset: 0.2 })], 1.5)
    expect(entry.offset).toBeCloseTo(0.2 + 0.5 * 2)
    expect(entry.speed).toBe(2)
    expect(entry.playFor).toBeCloseTo(1.5)
  })

  it('skips clips that already ended', () => {
    expect(scheduleClips([clip({ start: 0, duration: 1 })], 1)).toEqual([])
    expect(scheduleClips([clip({ start: 0, duration: 1 })], 2)).toEqual([])
  })

  it('keeps the clip/asset/track identity for routing', () => {
    const [entry] = scheduleClips([clip({ id: 'x', assetId: 'y', trackId: 'z' })], 0)
    expect(entry).toMatchObject({ clipId: 'x', assetId: 'y', trackId: 'z' })
  })
})

describe('clipEnvelope', () => {
  it('is a single flat point at the clip gain when there are no fades', () => {
    const points = clipEnvelope(clip({ gainDb: -6 }), 0)
    expect(points).toHaveLength(1)
    expect(points[0].time).toBe(0)
    expect(points[0].value).toBeCloseTo(dbToGain(-6))
  })

  it('ramps in from 0 and out to 0 across the whole clip', () => {
    const points = clipEnvelope(clip({ fadeIn: 0.5, fadeOut: 0.25 }), 0)
    expect(points.map((point) => point.time)).toEqual([0, 0.5, 1.75, 2])
    expect(points.map((point) => point.value)).toEqual([0, 1, 1, 0])
  })

  it('starts a partial fade-in when playback begins inside it', () => {
    const points = clipEnvelope(clip({ fadeIn: 1 }), 0.25)
    expect(points[0]).toEqual({ time: 0, value: 0.25 })
    expect(points[1]).toEqual({ time: 0.75, value: 1 })
  })

  it('starts inside the fade-out with the partial level and ramps to 0', () => {
    const points = clipEnvelope(clip({ fadeOut: 1 }), 1.5)
    expect(points[0].value).toBeCloseTo(0.5)
    expect(points[points.length - 1]).toEqual({ time: 0.5, value: 0 })
    expect(points).toHaveLength(2)
  })

  it('scales the whole curve by the clip gain', () => {
    const points = clipEnvelope(clip({ gainDb: 6, fadeIn: 0.5 }), 0)
    expect(points[1].value).toBeCloseTo(dbToGain(6))
  })
})

describe('fadeEnvelopeAt / mixLength', () => {
  it('clamps the envelope to 0..1', () => {
    expect(fadeEnvelopeAt(clip({ fadeIn: 1 }), -1)).toBe(0)
    expect(fadeEnvelopeAt(clip(), 1)).toBe(1)
  })

  it('is the end of the last clip, 0 when empty', () => {
    expect(mixLength([])).toBe(0)
    expect(mixLength([clip(), clip({ id: 'c2', start: 4, duration: 0.5 })])).toBe(4.5)
  })
})

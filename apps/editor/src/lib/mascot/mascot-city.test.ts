import { describe, expect, it } from 'vitest'

import { computePlanePosition, isWindowLit } from './mascot-city'
import { CITY } from './mascot.constants'

describe('isWindowLit', () => {
  it('is deterministic — the same seed and elapsed time always give the same answer', () => {
    expect(isWindowLit(7, 1234)).toBe(isWindowLit(7, 1234))
    expect(isWindowLit(42, 9000)).toBe(isWindowLit(42, 9000))
  })

  it('only changes when elapsed time crosses into a new blink bucket', () => {
    const withinSameBucket = isWindowLit(3, 100)
    expect(isWindowLit(3, 100 + CITY.WINDOW_BLINK_BUCKET_MS - 1)).toBe(withinSameBucket)
  })

  it('gives different windows (different seeds) independent states most of the time', () => {
    const states = Array.from({ length: 20 }, (_, seed) => isWindowLit(seed, 5000))
    // Not every window should agree — a real mix of lit/unlit, not a constant.
    expect(new Set(states).size).toBe(2)
  })
})

describe('computePlanePosition', () => {
  it('is present for only part of its cycle — never more than one plane at a time', () => {
    const crossing = computePlanePosition(100)
    const absent = computePlanePosition(CITY.PLANE_CROSS_DURATION_MS + 100)
    expect(crossing).not.toBeNull()
    expect(absent).toBeNull()
  })

  it('crosses the full width of its cycle left to right', () => {
    const start = computePlanePosition(0)
    const end = computePlanePosition(CITY.PLANE_CROSS_DURATION_MS - 1)
    expect(start).not.toBeNull()
    expect(end).not.toBeNull()
    expect(end!.x).toBeGreaterThan(start!.x)
  })

  it('repeats identically every cycle (pure function of elapsed time, no hidden state)', () => {
    const first = computePlanePosition(500)
    const secondCycle = computePlanePosition(500 + CITY.PLANE_CYCLE_MS)
    expect(secondCycle).toEqual(first)
  })
})

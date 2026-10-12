import { describe, it, expect } from 'vitest'

import { hexToHsv, hsvToHex } from './color-utils'

// hexToHsv/hsvToHex back the ColorPicker's sticky-hue local state
// (useColorPicker.hook.ts). Hue has no representation in an achromatic hex
// (black / white / gray) — these tests pin the fallback-hue contract so the
// hue slider never silently snaps to red.

describe('hexToHsv', () => {
  it('keeps the fallback hue for pure black (v=0)', () => {
    const hsv = hexToHsv('#000000', 210)
    expect(hsv.h).toBe(210)
    expect(hsv.s).toBe(0)
    expect(hsv.v).toBe(0)
  })

  it('keeps the fallback hue for a pure gray (s=0)', () => {
    const hsv = hexToHsv('#808080', 210)
    expect(hsv.h).toBe(210)
    expect(hsv.s).toBe(0)
  })

  it('ignores the fallback hue for a chromatic color and reads the real hue', () => {
    const hsv = hexToHsv('#ff0000', 210)
    expect(hsv.h).toBe(0)
    expect(hsv.s).toBe(100)
    expect(hsv.v).toBe(100)
  })

  it('preserves alpha (0-255 scale)', () => {
    const opaque = hexToHsv('#ff0000', 0)
    expect(opaque.a).toBe(255)

    const halfTransparent = hexToHsv('#ff000080', 0)
    expect(halfTransparent.a).toBe(128)
  })
})

describe('hsvToHex', () => {
  it('round-trips pure red', () => {
    const hsv = hexToHsv('#ff0000', 0)
    expect(hsvToHex(hsv)).toBe('#ff0000')
  })

  it('round-trips alpha', () => {
    const hsv = hexToHsv('#ff000080', 0)
    expect(hsvToHex(hsv)).toBe('#ff000080')
  })

  it('round-trips black with a non-zero fallback hue folded back in (no visible effect, h is unobservable at v=0)', () => {
    const hsv = hexToHsv('#000000', 210)
    expect(hsvToHex(hsv)).toBe('#000000')
  })
})

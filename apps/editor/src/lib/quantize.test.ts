import { describe, it, expect } from 'vitest'
import { quantizePixels } from './quantize'
import type { PixelBuffer } from '@/app/editor/types'

// Project-wide RgbaColor convention: alpha is 0..255 (matches canvas-renderer and store).
const px = (r: number, g: number, b: number, a = 255) => ({ r, g, b, a })

describe('quantizePixels', () => {
  it('reduces the palette to at most `colors` opaque colors', () => {
    const buf: PixelBuffer = [
      [px(200, 10, 10), px(198, 12, 9), px(12, 200, 14), px(10, 198, 16)],
      [px(15, 12, 205), px(13, 14, 200), px(0, 0, 0, 0), px(250, 250, 250)],
    ]
    const out = quantizePixels(buf, { colors: 4, weightBySaturation: true, iterations: 12, alphaThreshold: 128 })
    const palette = new Set<string>()
    out.flat().forEach(p => { if (p.a > 0) palette.add(`${p.r},${p.g},${p.b}`) })
    expect(palette.size).toBeLessThanOrEqual(4)
  })

  it('keeps fully transparent pixels transparent', () => {
    const buf: PixelBuffer = [[px(0, 0, 0, 0), px(200, 10, 10)]]
    const out = quantizePixels(buf, { colors: 2, weightBySaturation: true, iterations: 6, alphaThreshold: 128 })
    expect(out[0][0].a).toBe(0)
  })

  it('preserves a saturated color over the dominant near-white', () => {
    const buf: PixelBuffer = [
      [px(245, 245, 245), px(246, 244, 245), px(244, 245, 246), px(245, 246, 244)],
      [px(243, 245, 245), px(245, 245, 243), px(210, 20, 20), px(205, 18, 22)],
    ]
    const out = quantizePixels(buf, { colors: 2, weightBySaturation: true, iterations: 12, alphaThreshold: 128 })
    const hasRed = out.flat().some(p => p.r > 120 && p.r > p.g * 1.6 && p.r > p.b * 1.6)
    expect(hasRed).toBe(true)
  })
})

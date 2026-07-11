import { describe, it, expect } from 'vitest'
import { downscalePixels } from './downscale'
import type { PixelBuffer, RgbaColor } from '@/app/editor/types'

const px = (r: number, g: number, b: number, a = 255): RgbaColor => ({ r, g, b, a })
const RED = px(200, 10, 10)
const BLACK = px(0, 0, 0)
const CLEAR = px(0, 0, 0, 0)

/** Builds a size x size buffer filled by a callback. */
const build = (size: number, fill: (x: number, y: number) => RgbaColor): PixelBuffer =>
  Array.from({ length: size }, (_, y) => Array.from({ length: size }, (_, x) => fill(x, y)))

describe('downscalePixels', () => {
  it('picks the dominant color of each cell, ignoring minority outline samples', () => {
    // 8x8 source, 2x2 target: each 4x4 cell is red except one black pixel.
    const src = build(8, (x, y) => (x % 4 === 0 && y % 4 === 0 ? BLACK : RED))
    const out = downscalePixels(src, 2)
    expect(out.length).toBe(2)
    expect(out[0].length).toBe(2)
    out.flat().forEach((p) => {
      expect(p.r).toBeGreaterThan(150)
      expect(p.g).toBeLessThan(60)
    })
  })

  it('keeps a cell dominated by outline as outline', () => {
    // Left cell all black, right cell all red.
    const src = build(8, (x) => (x < 4 ? BLACK : RED))
    const out = downscalePixels(src, 2)
    expect(out[0][0].r).toBeLessThan(60)
    expect(out[0][1].r).toBeGreaterThan(150)
  })

  it('resolves alpha by majority: mostly transparent cells stay fully transparent', () => {
    // Top half transparent, bottom half red.
    const src = build(8, (_, y) => (y < 4 ? CLEAR : RED))
    const out = downscalePixels(src, 2)
    expect(out[0][0].a).toBe(0)
    expect(out[0][1].a).toBe(0)
    expect(out[1][0].a).toBe(255)
    expect(out[1][1].a).toBe(255)
  })

  it('handles source sizes that do not divide evenly by the target size', () => {
    const src = build(7, () => RED)
    const out = downscalePixels(src, 2)
    expect(out.length).toBe(2)
    expect(out[1].length).toBe(2)
    expect(out[1][1].r).toBeGreaterThan(150)
  })
})

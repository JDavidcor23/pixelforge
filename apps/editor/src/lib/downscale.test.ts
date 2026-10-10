import { describe, it, expect } from 'vitest'
import { downscalePixels, downscaleTo, resizeNearest } from './downscale'
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

describe('downscalePixels defringe', () => {
  const MUDDY = px(40, 20, 20, 140) // anti-aliased edge blend: mid alpha, dark color

  it('votes color only among solid-core pixels, ignoring muddy anti-aliased blends', () => {
    // 4x4 -> 1x1. Muddy edge pixels OUTNUMBER the solid red core (10 vs 6),
    // so a naive count-majority vote would output the dark blend. The defringed
    // result must stay red because color is trusted only from the opaque core.
    let placed = 0
    const src = build(4, () => {
      placed++
      return placed <= 6 ? RED : MUDDY
    })
    const out = downscalePixels(src, 1)
    expect(out[0][0].r).toBeGreaterThan(150)
    expect(out[0][0].g).toBeLessThan(60)
    expect(out[0][0].a).toBe(255)
  })

  it('drops a fringe-only cell while keeping the core cell (image has core elsewhere)', () => {
    // 8x8 -> 2x2. Left half is a solid red core, right half is pure muddy fringe.
    // The core exists (left) so defringe stays on: left cells render red, right
    // cells are halo with no core of their own and must key out.
    const src = build(8, (x) => (x < 4 ? RED : MUDDY))
    const out = downscalePixels(src, 2)
    expect(out[0][0].a).toBe(255)
    expect(out[0][0].r).toBeGreaterThan(150)
    expect(out[0][1].a).toBe(0)
    expect(out[1][1].a).toBe(0)
  })

  it('does NOT vanish an image that is uniformly semi-transparent (no core anywhere)', () => {
    // Guard against catastrophic keying: if NOTHING in the source clears the
    // core threshold, defringe backs off and every opaque pixel is trusted.
    const semi = px(200, 10, 10, 150)
    const src = build(8, () => semi)
    const out = downscalePixels(src, 2)
    out.flat().forEach((p) => {
      expect(p.a).toBe(255)
      expect(p.r).toBeGreaterThan(150)
    })
  })
})

describe('resizeNearest', () => {
  it('preserves exact source colours instead of averaging them', () => {
    const src: PixelBuffer = [[RED, BLACK]]
    const out = resizeNearest(src, 4, 1)

    expect(out[0].map((pixel) => pixel.r)).toEqual([RED.r, RED.r, BLACK.r, BLACK.r])
  })

  it('returns an empty buffer for empty sources or invalid target dimensions', () => {
    expect(resizeNearest([], 4, 4)).toEqual([])
    expect(resizeNearest([[RED]], 0, 4)).toEqual([])
  })
})

describe('downscaleTo input validation', () => {
  it('returns an empty buffer for empty sources or invalid target dimensions', () => {
    expect(downscaleTo([], 4, 4)).toEqual([])
    expect(downscaleTo([[RED]], 4, 0)).toEqual([])
  })
})

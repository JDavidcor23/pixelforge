import { describe, it, expect } from 'vitest'
import { downscalePixels, downscaleTo, resizeNearest } from './downscale'
import type { PixelBuffer, RgbaColor } from '@/types'
import { createEmptyBuffer, getPixel, putPixel } from './pixel-buffer'

const px = (r: number, g: number, b: number, a = 255): RgbaColor => ({ r, g, b, a })
const RED = px(200, 10, 10)
const BLACK = px(0, 0, 0)
const CLEAR = px(0, 0, 0, 0)
const EMPTY: PixelBuffer = { w: 0, h: 0, data: new Uint8ClampedArray(0) }

/** Builds a size x size flat buffer filled by a callback. */
const build = (size: number, fill: (x: number, y: number) => RgbaColor): PixelBuffer => {
  const buf = createEmptyBuffer(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      putPixel(buf, x, y, fill(x, y))
    }
  }
  return buf
}

const single = (color: RgbaColor): PixelBuffer => {
  const buf = createEmptyBuffer(1, 1)
  putPixel(buf, 0, 0, color)
  return buf
}

const row = (colors: RgbaColor[]): PixelBuffer => {
  const buf = createEmptyBuffer(colors.length, 1)
  colors.forEach((c, x) => putPixel(buf, x, 0, c))
  return buf
}

const flatRow = (buf: PixelBuffer, y = 0): RgbaColor[] =>
  Array.from({ length: buf.w }, (_, x) => getPixel(buf, x, y))

describe('downscalePixels', () => {
  it('picks the dominant color of each cell, ignoring minority outline samples', () => {
    // 8x8 source, 2x2 target: each 4x4 cell is red except one black pixel.
    const src = build(8, (x, y) => (x % 4 === 0 && y % 4 === 0 ? BLACK : RED))
    const out = downscalePixels(src, 2)
    expect(out.h).toBe(2)
    expect(out.w).toBe(2)
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) {
        const p = getPixel(out, x, y)
        expect(p.r).toBeGreaterThan(150)
        expect(p.g).toBeLessThan(60)
      }
    }
  })

  it('keeps a cell dominated by outline as outline', () => {
    // Left cell all black, right cell all red.
    const src = build(8, (x) => (x < 4 ? BLACK : RED))
    const out = downscalePixels(src, 2)
    expect(getPixel(out, 0, 0).r).toBeLessThan(60)
    expect(getPixel(out, 1, 0).r).toBeGreaterThan(150)
  })

  it('resolves alpha by majority: mostly transparent cells stay fully transparent', () => {
    // Top half transparent, bottom half red.
    const src = build(8, (_, y) => (y < 4 ? CLEAR : RED))
    const out = downscalePixels(src, 2)
    expect(getPixel(out, 0, 0).a).toBe(0)
    expect(getPixel(out, 1, 0).a).toBe(0)
    expect(getPixel(out, 0, 1).a).toBe(255)
    expect(getPixel(out, 1, 1).a).toBe(255)
  })

  it('handles source sizes that do not divide evenly by the target size', () => {
    const src = build(7, () => RED)
    const out = downscalePixels(src, 2)
    expect(out.h).toBe(2)
    expect(out.w).toBe(2)
    expect(getPixel(out, 1, 1).r).toBeGreaterThan(150)
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
    const p = getPixel(out, 0, 0)
    expect(p.r).toBeGreaterThan(150)
    expect(p.g).toBeLessThan(60)
    expect(p.a).toBe(255)
  })

  it('drops a fringe-only cell while keeping the core cell (image has core elsewhere)', () => {
    // 8x8 -> 2x2. Left half is a solid red core, right half is pure muddy fringe.
    // The core exists (left) so defringe stays on: left cells render red, right
    // cells are halo with no core of their own and must key out.
    const src = build(8, (x) => (x < 4 ? RED : MUDDY))
    const out = downscalePixels(src, 2)
    expect(getPixel(out, 0, 0).a).toBe(255)
    expect(getPixel(out, 0, 0).r).toBeGreaterThan(150)
    expect(getPixel(out, 1, 0).a).toBe(0)
    expect(getPixel(out, 1, 1).a).toBe(0)
  })

  it('does NOT vanish an image that is uniformly semi-transparent (no core anywhere)', () => {
    // Guard against catastrophic keying: if NOTHING in the source clears the
    // core threshold, defringe backs off and every opaque pixel is trusted.
    const semi = px(200, 10, 10, 150)
    const src = build(8, () => semi)
    const out = downscalePixels(src, 2)
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) {
        const p = getPixel(out, x, y)
        expect(p.a).toBe(255)
        expect(p.r).toBeGreaterThan(150)
      }
    }
  })
})

describe('resizeNearest', () => {
  it('preserves exact source colours instead of averaging them', () => {
    const src = row([RED, BLACK])
    const out = resizeNearest(src, 4, 1)

    expect(flatRow(out).map((pixel) => pixel.r)).toEqual([RED.r, RED.r, BLACK.r, BLACK.r])
  })

  it('returns an empty buffer for empty sources or invalid target dimensions', () => {
    expect(resizeNearest(EMPTY, 4, 4)).toEqual(EMPTY)
    expect(resizeNearest(single(RED), 0, 4)).toEqual(EMPTY)
  })
})

describe('downscaleTo input validation', () => {
  it('returns an empty buffer for empty sources or invalid target dimensions', () => {
    expect(downscaleTo(EMPTY, 4, 4)).toEqual(EMPTY)
    expect(downscaleTo(single(RED), 4, 0)).toEqual(EMPTY)
  })
})

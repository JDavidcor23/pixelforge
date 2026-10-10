import { describe, it, expect } from 'vitest'
import type { RgbaColor } from '@/types'
import {
  createEmptyBuffer,
  cloneBuffer,
  getPixel,
  putPixel,
  setPixelInBuffer,
  setPixelsInBuffer,
  colorsEqual,
  isInBounds,
  diffRect,
  extractRect,
  writeRect,
} from './pixel-buffer'

// Characterization tests — phase 1 flat-buffer version. Same OBSERVABLE pixel
// behavior as the frozen `RgbaColor[][]` tests (same pixels in, same pixels
// out); only the storage shape changed, from nested arrays to
// `{ w, h, data: Uint8ClampedArray }`.

const RED: RgbaColor = { r: 255, g: 0, b: 0, a: 255 }
const GREEN: RgbaColor = { r: 0, g: 255, b: 0, a: 255 }
const TRANSPARENT: RgbaColor = { r: 0, g: 0, b: 0, a: 0 }

describe('createEmptyBuffer', () => {
  it('creates a w x h grid of fully transparent pixels', () => {
    const buf = createEmptyBuffer(3, 2)
    expect(buf.w).toBe(3)
    expect(buf.h).toBe(2)
    expect(buf.data).toHaveLength(3 * 2 * 4)
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 3; x++) {
        expect(getPixel(buf, x, y)).toEqual(TRANSPARENT)
      }
    }
  })

  it('gives every buffer its own backing array (no shared references)', () => {
    const a = createEmptyBuffer(2, 2)
    const b = createEmptyBuffer(2, 2)
    putPixel(a, 0, 0, RED)
    expect(getPixel(b, 0, 0)).toEqual(TRANSPARENT)
  })
})

describe('cloneBuffer', () => {
  it('produces a deep copy — mutating the clone does not affect the original', () => {
    const original = createEmptyBuffer(2, 1)
    putPixel(original, 0, 0, RED)
    putPixel(original, 1, 0, GREEN)

    const clone = cloneBuffer(original)
    putPixel(clone, 0, 0, GREEN)

    expect(getPixel(original, 0, 0)).toEqual(RED)
    expect(getPixel(clone, 0, 0)).toEqual(GREEN)
  })

  it('preserves identical values across every pixel', () => {
    const original = createEmptyBuffer(2, 2)
    putPixel(original, 0, 0, RED)
    putPixel(original, 1, 0, GREEN)
    putPixel(original, 1, 1, RED)

    const clone = cloneBuffer(original)
    expect(clone.data).toEqual(original.data)
    expect(clone.data).not.toBe(original.data) // different backing array
  })
})

describe('getPixel / putPixel', () => {
  it('reads and writes the pixel at (x, y) using row-major flat indexing', () => {
    const buf = createEmptyBuffer(2, 2)
    putPixel(buf, 1, 0, GREEN)
    putPixel(buf, 0, 1, TRANSPARENT)

    expect(getPixel(buf, 1, 0)).toEqual(GREEN)
    expect(getPixel(buf, 0, 1)).toEqual(TRANSPARENT)
  })
})

describe('setPixelInBuffer', () => {
  it('returns a NEW buffer and does not mutate the original (copy-on-write)', () => {
    const original = createEmptyBuffer(2, 1)
    const result = setPixelInBuffer(original, 0, 0, RED)

    expect(result).not.toBe(original)
    expect(result.data).not.toBe(original.data)
    expect(getPixel(original, 0, 0)).toEqual(TRANSPARENT) // original untouched
    expect(getPixel(result, 0, 0)).toEqual(RED)
  })

  it('leaves untouched pixels equal by value', () => {
    const original = createEmptyBuffer(2, 1)
    putPixel(original, 0, 0, RED)
    putPixel(original, 1, 0, GREEN)

    const result = setPixelInBuffer(original, 0, 0, TRANSPARENT)

    expect(getPixel(result, 1, 0)).toEqual(GREEN) // value preserved
  })
})

describe('setPixelsInBuffer', () => {
  it('clones the buffer ONCE and writes every point (design D2: one copy per batch)', () => {
    const original = createEmptyBuffer(3, 1)
    const result = setPixelsInBuffer(original, [
      { x: 0, y: 0, color: RED },
      { x: 2, y: 0, color: GREEN },
    ])

    expect(result).not.toBe(original)
    expect(getPixel(original, 0, 0)).toEqual(TRANSPARENT) // original untouched
    expect(getPixel(result, 0, 0)).toEqual(RED)
    expect(getPixel(result, 1, 0)).toEqual(TRANSPARENT)
    expect(getPixel(result, 2, 0)).toEqual(GREEN)
  })
})

describe('colorsEqual', () => {
  it('compares all four RGBA channels', () => {
    expect(colorsEqual(RED, { ...RED })).toBe(true)
    expect(colorsEqual(RED, { ...RED, a: 254 })).toBe(false)
  })
})

describe('pixel-core: "Pixel write is readable back"', () => {
  it('reading (x, y) after writing it returns the identical RGBA color', () => {
    const buf = createEmptyBuffer(4, 4)
    const written = setPixelInBuffer(buf, 2, 3, RED)
    expect(getPixel(written, 2, 3)).toEqual(RED)
  })
})

describe('diffRect', () => {
  it('returns null when two buffers are identical', () => {
    const a = createEmptyBuffer(4, 4)
    const b = cloneBuffer(a)
    expect(diffRect(a, b)).toBeNull()
  })

  it('returns the tight bounding box of a single changed pixel', () => {
    const before = createEmptyBuffer(8, 8)
    const after = setPixelInBuffer(before, 3, 5, RED)
    expect(diffRect(before, after)).toEqual({ x: 3, y: 5, w: 1, h: 1 })
  })

  it('returns the bounding box spanning multiple changed pixels', () => {
    const before = createEmptyBuffer(8, 8)
    const after = setPixelsInBuffer(before, [
      { x: 1, y: 1, color: RED },
      { x: 4, y: 6, color: GREEN },
    ])
    expect(diffRect(before, after)).toEqual({ x: 1, y: 1, w: 4, h: 6 })
  })
})

describe('extractRect / writeRect', () => {
  it('round-trips a sub-rect of a buffer (copy-on-write)', () => {
    const original = createEmptyBuffer(5, 5)
    putPixel(original, 2, 2, RED)
    putPixel(original, 3, 2, GREEN)

    const rect = { x: 2, y: 2, w: 2, h: 1 }
    const patch = extractRect(original, rect)
    expect(patch).toHaveLength(2 * 1 * 4)

    const blank = createEmptyBuffer(5, 5)
    const restored = writeRect(blank, rect, patch)

    expect(restored).not.toBe(blank) // copy-on-write, original untouched
    expect(getPixel(blank, 2, 2)).toEqual(TRANSPARENT)
    expect(getPixel(restored, 2, 2)).toEqual(RED)
    expect(getPixel(restored, 3, 2)).toEqual(GREEN)
    expect(getPixel(restored, 0, 0)).toEqual(TRANSPARENT) // outside the rect, untouched
  })

  // Phase 4f (W2/W3): the same "negative rx wraps into the previous row" bug
  // class found in packages/core's Rust/TS kernels applies here — a plain
  // `rect.x + rect.w > w` check passes for a negative `rect.x`.
  it('extractRect rejects a negative rect.x instead of wrapping into the previous row', () => {
    const buffer = createEmptyBuffer(4, 4)
    putPixel(buffer, 0, 0, RED) // would be misread as "row above" if rx=-1 wrapped
    const patch = extractRect(buffer, { x: -1, y: 1, w: 2, h: 1 })
    expect(patch).toHaveLength(0)
  })

  it('writeRect rejects a negative rect.x and leaves the buffer unchanged', () => {
    const buffer = createEmptyBuffer(4, 4)
    const result = writeRect(buffer, { x: -1, y: 1, w: 2, h: 1 }, new Uint8Array(8).fill(9))
    expect(result.data).toEqual(buffer.data)
  })

  it('extractRect/writeRect reject a rect that does not fit the buffer', () => {
    const buffer = createEmptyBuffer(4, 4)
    expect(extractRect(buffer, { x: 3, y: 3, w: 2, h: 2 })).toHaveLength(0)
    expect(writeRect(buffer, { x: 3, y: 3, w: 2, h: 2 }, new Uint8Array(16))).toBe(buffer)
  })

  it('writeRect rejects a patch whose length does not match rect.w*rect.h*4', () => {
    const buffer = createEmptyBuffer(4, 4)
    const result = writeRect(buffer, { x: 0, y: 0, w: 2, h: 1 }, new Uint8Array(3))
    expect(result).toBe(buffer)
  })
})

describe('isInBounds', () => {
  it('treats buffer.w / buffer.h as the grid dimensions', () => {
    const buf = createEmptyBuffer(3, 2)
    expect(isInBounds(buf, 0, 0)).toBe(true)
    expect(isInBounds(buf, 2, 1)).toBe(true)
    expect(isInBounds(buf, 3, 0)).toBe(false) // x === width is out
    expect(isInBounds(buf, 0, 2)).toBe(false) // y === height is out
    expect(isInBounds(buf, -1, 0)).toBe(false)
  })
})

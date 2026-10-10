import { describe, it, expect } from 'vitest'
import type { PixelBuffer, RgbaColor } from '@/types'
import { floodFill } from './flood-fill'
import { createEmptyBuffer, getPixel, putPixel } from './pixel-buffer'

// Characterization tests — phase 1 flat-buffer version. Same observable
// flood-fill behavior as the frozen `RgbaColor[][]` tests; this is the
// parity reference the phase 5 Rust port will be checked against.

const RED: RgbaColor = { r: 255, g: 0, b: 0, a: 255 }
const GREEN: RgbaColor = { r: 0, g: 255, b: 0, a: 255 }
const TRANSPARENT: RgbaColor = { r: 0, g: 0, b: 0, a: 0 }

function buffer3x3(): PixelBuffer {
  const buf = createEmptyBuffer(3, 3)
  putPixel(buf, 2, 2, RED)
  return buf
}

describe('floodFill', () => {
  it('fills the full 4-connected region matching the start color', () => {
    const buf = buffer3x3()
    const result = floodFill(buf, 0, 0, GREEN)

    // Everything except the isolated RED pixel turns GREEN.
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        if (x === 2 && y === 2) continue
        expect(getPixel(result, x, y)).toEqual(GREEN)
      }
    }
    expect(getPixel(result, 2, 2)).toEqual(RED)
  })

  it('does not cross a differently-colored pixel (4-directional, no diagonals)', () => {
    const buf = buffer3x3()
    const result = floodFill(buf, 0, 0, GREEN)
    // (2,2) is diagonal-adjacent to (1,1); current algorithm does not fill diagonally.
    expect(getPixel(result, 2, 2)).toEqual(RED)
  })

  it('returns the SAME buffer reference when fill color equals target color (no-op)', () => {
    const buf = buffer3x3()
    const result = floodFill(buf, 0, 0, TRANSPARENT)
    expect(result).toBe(buf)
  })

  it('returns a NEW buffer and does not mutate the original when it does fill', () => {
    const buf = buffer3x3()
    const result = floodFill(buf, 0, 0, GREEN)

    expect(result).not.toBe(buf)
    expect(result.data).not.toBe(buf.data)
    expect(getPixel(buf, 0, 0)).toEqual(TRANSPARENT) // original untouched
  })

  it('fills a single isolated pixel when it has no same-color neighbors', () => {
    const buf = buffer3x3()
    const result = floodFill(buf, 2, 2, GREEN)
    expect(getPixel(result, 2, 2)).toEqual(GREEN)
    // nothing else changes
    expect(getPixel(result, 0, 0)).toEqual(TRANSPARENT)
  })
})

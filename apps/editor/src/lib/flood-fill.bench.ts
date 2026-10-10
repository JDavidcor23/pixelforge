import { bench, describe } from 'vitest'
import type { PixelBuffer } from '@/types'
import { floodFill } from './flood-fill'
import { createEmptyBuffer } from './pixel-buffer'

// Phase 1 bench — measures the flat-buffer flood-fill (index-stack over
// Uint8ClampedArray) before the phase 5 Rust port. Comparison reference for
// pixel-core "Flood-Fill Performance" (<5ms on Rust, Rust <= 1/3 of this
// baseline). See baseline-bench.md for the phase 0 `RgbaColor[][]` number
// (50.36ms mean on this same machine).
// Run with: pnpm run bench

const SIZE = 256

function makeUniformBuffer(): PixelBuffer {
  return createEmptyBuffer(SIZE, SIZE)
}

describe('flood-fill — full 256x256 canvas, single uniform region', () => {
  bench('floodFill — phase 1 (TS, flat Uint8ClampedArray)', () => {
    const buf = makeUniformBuffer()
    floodFill(buf, 0, 0, { r: 255, g: 0, b: 0, a: 255 })
  })
})

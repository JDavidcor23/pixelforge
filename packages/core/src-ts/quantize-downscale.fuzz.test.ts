/**
 * Phase 6 fuzz suite: `quantize` and `downscale` are, like phase 5's
 * flood-fill, complex enough (a k-means-style iterative algorithm and a
 * majority-vote spatial reducer, not a flat memcpy-shaped op) that a handful
 * of hand-written cases in `pixel-parity.test.ts` is not enough confidence —
 * this generates many random buffers/options and asserts ts and wasm agree
 * byte-for-byte, every time. Deterministic (a tiny LCG, never
 * `Math.random()`) so a failure is reproducible from the printed seed.
 * Mirrors `flood-fill.fuzz.test.ts`'s style and structure.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { tsKernels } from './ts-core'
import { makeWasmKernels } from './wasm-core'
import type { PixelKernels } from './types'

const here = dirname(fileURLToPath(import.meta.url))
const wasmPath = join(here, '..', 'pkg', 'pixelforge_core_bg.wasm')
const pkgAvailable = existsSync(wasmPath)

let wasmKernels: PixelKernels | null = null
if (pkgAvailable) {
  const mod = await import('../pkg/pixelforge_core.js')
  mod.initSync({ module: readFileSync(wasmPath) })
  wasmKernels = makeWasmKernels(mod)
} else {
  console.warn(`[quantize-downscale.fuzz] ${wasmPath} not found — run "pnpm run build:wasm" first. Skipping the fuzz suite.`)
}

/** A tiny deterministic LCG (no `Math.random()`) — same seed always produces the same sequence, so a failure is reproducible. */
function makeRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function randInt(rng: () => number, maxExclusive: number): number {
  return Math.floor(rng() * maxExclusive)
}

/** A random RGBA buffer — biased toward a small palette (a handful of repeated colors) so quantize's clustering has real structure to chew on, not uniform noise. */
function randomBuffer(rng: () => number, w: number, h: number): Uint8Array {
  const paletteSize = 1 + randInt(rng, 6)
  const palette = Array.from({ length: paletteSize }, () => [randInt(rng, 256), randInt(rng, 256), randInt(rng, 256), randInt(rng, 256)])
  const data = new Uint8Array(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    const c = palette[randInt(rng, paletteSize)]
    data.set(c, i * 4)
  }
  return data
}

const QUANTIZE_SEEDS = Array.from({ length: 2000 }, (_, i) => i + 1)
const DOWNSCALE_SEEDS = Array.from({ length: 2000 }, (_, i) => i + 1)

describe.skipIf(!wasmKernels)('quantize fuzz (ts vs wasm, deterministic LCG, 2000 cases)', () => {
  const wasm = wasmKernels as PixelKernels

  it.each(QUANTIZE_SEEDS)('seed %i: ts and wasm agree on a random buffer + options', (seed) => {
    const rng = makeRng(seed)
    const w = 1 + randInt(rng, 9) // 1..9
    const h = 1 + randInt(rng, 9)
    const data = randomBuffer(rng, w, h)
    const colors = randInt(rng, 9) // 0..8, including the colors=0 edge case
    const weightBySaturation = rng() < 0.5
    const iterations = randInt(rng, 6) // 0..5
    const alphaThreshold = randInt(rng, 256)

    const tsOut = tsKernels.quantize(data, colors, weightBySaturation, iterations, alphaThreshold)
    const wasmOut = wasm.quantize(data, colors, weightBySaturation, iterations, alphaThreshold)

    expect(tsOut).toBeDefined()
    expect(wasmOut).toBeDefined()
    expect(wasm.bytesEqual(tsOut as Uint8Array, wasmOut as Uint8Array)).toBe(true)
  })

  it.each([1, 2, 256])('palette size %i (edge case: 1, 2, max) matches ts/wasm on a 16x16 varied buffer', (colors) => {
    const rng = makeRng(colors * 97 + 1)
    const data = randomBuffer(rng, 16, 16)
    const tsOut = tsKernels.quantize(data, colors, true, 8, 32)
    const wasmOut = wasm.quantize(data, colors, true, 8, 32)
    expect(tsOut).toBeDefined()
    expect(wasmOut).toBeDefined()
    expect(wasm.bytesEqual(tsOut as Uint8Array, wasmOut as Uint8Array)).toBe(true)
  })

  it('fully transparent buffer (every alpha 0) matches ts/wasm', () => {
    const data = new Uint8Array(8 * 8 * 4) // all-zero: alpha 0 everywhere
    const tsOut = tsKernels.quantize(data, 4, true, 4, 1)
    const wasmOut = wasm.quantize(data, 4, true, 4, 1)
    expect(tsOut).toBeDefined()
    expect(wasmOut).toBeDefined()
    expect(wasm.bytesEqual(tsOut as Uint8Array, wasmOut as Uint8Array)).toBe(true)
    expect(tsOut!.every((v) => v === 0)).toBe(true) // every pixel excluded from recolor — untouched
  })
})

describe.skipIf(!wasmKernels)('downscale fuzz (ts vs wasm, deterministic LCG, 2000 cases)', () => {
  const wasm = wasmKernels as PixelKernels

  it.each(DOWNSCALE_SEEDS)('seed %i: ts and wasm agree on a random source/target size', (seed) => {
    const rng = makeRng(seed * 13 + 5)
    const srcW = 1 + randInt(rng, 20) // 1..20, includes non-divisible combos
    const srcH = 1 + randInt(rng, 20)
    const targetW = 1 + randInt(rng, 8)
    const targetH = 1 + randInt(rng, 8)
    const data = randomBuffer(rng, srcW, srcH)

    const tsOut = tsKernels.downscale(data, srcW, srcH, targetW, targetH)
    const wasmOut = wasm.downscale(data, srcW, srcH, targetW, targetH)

    expect(tsOut).toBeDefined()
    expect(wasmOut).toBeDefined()
    expect(wasm.bytesEqual(tsOut as Uint8Array, wasmOut as Uint8Array)).toBe(true)
  })

  it('1x1 source and target matches ts/wasm', () => {
    const data = new Uint8Array([11, 22, 33, 255])
    const tsOut = tsKernels.downscale(data, 1, 1, 1, 1)
    const wasmOut = wasm.downscale(data, 1, 1, 1, 1)
    expect(tsOut).toEqual(new Uint8Array([11, 22, 33, 255]))
    expect(wasmOut).toEqual(new Uint8Array([11, 22, 33, 255]))
  })

  it('fully transparent source matches ts/wasm (every target cell keyed out)', () => {
    const data = new Uint8Array(8 * 8 * 4) // all-zero: alpha 0 everywhere
    const tsOut = tsKernels.downscale(data, 8, 8, 3, 3)
    const wasmOut = wasm.downscale(data, 8, 8, 3, 3)
    expect(tsOut).toBeDefined()
    expect(wasmOut).toBeDefined()
    expect(wasm.bytesEqual(tsOut as Uint8Array, wasmOut as Uint8Array)).toBe(true)
    expect(tsOut!.every((v) => v === 0)).toBe(true)
  })

  it('alpha threshold boundary (127 vs 128, fallback core branch) matches ts/wasm', () => {
    const below = new Uint8Array([9, 9, 9, 127, 9, 9, 9, 127, 9, 9, 9, 127, 9, 9, 9, 127])
    const above = new Uint8Array([9, 9, 9, 128, 9, 9, 9, 128, 9, 9, 9, 128, 9, 9, 9, 128])
    for (const data of [below, above]) {
      const tsOut = tsKernels.downscale(data, 2, 2, 1, 1)
      const wasmOut = wasm.downscale(data, 2, 2, 1, 1)
      expect(tsOut).toBeDefined()
      expect(wasmOut).toBeDefined()
      expect(wasm.bytesEqual(tsOut as Uint8Array, wasmOut as Uint8Array)).toBe(true)
    }
  })
})

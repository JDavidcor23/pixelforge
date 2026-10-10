/**
 * Phase 5 fuzz suite: `floodFill` is the first PixelKernels op complex enough
 * (a graph walk, not a flat memcpy-shaped op) that "ts and wasm happen to
 * agree on the few cases pixel-parity.test.ts spells out by hand" is not
 * enough confidence — this generates many random maze-shaped canvases and
 * seeds and asserts the two implementations agree byte-for-byte AND on the
 * returned dirty rect, every time. Deterministic (a tiny LCG, never
 * `Math.random()`) so a failure is reproducible from the printed seed.
 *
 * Mirrors `apps/editor/src/lib/core/ts-core.fuzz.test.ts`'s style (fixed
 * seeds, no flakiness) at the `packages/core` kernel level instead of the
 * full `PixelCore`/`dispatch` level — this package has no document, only
 * flat buffers.
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
  console.warn(`[flood-fill.fuzz] ${wasmPath} not found — run "pnpm run build:wasm" first. Skipping the fuzz suite.`)
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

/** Builds a random "maze": a buffer where each pixel is either `0` (the common background, open) or a wall color — so a flood fill from a random open cell has a non-trivial, irregular reachable region. */
function randomMaze(rng: () => number, w: number, h: number): Uint8Array {
  const data = new Uint8Array(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    if (rng() < 0.3) {
      const p = i * 4
      data[p] = 1
      data[p + 1] = 2
      data[p + 2] = 3
      data[p + 3] = 255 // a fixed "wall" color, distinct from the background (all-zero) and any fill color below
    }
  }
  return data
}

const SEEDS = Array.from({ length: 100 }, (_, i) => i + 1)

describe.skipIf(!wasmKernels)('floodFill fuzz (ts vs wasm, deterministic LCG)', () => {
  const wasm = wasmKernels as PixelKernels

  it.each(SEEDS)('seed %i: ts and wasm agree on a random maze canvas (buffer + dirty rect)', (seed) => {
    const rng = makeRng(seed)
    const w = 4 + randInt(rng, 29) // 4..32
    const h = 4 + randInt(rng, 29)
    const maze = randomMaze(rng, w, h)
    const tsData = new Uint8Array(maze)
    const wasmData = new Uint8Array(maze)

    const x = randInt(rng, w)
    const y = randInt(rng, h)
    // never fill with the wall color itself, so a same-color no-op isn't the only thing being tested every run
    const rgba = (((1 + randInt(rng, 254)) << 24) | (randInt(rng, 256) << 16) | (randInt(rng, 256) << 8) | 255) >>> 0

    const tsRect = tsKernels.floodFill(tsData, w, h, x, y, rgba)
    const wasmRect = wasm.floodFill(wasmData, w, h, x, y, rgba)

    expect(wasmRect).toEqual(tsRect)
    expect(wasm.bytesEqual(tsData, wasmData)).toBe(true)
  })

  it.each(SEEDS.slice(0, 20))('seed %i: ts and wasm agree on an out-of-bounds or same-color seed (both reject identically)', (seed) => {
    const rng = makeRng(seed)
    const w = 4 + randInt(rng, 13)
    const h = 4 + randInt(rng, 13)
    const maze = randomMaze(rng, w, h)
    const tsData = new Uint8Array(maze)
    const wasmData = new Uint8Array(maze)

    // every other seed is deliberately out of bounds; the rest force the
    // target pixel back to the background color FIRST, so the "same-color"
    // branch is a guaranteed no-op rather than a coin flip on whatever the
    // random maze happened to put there (a wall cell would NOT be a no-op
    // against the all-zero fill color below, which was the bug this comment
    // replaces).
    const outOfBounds = seed % 2 === 0
    const x = outOfBounds ? w + randInt(rng, 5) : randInt(rng, w)
    const y = outOfBounds ? h + randInt(rng, 5) : randInt(rng, h)
    if (!outOfBounds) {
      const i = (y * w + x) * 4
      tsData.set([0, 0, 0, 0], i)
      wasmData.set([0, 0, 0, 0], i)
    }
    const rgba = 0x00000000 // same as the background — a same-color no-op for every open cell

    const tsRect = tsKernels.floodFill(tsData, w, h, x, y, rgba)
    const wasmRect = wasm.floodFill(wasmData, w, h, x, y, rgba)

    expect(wasmRect).toBeUndefined()
    expect(tsRect).toBeUndefined()
    expect(wasm.bytesEqual(tsData, wasmData)).toBe(true)
  })

  it.each([0, 1, 2, 3, 5, 7])('adversarial short buffer (length %i, w=4 h=4 declared) never crashes either impl', (len) => {
    const tsData = new Uint8Array(len)
    const wasmData = new Uint8Array(len)
    expect(tsKernels.floodFill(tsData, 4, 4, 1, 1, 0xff0000ff)).toBeUndefined()
    expect(wasm.floodFill(wasmData, 4, 4, 1, 1, 0xff0000ff)).toBeUndefined()
  })
})

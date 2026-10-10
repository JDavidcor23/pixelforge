/**
 * The TS<->Wasm parity gate for this package's phase-4 kernels (design.md
 * "Testing Strategy": `describe.each(['ts','wasm'])`, "using the Node wasm
 * loader (`initSync` with `readFileSync`)"). Every assertion in this file
 * must pass IDENTICALLY for both implementations — it talks only to the
 * `PixelKernels` interface, never TS- or Rust-specific internals.
 *
 * T1 (phase 4f): `getPixel`/`putPixel` are gone from this interface —
 * `putPoints` (batched) is the one pixel-writing entry point, and reading a
 * single pixel back for an assertion goes through `extractRect` (a 1x1 rect)
 * instead, exactly as any real caller now must.
 *
 * Requires `pnpm run build:wasm` to have produced `../pkg/` first (CI runs
 * this before `test`; see `.github/workflows/ci.yml`). If `pkg/` is missing,
 * the Wasm row is skipped with a loud console warning rather than failing
 * the whole suite — so `pnpm test` still works for anyone who hasn't run
 * the Rust toolchain yet.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { tsKernels, MAX_DOWNSCALE_DIMENSION, MAX_QUANTIZE_COLORS } from './ts-core'
import { makeWasmKernels } from './wasm-core'
import type { PixelKernels } from './types'

const here = dirname(fileURLToPath(import.meta.url))
const wasmPath = join(here, '..', 'pkg', 'pixelforge_core_bg.wasm')
const pkgAvailable = existsSync(wasmPath)

interface ParityCase {
  readonly name: 'ts' | 'wasm'
  readonly kernels: PixelKernels
}

const cases: ParityCase[] = [{ name: 'ts', kernels: tsKernels }]

// `describe`/`it.each` are collected SYNCHRONOUSLY, before any `beforeAll`
// hook runs — so the wasm row must be loaded via top-level `await` (native
// ESM, which Vitest supports) rather than inside a hook, or `it.each` below
// would only ever see the `ts` row.
if (pkgAvailable) {
  // Node wasm loader (design.md): `initSync` + `readFileSync`, no fetch.
  const mod = await import('../pkg/pixelforge_core.js')
  const bytes = readFileSync(wasmPath)
  mod.initSync({ module: bytes })
  cases.push({ name: 'wasm', kernels: makeWasmKernels(mod) })
} else {
  console.warn(`[pixel-parity.test] ${wasmPath} not found — run "pnpm run build:wasm" first. Skipping the wasm row.`)
}

function buf(n: number): Uint8Array {
  return new Uint8Array(n)
}

/** Packs an (r,g,b,a) tuple into the SAME `u32` layout `packRgba` uses (R highest byte, A lowest) — test-only, mirrors `color-codec.ts`. */
function rgba(r: number, g: number, b: number, a: number): number {
  return (((r << 24) | (g << 16) | (b << 8) | a) >>> 0) as number
}

/** Reads a single pixel back via `extractRect` (a 1x1 rect) and packs it the same way `rgba` above does — the one way to read a pixel now that `getPixel` is gone from the facade. */
function readPixel(k: PixelKernels, data: Uint8Array, w: number, h: number, x: number, y: number): number | undefined {
  const patch = k.extractRect(data, w, h, x, y, 1, 1)
  if (!patch) return undefined
  return rgba(patch[0], patch[1], patch[2], patch[3])
}

describe('pixel kernels parity (ts vs wasm)', () => {
  it('registers both implementations once pkg/ is built', () => {
    if (!pkgAvailable) {
      console.warn('[pixel-parity.test] wasm pkg/ not built — only the ts row ran.')
      return
    }
    expect(cases.map((c) => c.name)).toEqual(['ts', 'wasm'])
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: putPoints writes a batch, extractRect reads it back', (_name, k) => {
    const w = 4
    const h = 4
    const data = buf(w * h * 4)
    const red = 0xff0000ff // r=255 g=0 b=0 a=255, R highest byte / A lowest
    expect(k.putPoints(data, w, h, new Int32Array([1, 2]), red)).toBe(1)
    expect(readPixel(k, data, w, h, 1, 2)).toBe(red)
    expect(readPixel(k, data, w, h, 0, 0)).toBe(0) // untouched pixel is transparent black
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: putPoints writes several points in one call', (_name, k) => {
    const w = 4
    const h = 4
    const data = buf(w * h * 4)
    const green = 0x00ff00ff
    expect(k.putPoints(data, w, h, new Int32Array([0, 0, 1, 1, 2, 2]), green)).toBe(3)
    expect(readPixel(k, data, w, h, 0, 0)).toBe(green)
    expect(readPixel(k, data, w, h, 1, 1)).toBe(green)
    expect(readPixel(k, data, w, h, 2, 2)).toBe(green)
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: putPoints skips out-of-range points without wrapping or losing the rest of the batch', (_name, k) => {
    const w = 4
    const h = 4
    const data = buf(w * h * 4)
    // (-1,0) and (10,10) are out of range; (1,1) is valid.
    expect(k.putPoints(data, w, h, new Int32Array([-1, 0, 1, 1, 10, 10]), 0xffffffff)).toBe(1)
    expect(readPixel(k, data, w, h, 1, 1)).toBe(0xffffffff)
    expect(k.bytesEqual(data, (() => {
      const expected = buf(w * h * 4)
      k.putPoints(expected, w, h, new Int32Array([1, 1]), 0xffffffff)
      return expected
    })())).toBe(true)
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: putPoints rejects an odd-length batch as a whole', (_name, k) => {
    const w = 4
    const h = 4
    const data = buf(w * h * 4)
    expect(k.putPoints(data, w, h, new Int32Array([0, 0, 1]), 0xffffffff)).toBe(0)
    expect(k.bytesEqual(data, buf(w * h * 4))).toBe(true)
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: cloneBuffer is an independent copy', (_name, k) => {
    const data = buf(2 * 2 * 4)
    const cloned = k.cloneBuffer(data)
    k.putPoints(cloned, 2, 2, new Int32Array([0, 0]), 0xffffffff)
    expect(k.bytesEqual(data, cloned)).toBe(false)
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: diffRect finds the tight bounding box', (_name, k) => {
    const w = 4
    const h = 4
    const before = buf(w * h * 4)
    const after = buf(w * h * 4)
    k.putPoints(after, w, h, new Int32Array([1, 1, 2, 3]), 0x010000ff)
    expect(k.diffRect(before, after, w, h)).toEqual([1, 1, 2, 3])
    expect(k.diffRect(before, before, w, h)).toBeUndefined()
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: extractRect then writeRect round-trips byte-identically', (_name, k) => {
    const w = 4
    const h = 4
    const data = buf(w * h * 4)
    k.putPoints(data, w, h, new Int32Array([1, 1]), 0x090807ff)
    const patch = k.extractRect(data, w, h, 1, 1, 2, 2)
    expect(patch).toBeDefined()

    const target = buf(w * h * 4)
    expect(k.writeRect(target, w, h, 1, 1, 2, 2, patch as Uint8Array)).toBe(true)
    expect(readPixel(k, target, w, h, 1, 1)).toBe(0x090807ff)
  })

  // ── Phase 4f boundary-hardening parity (judgment-day W2/W3) ───────────────
  // Both implementations must reject the SAME adversarial inputs the SAME
  // way — a JS negative number for a `u32` Rust param coerces to a huge
  // value at the wasm-bindgen boundary, so "negative rx" and "huge rx" are
  // the SAME bug class from Rust's point of view; both are covered here.

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: extractRect/writeRect reject a short buffer instead of reading/writing out of bounds', (_name, k) => {
    const short = buf(4) // declares 4x4 (64 bytes) but is only 4 bytes
    expect(k.extractRect(short, 4, 4, 0, 0, 1, 1)).toBeUndefined()
    expect(k.writeRect(buf(4), 4, 4, 0, 0, 1, 1, buf(4))).toBe(false)
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: extractRect/writeRect reject a negative rx without wrapping into the previous row', (_name, k) => {
    const w = 4
    const h = 4
    const data = buf(w * h * 4)
    for (let i = 0; i < data.length; i++) data[i] = i
    // rx = -1: a plain `rx + rw > w` check would PASS (the sum is smaller,
    // not larger) and the index would wrap into the previous row.
    expect(k.extractRect(data, w, h, -1, 1, 2, 1)).toBeUndefined()
    const target = buf(w * h * 4)
    expect(k.writeRect(target, w, h, -1, 1, 2, 1, buf(8).fill(9))).toBe(false)
    expect(k.bytesEqual(target, buf(w * h * 4))).toBe(true) // never wrote anywhere
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: writeRect rejects an rw huge enough to overflow the bounds check', (_name, k) => {
    const w = 4
    const h = 4
    const target = buf(w * h * 4)
    expect(k.writeRect(target, w, h, 0x40000000, 0, 0xc0000001, 1, buf(4).fill(7))).toBe(false)
    expect(k.bytesEqual(target, buf(w * h * 4))).toBe(true)
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: diffRect rejects mismatched buffer lengths instead of reading out of bounds', (_name, k) => {
    expect(k.diffRect(buf(64), buf(4), 4, 4)).toBeUndefined()
  })

  // ── Phase 5: flood-fill parity ────────────────────────────────────────────

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: floodFill fills a uniform canvas from any seed (full fill)', (_name, k) => {
    const w = 8
    const h = 8
    const data = buf(w * h * 4)
    const red = 0xff0000ff
    expect(k.floodFill(data, w, h, 3, 4, red)).toEqual([0, 0, w, h])
    for (let i = 0; i < data.length; i += 4) {
      expect([data[i], data[i + 1], data[i + 2], data[i + 3]]).toEqual([255, 0, 0, 255])
    }
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: floodFill stops at a differently-colored wall and never leaks past a hole', (_name, k) => {
    const w = 5
    const h = 5
    const data = buf(w * h * 4)
    // a 1px vertical wall at x=2 — left region (x<2) must be the only thing filled
    for (let y = 0; y < h; y++) {
      const i = (y * w + 2) * 4
      data.set([1, 2, 3, 255], i)
    }
    expect(k.floodFill(data, w, h, 0, 0, 0xff0000ff)).toEqual([0, 0, 2, h])
    for (let y = 0; y < h; y++) {
      expect(Array.from(data.subarray((y * w + 0) * 4, (y * w + 0) * 4 + 4))).toEqual([255, 0, 0, 255])
      expect(Array.from(data.subarray((y * w + 1) * 4, (y * w + 1) * 4 + 4))).toEqual([255, 0, 0, 255])
      expect(Array.from(data.subarray((y * w + 2) * 4, (y * w + 2) * 4 + 4))).toEqual([1, 2, 3, 255]) // wall untouched
      expect(Array.from(data.subarray((y * w + 3) * 4, (y * w + 3) * 4 + 4))).toEqual([0, 0, 0, 0]) // right region untouched
    }
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: floodFill is 4-connected — a diagonal neighbor of the same color is never filled', (_name, k) => {
    const w = 3
    const h = 3
    const data = buf(w * h * 4)
    // every (x+y) odd cell gets a different color — only the (0,0) seed is reachable via 4-connectivity
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if ((x + y) % 2 === 1) data.set([9, 9, 9, 255], (y * w + x) * 4)
      }
    }
    expect(k.floodFill(data, w, h, 0, 0, 0xff0000ff)).toEqual([0, 0, 1, 1])
    expect(Array.from(data.subarray(0, 4))).toEqual([255, 0, 0, 255])
    expect(Array.from(data.subarray((1 * w + 1) * 4, (1 * w + 1) * 4 + 4))).toEqual([0, 0, 0, 0]) // diagonal neighbor untouched
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: floodFill seed out of bounds is a safe no-op', (_name, k) => {
    const w = 4
    const h = 4
    const data = buf(w * h * 4)
    expect(k.floodFill(data, w, h, 4, 0, 0xff0000ff)).toBeUndefined()
    expect(k.floodFill(data, w, h, 0, 4, 0xff0000ff)).toBeUndefined()
    expect(k.bytesEqual(data, buf(w * h * 4))).toBe(true) // never wrote anywhere
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: floodFill same-color seed is a no-op', (_name, k) => {
    const w = 4
    const h = 4
    const data = buf(w * h * 4) // every pixel starts fully transparent black
    expect(k.floodFill(data, w, h, 1, 1, 0x00000000)).toBeUndefined()
    expect(k.bytesEqual(data, buf(w * h * 4))).toBe(true)
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: floodFill treats transparent and opaque as different colors', (_name, k) => {
    const w = 3
    const h = 1
    const data = buf(w * h * 4)
    data.set([255, 0, 0, 255], 0) // pixel (0,0): opaque red; (1,0)/(2,0) stay transparent
    const transparentRed = 0xff000000 // same RGB, alpha 0
    expect(k.floodFill(data, w, h, 1, 0, transparentRed)).toEqual([1, 0, 2, 1])
    expect(Array.from(data.subarray(0, 4))).toEqual([255, 0, 0, 255]) // untouched
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: floodFill rejects a buffer whose length does not match w*h*4', (_name, k) => {
    const short = buf(4) // declares 4x4 (64 bytes) but is only 4 bytes
    expect(k.floodFill(short, 4, 4, 0, 0, 0xffffffff)).toBeUndefined()
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: floodFill preserves a hole (maze shape) — only the reachable interior is filled', (_name, k) => {
    const w = 5
    const h = 5
    const data = buf(w * h * 4)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const onBorder = x === 0 || y === 0 || x === w - 1 || y === h - 1
        if (onBorder) data.set([5, 5, 5, 255], (y * w + x) * 4)
      }
    }
    expect(k.floodFill(data, w, h, 2, 2, 0x0000ffff)).toEqual([1, 1, 3, 3])
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const onBorder = x === 0 || y === 0 || x === w - 1 || y === h - 1
        const i = (y * w + x) * 4
        expect(Array.from(data.subarray(i, i + 4))).toEqual(onBorder ? [5, 5, 5, 255] : [0, 0, 255, 255])
      }
    }
  })

  it('floodFill: ts and wasm agree byte-for-byte on a maze-shaped canvas (byte-identical result AND dirty rect)', () => {
    const wasm = cases.find((c) => c.name === 'wasm')
    if (!wasm) {
      console.warn('[pixel-parity.test] wasm row unavailable — skipping the cross-implementation comparison.')
      return
    }
    const w = 16
    const h = 16
    // a deterministic "maze": every 3rd column (except column 0) is a wall
    function maze(): Uint8Array {
      const data = buf(w * h * 4)
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (x > 0 && x % 3 === 0) data.set([1, 1, 1, 255], (y * w + x) * 4)
        }
      }
      return data
    }
    const tsData = maze()
    const wasmData = maze()
    const tsRect = tsKernels.floodFill(tsData, w, h, 0, 0, 0xff0000ff)
    const wasmRect = wasm.kernels.floodFill(wasmData, w, h, 0, 0, 0xff0000ff)
    expect(wasmRect).toEqual(tsRect)
    expect(wasm.kernels.bytesEqual(tsData, wasmData)).toBe(true)
  })

  // ── Phase 6: quantize parity ───────────────────────────────────────────

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: quantize reduces the palette to at most `colors` opaque colors', (_name, k) => {
    // 2x4 buffer: two near-red, two near-green, two near-blue clusters plus one transparent and one near-white pixel.
    const px = (r: number, g: number, b: number, a = 255) => [r, g, b, a]
    const rows = [
      [px(200, 10, 10), px(198, 12, 9), px(12, 200, 14), px(10, 198, 16)],
      [px(15, 12, 205), px(13, 14, 200), px(0, 0, 0, 0), px(250, 250, 250)],
    ]
    const data = new Uint8Array(rows.flat().flat())
    const out = k.quantize(data, 4, true, 12, 128)
    expect(out).toBeDefined()
    const palette = new Set<string>()
    for (let i = 0; i < out!.length; i += 4) {
      if (out![i + 3] > 0) palette.add(`${out![i]},${out![i + 1]},${out![i + 2]}`)
    }
    expect(palette.size).toBeLessThanOrEqual(4)
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: quantize keeps fully transparent pixels transparent', (_name, k) => {
    const data = new Uint8Array([0, 0, 0, 0, 200, 10, 10, 255])
    const out = k.quantize(data, 2, true, 6, 128)
    expect(out).toBeDefined()
    expect(out![3]).toBe(0)
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: quantize rejects a buffer length not a multiple of 4', (_name, k) => {
    expect(k.quantize(new Uint8Array(3), 2, true, 1, 0)).toBeUndefined()
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: quantize colors=0 still yields one shared centroid, not zero', (_name, k) => {
    const data = new Uint8Array([10, 20, 30, 255, 200, 100, 50, 255])
    const out = k.quantize(data, 0, true, 4, 0)
    expect(out).toBeDefined()
    expect([out![0], out![1], out![2]]).toEqual([out![4], out![5], out![6]])
  })

  it('quantize: ts and wasm agree byte-for-byte on a non-trivial buffer', () => {
    const wasm = cases.find((c) => c.name === 'wasm')
    if (!wasm) {
      console.warn('[pixel-parity.test] wasm row unavailable — skipping the cross-implementation comparison.')
      return
    }
    const w = 8
    const h = 8
    const data = new Uint8Array(w * h * 4)
    for (let i = 0; i < data.length; i++) data[i] = (i * 37 + 11) % 256
    const tsOut = tsKernels.quantize(data, 6, true, 8, 32)
    const wasmOut = wasm.kernels.quantize(data, 6, true, 8, 32)
    expect(tsOut).toBeDefined()
    expect(wasmOut).toBeDefined()
    expect(wasm.kernels.bytesEqual(tsOut!, wasmOut!)).toBe(true)
  })

  // ── Phase 6: downscale parity ───────────────────────────────────────────

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: downscale picks the dominant color of each cell', (_name, k) => {
    const size = 8
    const data = new Uint8Array(size * size * 4)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4
        const isBlack = x % 4 === 0 && y % 4 === 0
        data.set(isBlack ? [0, 0, 0, 255] : [200, 10, 10, 255], i)
      }
    }
    const out = k.downscale(data, size, size, 2, 2)
    expect(out).toBeDefined()
    for (let i = 0; i < out!.length; i += 4) {
      expect(out![i]).toBeGreaterThan(150)
      expect(out![i + 1]).toBeLessThan(60)
    }
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: downscale handles a 1x1 source and target', (_name, k) => {
    const data = new Uint8Array([9, 8, 7, 255])
    const out = k.downscale(data, 1, 1, 1, 1)
    expect(out).toEqual(new Uint8Array([9, 8, 7, 255]))
  })

  it.each(cases.map((c) => [c.name, c.kernels] as const))('%s: downscale rejects zero dimensions and mismatched buffer length', (_name, k) => {
    expect(k.downscale(new Uint8Array(0), 0, 0, 4, 4)).toBeUndefined()
    expect(k.downscale(new Uint8Array(4), 1, 1, 4, 0)).toBeUndefined()
    expect(k.downscale(new Uint8Array(4), 4, 4, 1, 1)).toBeUndefined() // declares 4x4, only 4 bytes
  })

  it('downscale: ts and wasm agree byte-for-byte on a non-divisible, non-square resize', () => {
    const wasm = cases.find((c) => c.name === 'wasm')
    if (!wasm) {
      console.warn('[pixel-parity.test] wasm row unavailable — skipping the cross-implementation comparison.')
      return
    }
    const srcW = 13
    const srcH = 7
    const data = new Uint8Array(srcW * srcH * 4)
    for (let i = 0; i < data.length; i++) data[i] = (i * 53 + 3) % 256
    const tsOut = tsKernels.downscale(data, srcW, srcH, 4, 3)
    const wasmOut = wasm.kernels.downscale(data, srcW, srcH, 4, 3)
    expect(tsOut).toBeDefined()
    expect(wasmOut).toBeDefined()
    expect(wasm.kernels.bytesEqual(tsOut!, wasmOut!)).toBe(true)
  })

  // ── Phase 6: boundary number validation (NaN/fractional/huge — ts vs wasm agree) ──

  it.each([NaN, 1.5, -1, 2 ** 32 + 1, Infinity, -Infinity])('quantize(colors=%s) — ts and wasm both reject (undefined), never throw', (badColors) => {
    const data = new Uint8Array(16)
    expect(() => tsKernels.quantize(data, badColors, true, 4, 0)).not.toThrow()
    expect(tsKernels.quantize(data, badColors, true, 4, 0)).toBeUndefined()
    const wasm = cases.find((c) => c.name === 'wasm')
    if (wasm) {
      expect(() => wasm.kernels.quantize(data, badColors, true, 4, 0)).not.toThrow()
      expect(wasm.kernels.quantize(data, badColors, true, 4, 0)).toBeUndefined()
    }
  })

  it.each([NaN, 1.5, -1, 2 ** 32 + 1, Infinity, -Infinity])('downscale(targetW=%s) — ts and wasm both reject (undefined), never throw', (badW) => {
    const data = new Uint8Array(16)
    expect(() => tsKernels.downscale(data, 2, 2, badW, 2)).not.toThrow()
    expect(tsKernels.downscale(data, 2, 2, badW, 2)).toBeUndefined()
    const wasm = cases.find((c) => c.name === 'wasm')
    if (wasm) {
      expect(() => wasm.kernels.downscale(data, 2, 2, badW, 2)).not.toThrow()
      expect(wasm.kernels.downscale(data, 2, 2, badW, 2)).toBeUndefined()
    }
  })

  // ── Fix-agent phase 6f: MAX_DOWNSCALE_DIMENSION / MAX_QUANTIZE_COLORS parity (W-A) ──
  // An individually-"valid" u32 target can still overflow the allocation-size
  // math (phase 6 review finding W-A: `downscale(data, 1, 1, 32768, 32768)`
  // trapped the real .wasm). Both implementations must reject identically.

  it('downscale: ts and wasm both reject a target dimension above MAX_DOWNSCALE_DIMENSION, and both still accept the bound itself', () => {
    const data = new Uint8Array(4) // 1x1 source
    const wasm = cases.find((c) => c.name === 'wasm')

    expect(tsKernels.downscale(data, 1, 1, MAX_DOWNSCALE_DIMENSION + 1, 1)).toBeUndefined()
    expect(tsKernels.downscale(data, 1, 1, 1, MAX_DOWNSCALE_DIMENSION + 1)).toBeUndefined()
    expect(tsKernels.downscale(data, 1, 1, MAX_DOWNSCALE_DIMENSION, 1)).toBeDefined()

    if (wasm) {
      expect(wasm.kernels.downscale(data, 1, 1, MAX_DOWNSCALE_DIMENSION + 1, 1)).toBeUndefined()
      expect(wasm.kernels.downscale(data, 1, 1, 1, MAX_DOWNSCALE_DIMENSION + 1)).toBeUndefined()
      expect(wasm.kernels.downscale(data, 1, 1, MAX_DOWNSCALE_DIMENSION, 1)).toBeDefined()
    }
  })

  it('downscale: the exact adversarial overflow input (32768x32768) that used to trap the real Wasm instance is now a clean, consistent reject on both sides', () => {
    const data = new Uint8Array(4)
    const wasm = cases.find((c) => c.name === 'wasm')

    expect(tsKernels.downscale(data, 1, 1, 32768, 32768)).toBeUndefined()
    if (wasm) {
      expect(() => wasm.kernels.downscale(data, 1, 1, 32768, 32768)).not.toThrow()
      expect(wasm.kernels.downscale(data, 1, 1, 32768, 32768)).toBeUndefined()
      // the same Wasm instance must stay usable afterward — no corrupted state from the rejection
      expect(wasm.kernels.downscale(data, 1, 1, 1, 1)).toEqual(data)
    }
  })

  it('quantize: ts and wasm both reject colors above MAX_QUANTIZE_COLORS, and both still accept the bound itself', () => {
    const data = new Uint8Array(16)
    const wasm = cases.find((c) => c.name === 'wasm')

    expect(tsKernels.quantize(data, MAX_QUANTIZE_COLORS + 1, true, 1, 0)).toBeUndefined()
    expect(tsKernels.quantize(data, MAX_QUANTIZE_COLORS, true, 0, 0)).toBeDefined()

    if (wasm) {
      expect(wasm.kernels.quantize(data, MAX_QUANTIZE_COLORS + 1, true, 1, 0)).toBeUndefined()
      expect(wasm.kernels.quantize(data, MAX_QUANTIZE_COLORS, true, 0, 0)).toBeDefined()
    }
  })

  it('ts and wasm agree byte-for-byte on a non-trivial buffer (byte-identical result)', () => {
    const wasm = cases.find((c) => c.name === 'wasm')
    if (!wasm) {
      console.warn('[pixel-parity.test] wasm row unavailable — skipping the cross-implementation comparison.')
      return
    }
    const w = 8
    const h = 8
    const tsData = buf(w * h * 4)
    const wasmData = buf(w * h * 4)
    const points: number[] = []
    const colors: number[] = []
    for (let i = 0; i < 20; i++) {
      points.push(i % w, (i * 3) % h)
      colors.push(((i * 0x11223344) >>> 0) | 0xff) // keep alpha non-zero
    }
    // One point per putPoints call (still exercising the batched kernel, not
    // the removed per-pixel one) so each can carry its own color.
    for (let i = 0; i < colors.length; i++) {
      tsKernels.putPoints(tsData, w, h, new Int32Array([points[i * 2], points[i * 2 + 1]]), colors[i])
      wasm.kernels.putPoints(wasmData, w, h, new Int32Array([points[i * 2], points[i * 2 + 1]]), colors[i])
    }
    expect(wasm.kernels.bytesEqual(tsData, wasmData)).toBe(true)
  })
})

/**
 * Fix-agent phase 5f.5 (Rust/TS boundary parity — scratchpad
 * `judgeB5/nan.mts`/`kpar.mts`): a plain `rx < 0`/`rx + rw > w`-style bounds
 * check is silently `false` for `NaN` on either side (NaN compares unequal
 * to everything), and a fractional `rx` (e.g. `1.5`) could slip past the
 * same checks and compute a fractional/misaligned buffer index — while a
 * wasm-bindgen `u32` parameter instead coerces (truncates/wraps) a
 * NaN/fractional/out-of-range number via the JS-API's `ToUint32`, reaching
 * Rust as a DIFFERENT, "valid-looking" value. DECISION (design.md "Boundary
 * number validation"): both `tsKernels` and `makeWasmKernels` now reject
 * every one of these inputs identically, via the shared `isValidU32` guard,
 * BEFORE any further arithmetic or a call into Wasm. This suite asserts ts
 * and wasm agree byte-for-byte (never throw, never misalign) on exactly the
 * adversarial inputs the judge's scratch repro found.
 */
describe('boundary number validation — NaN/fractional/huge values (ts vs wasm agree)', () => {
  const wasm = cases.find((c) => c.name === 'wasm')
  const w = 4
  const h = 4
  const BAD_RECT_ARGS: ReadonlyArray<readonly [number, number, number, number]> = [
    [NaN, 1, 2, 1],
    [1.5, 1, 2, 1],
    [0, 0, 1.5, 1],
    [0, 0, NaN, 1],
    [NaN, NaN, 2 ** 31, 2 ** 31],
    [-1, 0, 2, 1],
    [0, -1, 2, 1],
    [2 ** 32 + 1, 0, 2, 1],
    [0, 0, 2 ** 32 + 1, 1],
    [Infinity, 0, 1, 1],
    [0, 0, -Infinity, 1],
  ]

  it.each(BAD_RECT_ARGS)('extractRect(rx=%s, ry=%s, rw=%s, rh=%s) — ts and wasm both reject (undefined), never throw/misalign', (rx, ry, rw, rh) => {
    const data = buf(w * h * 4)
    expect(() => tsKernels.extractRect(data, w, h, rx, ry, rw, rh)).not.toThrow()
    expect(tsKernels.extractRect(data, w, h, rx, ry, rw, rh)).toBeUndefined()
    if (wasm) {
      expect(() => wasm.kernels.extractRect(data, w, h, rx, ry, rw, rh)).not.toThrow()
      expect(wasm.kernels.extractRect(data, w, h, rx, ry, rw, rh)).toBeUndefined()
    }
  })

  it.each(BAD_RECT_ARGS)('writeRect(rx=%s, ry=%s, rw=%s, rh=%s) — ts and wasm both reject (false), buffer left untouched', (rx, ry, rw, rh) => {
    const safeLen = Number.isFinite(rw) && Number.isFinite(rh) && rw > 0 && rh > 0 && Number.isInteger(rw) && Number.isInteger(rh) ? rw * rh * 4 : 8
    const patch = new Uint8Array(Math.max(0, Math.min(safeLen, 1024))).fill(255)

    const tsData = buf(w * h * 4)
    expect(() => tsKernels.writeRect(tsData, w, h, rx, ry, rw, rh, patch)).not.toThrow()
    expect(tsKernels.writeRect(tsData, w, h, rx, ry, rw, rh, patch)).toBe(false)
    expect(tsData.every((v) => v === 0)).toBe(true) // rejected — buffer never touched

    if (wasm) {
      const wasmData = buf(w * h * 4)
      expect(() => wasm.kernels.writeRect(wasmData, w, h, rx, ry, rw, rh, patch)).not.toThrow()
      expect(wasm.kernels.writeRect(wasmData, w, h, rx, ry, rw, rh, patch)).toBe(false)
      expect(wasmData.every((v) => v === 0)).toBe(true)
    }
  })

  it.each([NaN, 1.5, -1, 2 ** 32 + 1, Infinity, -Infinity])('diffRect(w=%s) — ts and wasm both reject (undefined), never throw', (badW) => {
    const a = buf(0)
    const b = buf(0)
    expect(() => tsKernels.diffRect(a, b, badW, badW)).not.toThrow()
    expect(tsKernels.diffRect(a, b, badW, badW)).toBeUndefined()
    if (wasm) {
      expect(() => wasm.kernels.diffRect(a, b, badW, badW)).not.toThrow()
      expect(wasm.kernels.diffRect(a, b, badW, badW)).toBeUndefined()
    }
  })

  it.each([
    [NaN, 0],
    [1.5, 1],
    [1, 1.9],
    [-1, 0],
    [4, 0], // out of bounds (w=4, valid x in [0,3])
    [2 ** 32 + 1, 0],
    [-4294967295, 0],
    [3.999, 2],
    [Infinity, 0],
  ] as ReadonlyArray<readonly [number, number]>)('floodFill(x=%s, y=%s) out-of-domain seed — ts and wasm both reject (undefined), never throw', (x, y) => {
    const tsData = new Uint8Array(w * h * 4).fill(9)
    expect(() => tsKernels.floodFill(tsData, w, h, x, y, 0xff0000ff)).not.toThrow()
    expect(tsKernels.floodFill(tsData, w, h, x, y, 0xff0000ff)).toBeUndefined()
    expect(tsData.every((v) => v === 9)).toBe(true) // rejected — buffer never touched

    if (wasm) {
      const wasmData = new Uint8Array(w * h * 4).fill(9)
      expect(() => wasm.kernels.floodFill(wasmData, w, h, x, y, 0xff0000ff)).not.toThrow()
      expect(wasm.kernels.floodFill(wasmData, w, h, x, y, 0xff0000ff)).toBeUndefined()
      expect(wasmData.every((v) => v === 9)).toBe(true)
    }
  })
})

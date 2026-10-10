import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { quantizePixels } from './quantize'
import { createEmptyBuffer, putPixel } from './pixel-buffer'
import { tsKernels, makeWasmKernels } from '@pixelforge/core'
import type { PixelBuffer, RgbaColor } from '@/types'

/**
 * Phase 6: `packages/core`'s Rust/Wasm `quantize` kernel (and its TS
 * reference mirror, `tsKernels.quantize`) must stay byte-for-byte identical
 * to the ORIGINAL, never-touched `apps/editor/src/lib/quantize.ts` — the
 * long-standing oracle this port is based on. Mirrors
 * `flood-fill.oracle-parity.test.ts`'s Node-wasm-loader pattern exactly: the
 * wasm row is skipped (not failed) if `pkg/` hasn't been built yet.
 */

function rng(seedN: number): () => number {
  let s = seedN >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

interface KernelRow {
  readonly name: string
  readonly quantize: typeof tsKernels.quantize
}

const kernelRows: KernelRow[] = [{ name: 'ts', quantize: tsKernels.quantize }]

const require = createRequire(import.meta.url)
const coreEntryPath = require.resolve('@pixelforge/core')
const coreRoot = dirname(dirname(coreEntryPath))
const wasmPath = join(coreRoot, 'pkg', 'pixelforge_core_bg.wasm')
const pkgJsPath = join(coreRoot, 'pkg', 'pixelforge_core.js')

if (existsSync(wasmPath)) {
  const mod: Record<string, unknown> & { initSync: (opts: { module: Buffer }) => void } = await import(pathToFileURL(pkgJsPath).href)
  mod.initSync({ module: readFileSync(wasmPath) })
  const wasmKernels = makeWasmKernels(mod as Parameters<typeof makeWasmKernels>[0])
  kernelRows.push({ name: 'wasm', quantize: wasmKernels.quantize })
} else {
  console.warn(`[quantize.oracle-parity] ${wasmPath} not found — run "pnpm run build:wasm" first. Skipping the wasm row.`)
}

function buildBuffer(w: number, h: number, pixels: RgbaColor[]): PixelBuffer {
  const buf = createEmptyBuffer(w, h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      putPixel(buf, x, y, pixels[y * w + x])
    }
  }
  return buf
}

describe('quantize oracle parity — kernel port vs the ORIGINAL editor implementation', () => {
  it(`ts and wasm match apps/editor/src/lib/quantize.ts byte-for-byte on 2,000 randomized cases (${kernelRows.map((r) => r.name).join(', ')})`, () => {
    const fails: string[] = []
    let cases = 0
    const RUNS = 2000

    for (let run = 0; run < RUNS && fails.length < 5; run++) {
      const r = rng(run * 11 + 7)
      const ri = (n: number): number => Math.floor(r() * n)
      const big = run % 200 === 0
      const w = big ? 8 + ri(16) : 1 + ri(6)
      const h = big ? 8 + ri(16) : 1 + ri(6)
      const paletteSize = 1 + ri(6)
      const palette = Array.from({ length: paletteSize }, () => ({ r: ri(256), g: ri(256), b: ri(256), a: ri(256) }))
      const pixels: RgbaColor[] = Array.from({ length: w * h }, () => palette[ri(paletteSize)])
      const buf = buildBuffer(w, h, pixels)

      const colors = ri(9) // 0..8
      const weightBySaturation = r() < 0.5
      const iterations = ri(6) // 0..5
      const alphaThreshold = ri(256)
      const opts = { colors, weightBySaturation, iterations, alphaThreshold }

      const oracle = quantizePixels(buf, opts)
      cases++

      const oracleBytes = new Uint8Array(oracle.data.buffer, oracle.data.byteOffset, oracle.data.byteLength)
      const flatIn = new Uint8Array(buf.data.buffer, buf.data.byteOffset, buf.data.byteLength)

      for (const { name, quantize } of kernelRows) {
        const kOut = quantize(flatIn, colors, weightBySaturation, iterations, alphaThreshold)
        if (!kOut) {
          fails.push(`run ${run} (${name}): kernel returned undefined for a valid input`)
          continue
        }
        for (let k = 0; k < oracleBytes.length; k++) {
          if (oracleBytes[k] !== kOut[k]) {
            fails.push(`run ${run} (${name}): byte mismatch at ${k} (w=${w},h=${h},colors=${colors},iter=${iterations},alphaTh=${alphaThreshold})`)
            break
          }
        }
      }
    }

    expect({ cases, fails }).toEqual({ cases, fails: [] })
  })

  it('edge cases: 1x1, fully transparent, palette sizes 1/2/max all match the oracle', () => {
    const fails: string[] = []

    // 1x1 source
    {
      const buf = buildBuffer(1, 1, [{ r: 10, g: 20, b: 30, a: 255 }])
      const opts = { colors: 1, weightBySaturation: true, iterations: 4, alphaThreshold: 0 }
      const oracle = quantizePixels(buf, opts)
      const flat = new Uint8Array(buf.data.buffer, buf.data.byteOffset, buf.data.byteLength)
      for (const { name, quantize } of kernelRows) {
        const out = quantize(flat, opts.colors, opts.weightBySaturation, opts.iterations, opts.alphaThreshold)
        if (!out || !Array.from(out).every((v, i) => v === oracle.data[i])) fails.push(`1x1 (${name})`)
      }
    }

    // fully transparent
    {
      const buf = buildBuffer(4, 4, Array.from({ length: 16 }, () => ({ r: 50, g: 60, b: 70, a: 0 })))
      const opts = { colors: 4, weightBySaturation: true, iterations: 4, alphaThreshold: 10 }
      const oracle = quantizePixels(buf, opts)
      const flat = new Uint8Array(buf.data.buffer, buf.data.byteOffset, buf.data.byteLength)
      for (const { name, quantize } of kernelRows) {
        const out = quantize(flat, opts.colors, opts.weightBySaturation, opts.iterations, opts.alphaThreshold)
        if (!out || !Array.from(out).every((v, i) => v === oracle.data[i])) fails.push(`fully-transparent (${name})`)
      }
    }

    // palette sizes 1, 2, max(256)
    for (const colors of [1, 2, 256]) {
      const pixels = Array.from({ length: 10 * 10 }, (_, i) => ({ r: (i * 7) % 256, g: (i * 13) % 256, b: (i * 23) % 256, a: 255 }))
      const buf = buildBuffer(10, 10, pixels)
      const opts = { colors, weightBySaturation: true, iterations: 6, alphaThreshold: 32 }
      const oracle = quantizePixels(buf, opts)
      const flat = new Uint8Array(buf.data.buffer, buf.data.byteOffset, buf.data.byteLength)
      for (const { name, quantize } of kernelRows) {
        const out = quantize(flat, opts.colors, opts.weightBySaturation, opts.iterations, opts.alphaThreshold)
        if (!out || !Array.from(out).every((v, i) => v === oracle.data[i])) fails.push(`colors=${colors} (${name})`)
      }
    }

    expect(fails).toEqual([])
  })

  it('NaN/fractional/huge numeric params are rejected identically by both kernels (boundary rules, phase 5f convention)', () => {
    const data = new Uint8Array(16)
    const BAD: ReadonlyArray<readonly [number, number, number]> = [
      [NaN, 4, 0],
      [1.5, 4, 0],
      [4, NaN, 0],
      [4, 1.5, 0],
      [4, 4, NaN],
      [4, 4, 1.5],
      [-1, 4, 0],
      [2 ** 32 + 1, 4, 0],
      [Infinity, 4, 0],
      [-Infinity, 4, 0],
    ]
    for (const [colors, iterations, alphaThreshold] of BAD) {
      for (const { name, quantize } of kernelRows) {
        expect(() => quantize(data, colors, true, iterations, alphaThreshold), name).not.toThrow()
        expect(quantize(data, colors, true, iterations, alphaThreshold), name).toBeUndefined()
      }
    }
  })
})

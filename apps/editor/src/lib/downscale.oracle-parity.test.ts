import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { downscaleTo } from './downscale'
import { createEmptyBuffer, putPixel } from './pixel-buffer'
import { tsKernels, makeWasmKernels } from '@pixelforge/core'
import type { PixelBuffer, RgbaColor } from '@/types'

/**
 * Phase 6: `packages/core`'s Rust/Wasm `downscale` kernel (and its TS
 * reference mirror, `tsKernels.downscale`) must stay byte-for-byte identical
 * to the ORIGINAL, never-touched `apps/editor/src/lib/downscale.ts`'s
 * `downscaleTo` — the long-standing oracle this port is based on.
 * `resizeNearest` is intentionally out of this port's scope (see
 * `packages/core/src/downscale.rs`'s module doc) and is not covered here.
 * Mirrors `flood-fill.oracle-parity.test.ts`'s Node-wasm-loader pattern.
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
  readonly downscale: typeof tsKernels.downscale
}

const kernelRows: KernelRow[] = [{ name: 'ts', downscale: tsKernels.downscale }]

const require = createRequire(import.meta.url)
const coreEntryPath = require.resolve('@pixelforge/core')
const coreRoot = dirname(dirname(coreEntryPath))
const wasmPath = join(coreRoot, 'pkg', 'pixelforge_core_bg.wasm')
const pkgJsPath = join(coreRoot, 'pkg', 'pixelforge_core.js')

if (existsSync(wasmPath)) {
  const mod: Record<string, unknown> & { initSync: (opts: { module: Buffer }) => void } = await import(pathToFileURL(pkgJsPath).href)
  mod.initSync({ module: readFileSync(wasmPath) })
  const wasmKernels = makeWasmKernels(mod as Parameters<typeof makeWasmKernels>[0])
  kernelRows.push({ name: 'wasm', downscale: wasmKernels.downscale })
} else {
  console.warn(`[downscale.oracle-parity] ${wasmPath} not found — run "pnpm run build:wasm" first. Skipping the wasm row.`)
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

describe('downscale oracle parity — kernel port vs the ORIGINAL editor implementation', () => {
  it(`ts and wasm match apps/editor/src/lib/downscale.ts's downscaleTo byte-for-byte on 2,000 randomized cases (${kernelRows.map((r) => r.name).join(', ')})`, () => {
    const fails: string[] = []
    let cases = 0
    const RUNS = 2000

    for (let run = 0; run < RUNS && fails.length < 5; run++) {
      const r = rng(run * 17 + 29)
      const ri = (n: number): number => Math.floor(r() * n)
      const big = run % 200 === 0
      const srcW = big ? 16 + ri(32) : 1 + ri(12)
      const srcH = big ? 16 + ri(32) : 1 + ri(12)
      const targetW = 1 + ri(6)
      const targetH = 1 + ri(6)
      const paletteSize = 1 + ri(6)
      const palette = Array.from({ length: paletteSize }, () => ({ r: ri(256), g: ri(256), b: ri(256), a: ri(256) }))
      const pixels: RgbaColor[] = Array.from({ length: srcW * srcH }, () => palette[ri(paletteSize)])
      const buf = buildBuffer(srcW, srcH, pixels)

      const oracle = downscaleTo(buf, targetW, targetH)
      cases++

      const oracleBytes = new Uint8Array(oracle.data.buffer, oracle.data.byteOffset, oracle.data.byteLength)
      const flatIn = new Uint8Array(buf.data.buffer, buf.data.byteOffset, buf.data.byteLength)

      for (const { name, downscale } of kernelRows) {
        const kOut = downscale(flatIn, srcW, srcH, targetW, targetH)
        if (!kOut) {
          fails.push(`run ${run} (${name}): kernel returned undefined for a valid input`)
          continue
        }
        if (kOut.length !== oracleBytes.length) {
          fails.push(`run ${run} (${name}): length mismatch ${kOut.length} !== ${oracleBytes.length}`)
          continue
        }
        for (let k = 0; k < oracleBytes.length; k++) {
          if (oracleBytes[k] !== kOut[k]) {
            fails.push(`run ${run} (${name}): byte mismatch at ${k} (srcW=${srcW},srcH=${srcH},targetW=${targetW},targetH=${targetH})`)
            break
          }
        }
      }
    }

    expect({ cases, fails }).toEqual({ cases, fails: [] })
  })

  it('edge cases: 1x1, non-divisible sizes, fully transparent all match the oracle', () => {
    const fails: string[] = []

    // 1x1 -> 1x1
    {
      const buf = buildBuffer(1, 1, [{ r: 11, g: 22, b: 33, a: 255 }])
      const oracle = downscaleTo(buf, 1, 1)
      const flat = new Uint8Array(buf.data.buffer, buf.data.byteOffset, buf.data.byteLength)
      for (const { name, downscale } of kernelRows) {
        const out = downscale(flat, 1, 1, 1, 1)
        if (!out || !Array.from(out).every((v, i) => v === oracle.data[i])) fails.push(`1x1 (${name})`)
      }
    }

    // non-divisible source size
    {
      const pixels = Array.from({ length: 7 * 7 }, () => ({ r: 200, g: 10, b: 10, a: 255 }))
      const buf = buildBuffer(7, 7, pixels)
      const oracle = downscaleTo(buf, 2, 2)
      const flat = new Uint8Array(buf.data.buffer, buf.data.byteOffset, buf.data.byteLength)
      for (const { name, downscale } of kernelRows) {
        const out = downscale(flat, 7, 7, 2, 2)
        if (!out || !Array.from(out).every((v, i) => v === oracle.data[i])) fails.push(`non-divisible (${name})`)
      }
    }

    // fully transparent source
    {
      const pixels = Array.from({ length: 8 * 8 }, () => ({ r: 1, g: 2, b: 3, a: 0 }))
      const buf = buildBuffer(8, 8, pixels)
      const oracle = downscaleTo(buf, 3, 3)
      const flat = new Uint8Array(buf.data.buffer, buf.data.byteOffset, buf.data.byteLength)
      for (const { name, downscale } of kernelRows) {
        const out = downscale(flat, 8, 8, 3, 3)
        if (!out || !Array.from(out).every((v, i) => v === oracle.data[i])) fails.push(`fully-transparent (${name})`)
      }
    }

    // alpha threshold boundary (127 vs 128 — fallback core branch)
    for (const alpha of [127, 128]) {
      const pixels = Array.from({ length: 2 * 2 }, () => ({ r: 9, g: 9, b: 9, a: alpha }))
      const buf = buildBuffer(2, 2, pixels)
      const oracle = downscaleTo(buf, 1, 1)
      const flat = new Uint8Array(buf.data.buffer, buf.data.byteOffset, buf.data.byteLength)
      for (const { name, downscale } of kernelRows) {
        const out = downscale(flat, 2, 2, 1, 1)
        if (!out || !Array.from(out).every((v, i) => v === oracle.data[i])) fails.push(`alpha=${alpha} (${name})`)
      }
    }

    expect(fails).toEqual([])
  })

  it('NaN/fractional/huge numeric params are rejected identically by both kernels (boundary rules, phase 5f convention)', () => {
    const data = new Uint8Array(16) // declares a 2x2 buffer
    const BAD: ReadonlyArray<readonly [number, number, number, number]> = [
      [NaN, 2, 2, 2],
      [1.5, 2, 2, 2],
      [2, NaN, 2, 2],
      [2, 2, NaN, 2],
      [2, 2, 2, NaN],
      [-1, 2, 2, 2],
      [2 ** 32 + 1, 2, 2, 2],
      [Infinity, 2, 2, 2],
      [-Infinity, 2, 2, 2],
    ]
    for (const [srcW, srcH, targetW, targetH] of BAD) {
      for (const { name, downscale } of kernelRows) {
        expect(() => downscale(data, srcW, srcH, targetW, targetH), name).not.toThrow()
        expect(downscale(data, srcW, srcH, targetW, targetH), name).toBeUndefined()
      }
    }
  })
})

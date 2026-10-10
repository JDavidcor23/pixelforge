import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { floodFill as oracleFill } from './flood-fill'
import { diffRect } from './pixel-buffer'
import { tsKernels, makeWasmKernels } from '@pixelforge/core'

/**
 * Fix-agent phase 5f.3: the scanline span-fill rewrite (both
 * `packages/core/src/flood_fill.rs` and `packages/core/src-ts/ts-core.ts`'s
 * `tsKernels.floodFill`) must stay byte-for-byte identical to the
 * ORIGINAL, never-touched `apps/editor/src/lib/flood-fill.ts` — the
 * long-standing oracle (the editor's pre-Rust-port stack-based
 * implementation, still the bench baseline, see `flood-fill.bench.ts`).
 * This is a permanent port of the judge's scratch repro
 * (`judgeB5/ff.test.ts`'s "random images/seeds" case, 30,000 cases) kept
 * at 5,000 — enough to catch a real divergence fast, without inflating CI
 * time for a kernel this small.
 *
 * Mirrors `packages/core/src-ts/pixel-parity.test.ts`'s Node-wasm-loader
 * pattern: the wasm row is skipped (not failed) if `pkg/` hasn't been built
 * yet, exactly like that suite.
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
  readonly floodFill: typeof tsKernels.floodFill
}

const kernelRows: KernelRow[] = [{ name: 'ts', floodFill: tsKernels.floodFill }]

// `resolveKernels()`'s production loader does a `fetch(new URL(...))`, which
// has no working local-file resolution under this suite's plain Node test
// environment (confirmed: it throws `TypeError: fetch failed` here) — same
// Node-`initSync`+`readFileSync` loader `pixel-parity.test.ts` uses instead,
// just resolved from apps/editor's own `node_modules` rather than from
// inside `packages/core` itself. `@pixelforge/core`'s `package.json` only
// exports `"."` (`src-ts/index.ts`), not a `./pkg/...` subpath, so the pkg
// directory is located relative to that resolved entry file instead of via
// a (disallowed) deep import.
const require = createRequire(import.meta.url)
const coreEntryPath = require.resolve('@pixelforge/core')
const coreRoot = dirname(dirname(coreEntryPath)) // .../packages/core/src-ts/index.ts -> .../packages/core
const wasmPath = join(coreRoot, 'pkg', 'pixelforge_core_bg.wasm')
const pkgJsPath = join(coreRoot, 'pkg', 'pixelforge_core.js')

if (existsSync(wasmPath)) {
  const mod: Record<string, unknown> & { initSync: (opts: { module: Buffer }) => void } = await import(pathToFileURL(pkgJsPath).href)
  mod.initSync({ module: readFileSync(wasmPath) })
  const wasmKernels = makeWasmKernels(mod as Parameters<typeof makeWasmKernels>[0])
  kernelRows.push({ name: 'wasm', floodFill: wasmKernels.floodFill })
} else {
  console.warn(`[flood-fill.oracle-parity] ${wasmPath} not found — run "pnpm run build:wasm" first. Skipping the wasm row.`)
}

describe('flood fill oracle parity — scanline rewrite vs the ORIGINAL editor implementation (fix-agent 5f.3)', () => {
  it(`ts and wasm match apps/editor/src/lib/flood-fill.ts byte-for-byte on 5,000 randomized cases (${kernelRows.map((r) => r.name).join(', ')})`, () => {
    const fails: string[] = []
    let cases = 0
    let noops = 0
    const RUNS = 5000

    for (let run = 0; run < RUNS && fails.length < 5; run++) {
      const r = rng(run * 7 + 3)
      const ri = (n: number): number => Math.floor(r() * n)
      const big = run % 100 === 0
      const w = big ? 32 + ri(64) : 1 + ri(12)
      const h = big ? 32 + ri(64) : 1 + ri(12)
      const ncol = 1 + ri(3)
      const pal = Array.from({ length: ncol }, () => [ri(3) * 100, ri(2) * 255, 0, ri(2) ? 255 : ri(2) * 128])
      const data = new Uint8ClampedArray(w * h * 4)
      for (let p = 0; p < w * h; p++) {
        const c = pal[ri(ncol)]
        data.set(c, p * 4)
      }
      const edge = ri(3) === 0
      const x = edge ? (ri(2) ? 0 : w - 1) : ri(w)
      const y = edge ? (ri(2) ? 0 : h - 1) : ri(h)
      const fc = r() < 0.2 ? pal[ri(ncol)] : [ri(256), ri(256), ri(256), ri(256)]
      const rgba = (((fc[0] << 24) | (fc[1] << 16) | (fc[2] << 8) | fc[3]) >>> 0) as number
      const before = { w, h, data }

      const o = oracleFill(before, x, y, { r: fc[0], g: fc[1], b: fc[2], a: fc[3] })
      cases++

      const expectedDirty = o === before ? undefined : diffRect(before, o)
      const expectedRect = expectedDirty ? ([expectedDirty.x, expectedDirty.y, expectedDirty.w, expectedDirty.h] as const) : undefined

      if (o === before) noops++

      for (const { name, floodFill } of kernelRows) {
        const kData = new Uint8Array(data)
        const rect = floodFill(kData, w, h, x, y, rgba)

        if (o === before) {
          if (rect !== undefined) fails.push(`run ${run} (${name}): oracle no-op but kernel returned a dirty rect ${JSON.stringify(rect)}`)
          continue
        }

        const oracleBytes = new Uint8Array(o.data.buffer, o.data.byteOffset, o.data.byteLength)
        for (let k = 0; k < oracleBytes.length; k++) {
          if (oracleBytes[k] !== kData[k]) {
            fails.push(`run ${run} (${name}): byte mismatch at ${k}`)
            break
          }
        }
        if (JSON.stringify(rect) !== JSON.stringify(expectedRect)) {
          fails.push(`run ${run} (${name}): dirty rect ${JSON.stringify(rect)} !== oracle's ${JSON.stringify(expectedRect)}`)
        }
      }
    }

    expect({ cases, noops, fails }).toEqual({ cases, noops, fails: [] })
  })
})

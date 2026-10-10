import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bench, describe } from 'vitest'
import { tsKernels } from '../src-ts/ts-core'
import { makeWasmKernels } from '../src-ts/wasm-core'
import type { PixelKernels } from '../src-ts/types'

// Run with: pnpm run bench (requires `pnpm run build:wasm` first for the
// wasm row — see pixel-parity.test.ts for the same loader pattern).
// Honest numbers only (orchestrator instruction): if Wasm loses to TS for a
// tiny per-call op because of the JS<->Wasm boundary cost, that is recorded
// as-is in baseline-bench.md, with the batch size where the crossover
// happens, never hidden or reframed.
//
// W7 (phase 4f) + T1: the OLD per-call "put_pixel x2000" group gated on a
// ratio that was never a meaningful signal — 2500x was "whatever the first
// measurement happened to be", not a budget anyone could violate in a way
// that meant something (the facade doesn't even expose a per-pixel call any
// more, see T1). It survives below ONLY as an "informative" group with no
// entry in thresholds.json (never gates CI, never causes check-bench.ts to
// fail/skip) — it still answers "how bad is one-call-per-point", which is
// useful context for why `putPoints` exists at all. The REAL gates are now
// on BATCH operations: one `putPoints` call for the whole gesture, and the
// pre-existing whole-rect `extractRect`+`writeRect` case.

const here = dirname(fileURLToPath(import.meta.url))
const wasmPath = join(here, '..', 'pkg', 'pixelforge_core_bg.wasm')

let wasmKernels: PixelKernels | null = null
if (existsSync(wasmPath)) {
  const mod = await import('../pkg/pixelforge_core.js')
  mod.initSync({ module: readFileSync(wasmPath) })
  wasmKernels = makeWasmKernels(mod)
} else {
  console.warn(`[pixel-kernels.bench] ${wasmPath} not found — run "pnpm run build:wasm" first. Only the ts row will run.`)
}

const W = 256
const H = 256
const N_POINTS = 2000 // a large stroke gesture's worth of points in one batch

function buf(): Uint8Array {
  return new Uint8Array(W * H * 4)
}

function strokePoints(): Int32Array {
  const points = new Int32Array(N_POINTS * 2)
  for (let i = 0; i < N_POINTS; i++) {
    points[i * 2] = i % W
    points[i * 2 + 1] = Math.floor(i / W) % H
  }
  return points
}

describe('put_points x2000 one-call-per-point — informative only, NOT a CI gate (no thresholds.json entry)', () => {
  bench('ts: 2000x putPoints(1 point each)', () => {
    const data = buf()
    for (let i = 0; i < N_POINTS; i++) tsKernels.putPoints(data, W, H, new Int32Array([i % W, Math.floor(i / W) % H]), 0xff0000ff)
  })

  if (wasmKernels) {
    const wasm = wasmKernels
    bench('wasm: 2000x putPoints(1 point each, one call per point)', () => {
      const data = buf()
      for (let i = 0; i < N_POINTS; i++) wasm.putPoints(data, W, H, new Int32Array([i % W, Math.floor(i / W) % H]), 0xff0000ff)
    })
  }
})

describe('put_points batched x2000 — ONE call for the whole gesture (the real batch-operation gate)', () => {
  const points = strokePoints()

  bench('ts: putPoints(2000 points, one call)', () => {
    const data = buf()
    tsKernels.putPoints(data, W, H, points, 0xff0000ff)
  })

  if (wasmKernels) {
    const wasm = wasmKernels
    bench('wasm: putPoints(2000 points, one call)', () => {
      const data = buf()
      wasm.putPoints(data, W, H, points, 0xff0000ff)
    })
  }
})

describe('extractRect + writeRect — one whole-rect call each way (best case for Wasm: amortizes the boundary cost over many bytes)', () => {
  const RECT = { rx: 32, ry: 32, rw: 128, rh: 128 } // 64KB patch

  bench('ts: extractRect + writeRect (128x128 rect)', () => {
    const data = buf()
    const patch = tsKernels.extractRect(data, W, H, RECT.rx, RECT.ry, RECT.rw, RECT.rh)!
    tsKernels.writeRect(data, W, H, RECT.rx, RECT.ry, RECT.rw, RECT.rh, patch)
  })

  if (wasmKernels) {
    const wasm = wasmKernels
    bench('wasm: extractRect + writeRect (128x128 rect)', () => {
      const data = buf()
      const patch = wasm.extractRect(data, W, H, RECT.rx, RECT.ry, RECT.rw, RECT.rh)!
      wasm.writeRect(data, W, H, RECT.rx, RECT.ry, RECT.rw, RECT.rh, patch)
    })
  }
})

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bench, describe } from 'vitest'
import { tsKernels } from '../src-ts/ts-core'
import { makeWasmKernels } from '../src-ts/wasm-core'
import type { PixelKernels } from '../src-ts/types'

// Phase 6. Run with: pnpm run bench (requires `pnpm run build:wasm` first for
// the wasm row). Honest numbers only (orchestrator instruction) — recorded
// as-is in baseline-bench.md, whichever way the ratio lands. Same warm-pool/
// excluded-construction methodology phase 5f's flood-fill bench established
// (`flood-fill.bench.ts`'s module doc explains why): canvas CONSTRUCTION is
// built ONCE per shape, outside the timed loop, and each iteration pays only
// the one independent-copy memcpy a real caller also needs.

const here = dirname(fileURLToPath(import.meta.url))
const wasmPath = join(here, '..', 'pkg', 'pixelforge_core_bg.wasm')

let wasmKernels: PixelKernels | null = null
if (existsSync(wasmPath)) {
  const mod = await import('../pkg/pixelforge_core.js')
  mod.initSync({ module: readFileSync(wasmPath) })
  wasmKernels = makeWasmKernels(mod)
} else {
  console.warn(`[quantize.bench] ${wasmPath} not found — run "pnpm run build:wasm" first. Only the ts row will run.`)
}

const SIZE = 64 // a realistic AI-generated sprite grid size (sprite-pipeline.ts's QUANTIZE_DEFAULTS use case)
const WARMUP_ITERATIONS = 20

/** A varied 64x64 RGBA buffer (not uniform — uniform input gives k-means nothing to cluster, an unrealistic best case). */
function variedCanvas(): Uint8Array {
  const data = new Uint8Array(SIZE * SIZE * 4)
  for (let i = 0; i < SIZE * SIZE; i++) {
    const p = i * 4
    data[p] = (i * 37) % 256
    data[p + 1] = (i * 71) % 256
    data[p + 2] = (i * 113) % 256
    data[p + 3] = 255
  }
  return data
}

const sourceCanvas = variedCanvas()

function describeQuantize(colors: number): void {
  describe(`quantize — 64x64 to ${colors} colors`, () => {
    const tsScratch = new Uint8Array(sourceCanvas)
    bench(
      `ts: quantize(${colors} colors)`,
      () => {
        tsScratch.set(sourceCanvas)
        tsKernels.quantize(tsScratch, colors, true, 12, 128)
      },
      { warmupIterations: WARMUP_ITERATIONS }
    )

    if (wasmKernels) {
      const wasm = wasmKernels
      const wasmScratch = new Uint8Array(sourceCanvas)
      bench(
        `wasm: quantize(${colors} colors)`,
        () => {
          wasmScratch.set(sourceCanvas)
          wasm.quantize(wasmScratch, colors, true, 12, 128)
        },
        { warmupIterations: WARMUP_ITERATIONS }
      )
    }
  })
}

describeQuantize(16)
describeQuantize(32)

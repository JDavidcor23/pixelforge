import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bench, describe } from 'vitest'
import { tsKernels } from '../src-ts/ts-core'
import { makeWasmKernels } from '../src-ts/wasm-core'
import type { PixelKernels } from '../src-ts/types'

// Phase 6. Run with: pnpm run bench (requires `pnpm run build:wasm` first for
// the wasm row). Same warm-pool/excluded-construction methodology as
// `flood-fill.bench.ts`/`quantize.bench.ts`.

const here = dirname(fileURLToPath(import.meta.url))
const wasmPath = join(here, '..', 'pkg', 'pixelforge_core_bg.wasm')

let wasmKernels: PixelKernels | null = null
if (existsSync(wasmPath)) {
  const mod = await import('../pkg/pixelforge_core.js')
  mod.initSync({ module: readFileSync(wasmPath) })
  wasmKernels = makeWasmKernels(mod)
} else {
  console.warn(`[downscale.bench] ${wasmPath} not found — run "pnpm run build:wasm" first. Only the ts row will run.`)
}

const SRC = 512 // a realistic AI-generated source sheet resolution
const TARGET = 64 // the editor's typical sprite grid size
const WARMUP_ITERATIONS = 20

function sourceCanvas(): Uint8Array {
  const data = new Uint8Array(SRC * SRC * 4)
  for (let i = 0; i < SRC * SRC; i++) {
    const p = i * 4
    data[p] = (i * 37) % 256
    data[p + 1] = (i * 71) % 256
    data[p + 2] = (i * 113) % 256
    data[p + 3] = 255
  }
  return data
}

const source = sourceCanvas()

describe(`downscale — ${SRC}x${SRC} to ${TARGET}x${TARGET}`, () => {
  bench(
    'ts: downscale',
    () => {
      tsKernels.downscale(source, SRC, SRC, TARGET, TARGET)
    },
    { warmupIterations: WARMUP_ITERATIONS }
  )

  if (wasmKernels) {
    const wasm = wasmKernels
    bench(
      'wasm: downscale',
      () => {
        wasm.downscale(source, SRC, SRC, TARGET, TARGET)
      },
      { warmupIterations: WARMUP_ITERATIONS }
    )
  }
})

/**
 * Phase 7 task 7.7: TS vs Wasm `PixelCore` (full document/history), warm —
 * honest numbers only, recorded as-is in `openspec/changes/migrate-to-rust-
 * core/baseline-bench.md`'s "Phase 7" section regardless of which way the
 * ratio lands (same orchestrator instruction every prior phase's bench
 * followed). Run with `pnpm run bench` (requires `pnpm run build:wasm` in
 * `packages/core` first for the wasm row).
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { bench, describe } from 'vitest'
import { setWasmIdSeed, WasmPixelCore } from '@pixelforge/core'
import { createEmptyBuffer } from '../pixel-buffer'
import { packPoints, packRgba } from './color-codec'
import { TsPixelCore } from './pixel-core'
import { setIdSeed } from './ts-core'
import type { DocSnapshot } from './ts-core'

const here = dirname(fileURLToPath(import.meta.url))
const pkgDir = join(here, '..', '..', '..', '..', '..', 'packages', 'core', 'pkg')
const wasmPath = join(pkgDir, 'pixelforge_core_bg.wasm')
const wasmJsPath = join(pkgDir, 'pixelforge_core.js')
const pkgAvailable = existsSync(wasmPath)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wasmModule: any = null
if (pkgAvailable) {
  wasmModule = await import(pathToFileURL(wasmJsPath).href)
  wasmModule.initSync({ module: readFileSync(wasmPath) })
} else {
  console.warn(`[wasm-pixel-core.bench] ${wasmPath} not found — run "pnpm run build:wasm" in packages/core first. Only the ts row will run.`)
}

const SIZE = 64
const WARMUP_ITERATIONS = 50
const RED = packRgba({ r: 255, g: 0, b: 0, a: 255 })

function makeDoc(): DocSnapshot {
  const w = SIZE
  const h = SIZE
  return {
    canvasWidth: w,
    canvasHeight: h,
    timeline: {
      frames: [{ id: 'f1', layers: [{ id: 'l1', name: 'Layer 1', visible: true, locked: false, opacity: 100, pixels: createEmptyBuffer(w, h) }], activeLayerId: 'l1', durationMs: 83 }],
      currentFrameIndex: 0,
      isPlaying: false,
      fps: 12,
      loop: true,
      selectedFrameIndices: [0],
    },
  }
}

const STROKE_POINTS = packPoints(Array.from({ length: 60 }, (_, i) => ({ x: i % SIZE, y: Math.floor(i / SIZE) })))

describe('PixelCore — stroke (60-point batch: begin + points + end)', () => {
  setIdSeed('bench')
  const ts = new TsPixelCore(makeDoc())
  bench(
    'ts: stroke (60 points)',
    () => {
      ts.dispatch({ type: 'stroke.begin', layerId: 'l1' })
      ts.dispatch({ type: 'stroke.points', points: STROKE_POINTS, rgba: RED })
      ts.dispatch({ type: 'stroke.end', label: 'Draw' })
    },
    { warmupIterations: WARMUP_ITERATIONS }
  )

  if (pkgAvailable) {
    setWasmIdSeed('bench')
    const wasm = new WasmPixelCore(wasmModule, makeDoc())
    bench(
      'wasm: stroke (60 points)',
      () => {
        wasm.dispatch({ type: 'stroke.begin', layerId: 'l1' })
        wasm.dispatch({ type: 'stroke.points', points: STROKE_POINTS, rgba: RED })
        wasm.dispatch({ type: 'stroke.end', label: 'Draw' })
      },
      { warmupIterations: WARMUP_ITERATIONS }
    )
  }
})

describe('PixelCore — fill (full 64x64 canvas)', () => {
  setIdSeed('bench')
  const ts = new TsPixelCore(makeDoc())
  let tsToggle = 0
  bench(
    'ts: fill',
    () => {
      tsToggle = 1 - tsToggle
      ts.dispatch({ type: 'fill', layerId: 'l1', x: 0, y: 0, rgba: tsToggle ? RED : 0 })
    },
    { warmupIterations: WARMUP_ITERATIONS }
  )

  if (pkgAvailable) {
    setWasmIdSeed('bench')
    const wasm = new WasmPixelCore(wasmModule, makeDoc())
    let wasmToggle = 0
    bench(
      'wasm: fill',
      () => {
        wasmToggle = 1 - wasmToggle
        wasm.dispatch({ type: 'fill', layerId: 'l1', x: 0, y: 0, rgba: wasmToggle ? RED : 0 })
      },
      { warmupIterations: WARMUP_ITERATIONS }
    )
  }
})

describe('PixelCore — undo/redo pair (after a fill)', () => {
  setIdSeed('bench')
  const ts = new TsPixelCore(makeDoc())
  bench(
    'ts: fill + undo + redo',
    () => {
      ts.dispatch({ type: 'fill', layerId: 'l1', x: 0, y: 0, rgba: RED })
      ts.undo()
      ts.redo()
    },
    { warmupIterations: WARMUP_ITERATIONS }
  )

  if (pkgAvailable) {
    setWasmIdSeed('bench')
    const wasm = new WasmPixelCore(wasmModule, makeDoc())
    bench(
      'wasm: fill + undo + redo',
      () => {
        wasm.dispatch({ type: 'fill', layerId: 'l1', x: 0, y: 0, rgba: RED })
        wasm.undo()
        wasm.redo()
      },
      { warmupIterations: WARMUP_ITERATIONS }
    )
  }
})

describe('PixelCore — structural op pair (layer.add + layer.remove)', () => {
  setIdSeed('bench')
  const ts = new TsPixelCore(makeDoc())
  bench(
    'ts: layer.add + layer.remove',
    () => {
      const r = ts.dispatch({ type: 'layer.add' })
      ts.dispatch({ type: 'layer.remove', layerId: r.dirty[0]?.layerId ?? 'l1' })
    },
    { warmupIterations: WARMUP_ITERATIONS }
  )

  if (pkgAvailable) {
    setWasmIdSeed('bench')
    const wasm = new WasmPixelCore(wasmModule, makeDoc())
    bench(
      'wasm: layer.add + layer.remove',
      () => {
        const r = wasm.dispatch({ type: 'layer.add' })
        wasm.dispatch({ type: 'layer.remove', layerId: r.dirty[0]?.layerId ?? 'l1' })
      },
      { warmupIterations: WARMUP_ITERATIONS }
    )
  }
})

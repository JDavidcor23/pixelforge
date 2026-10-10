/**
 * Fix-agent 7g (store-loop performance, item 1): TS vs Wasm `PixelCore`
 * through the SAME per-dispatch loop `core.slice.ts`'s `dispatch` actually
 * runs — not just the raw `PixelCore` call `wasm-pixel-core.bench.ts`
 * measures. `storeDispatch` below mirrors that slice's real post-7g logic
 * exactly: `snapshot()` is only ever called when `DispatchResult.
 * structureChanged` is `true`; otherwise only the dirty layers' pixel bytes
 * are copied out via `readLayer`. This is the bench phase 7f's HANDOFF.md
 * flagged as the single most important remaining item (WARNING #7): prior to
 * 7g, the store called `snapshot()` unconditionally after EVERY dispatch that
 * changed anything, which for a Wasm core means crossing the FFI boundary
 * three times (`meta_doc`/`meta_layer_opacity`/`meta_layer_names`) and
 * rebuilding every frame-id lookup, on EVERY `stroke.points` call of a
 * drawing gesture — measured ~1.95x SLOWER than TS end-to-end despite faster
 * raw `PixelCore`-level ops. Honest numbers only, recorded as-is in
 * `openspec/changes/migrate-to-rust-core/baseline-bench.md`'s "Phase 7g"
 * section regardless of which way the ratio lands. Run with `pnpm run bench`
 * (requires `pnpm run build:wasm` in `packages/core` first for the wasm row)
 * — gated by `check-bench`'s second invocation against `bench/results.json`
 * and `store-loop-thresholds.json` (see root `package.json`'s `check-bench`
 * script).
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { bench, describe } from 'vitest'
import { setWasmIdSeed, WasmPixelCore } from '@pixelforge/core'
import type { DocSnapshot } from './ts-core'
import { setIdSeed } from './ts-core'
import { TsPixelCore, type PixelCore } from './pixel-core'
import { packPoints, packRgba } from './color-codec'
import { createEmptyBuffer } from '../pixel-buffer'

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
  console.warn(`[store-loop.bench] ${wasmPath} not found — run "pnpm run build:wasm" in packages/core first. Only the ts row will run.`)
}

const WARMUP_ITERATIONS = 50
const RED = packRgba({ r: 255, g: 0, b: 0, a: 255 })

function makeDoc(size: number, frames: number, layers: number): DocSnapshot {
  const w = size
  const h = size
  return {
    canvasWidth: w,
    canvasHeight: h,
    timeline: {
      frames: Array.from({ length: frames }, (_, f) => {
        const frameLayers = Array.from({ length: layers }, (_, l) => ({
          id: `l${f}_${l}`,
          name: `Layer ${l}`,
          visible: true,
          locked: false,
          opacity: 100,
          pixels: createEmptyBuffer(w, h),
        }))
        return { id: `f${f}`, layers: frameLayers, activeLayerId: frameLayers[0].id, durationMs: 83 }
      }),
      currentFrameIndex: 0,
      isPlaying: false,
      fps: 12,
      loop: true,
      selectedFrameIndices: [0],
    },
  }
}

/**
 * Mirrors `core.slice.ts`'s `dispatch` action's post-7g cache-refresh logic
 * EXACTLY (minus the zustand `set()`/`get()` plumbing, which is the same cost
 * on both cores and not what this bench is isolating): `snapshot()` only on
 * `structureChanged`, otherwise just a per-dirty-pair `readLayer` copy.
 */
function storeDispatch(c: PixelCore, cmd: Parameters<PixelCore['dispatch']>[0], cache: Map<string, Uint8ClampedArray>): void {
  const r = c.dispatch(cmd)
  if (r.changed || r.historyChanged) {
    if (r.structureChanged) c.snapshot()
    if (r.changed) {
      for (const d of r.dirty) cache.set(d.layerId, new Uint8ClampedArray(c.readLayer(d.frameId, d.layerId)))
    }
  }
}

const STROKE_POINTS = packPoints(Array.from({ length: 4 }, (_, i) => ({ x: i, y: i })))

const SCENARIOS = [
  { size: 64, frames: 1, layers: 1 },
  { size: 256, frames: 8, layers: 8 },
] as const

for (const { size, frames, layers } of SCENARIOS) {
  describe(`store-loop stroke gesture (begin + 20x4pt points + end) ${size}px ${frames}f x ${layers}l`, () => {
    setIdSeed('bench')
    const tsCache = new Map<string, Uint8ClampedArray>()
    const ts = new TsPixelCore(makeDoc(size, frames, layers))
    bench(
      'ts: stroke gesture through store loop',
      () => {
        storeDispatch(ts, { type: 'stroke.begin', layerId: 'l0_0' }, tsCache)
        for (let k = 0; k < 20; k++) storeDispatch(ts, { type: 'stroke.points', points: STROKE_POINTS, rgba: RED + k }, tsCache)
        storeDispatch(ts, { type: 'stroke.end', label: 'Draw' }, tsCache)
      },
      { warmupIterations: WARMUP_ITERATIONS }
    )

    if (pkgAvailable) {
      setWasmIdSeed('bench')
      const wasmCache = new Map<string, Uint8ClampedArray>()
      const wasm = new WasmPixelCore(wasmModule, makeDoc(size, frames, layers)) as unknown as PixelCore
      bench(
        'wasm: stroke gesture through store loop',
        () => {
          storeDispatch(wasm, { type: 'stroke.begin', layerId: 'l0_0' }, wasmCache)
          for (let k = 0; k < 20; k++) storeDispatch(wasm, { type: 'stroke.points', points: STROKE_POINTS, rgba: RED + k }, wasmCache)
          storeDispatch(wasm, { type: 'stroke.end', label: 'Draw' }, wasmCache)
        },
        { warmupIterations: WARMUP_ITERATIONS }
      )
    }
  })
}

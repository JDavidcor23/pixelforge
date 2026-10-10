/**
 * Phase 7 parity gate: a differential fuzz comparing `TsPixelCore`
 * (`pixel-core.ts`) against `WasmPixelCore` (`@pixelforge/core`) — the SAME
 * random command sequence, dispatched on both, must produce IDENTICAL
 * `DispatchResult` fields (dirty pairs, evicted, revisions, canUndo/canRedo)
 * and byte-identical `exportDocument()` output, including minted ids (same
 * seed on both — `setIdSeed`/`setWasmIdSeed`).
 *
 * This is the one place both cores exist side by side (`@pixelforge/core`
 * does not, and must not, depend on `apps/editor` — see `document-types.ts`'s
 * module doc in that package).
 *
 * Deterministic LCG (same style as `packages/core/src-ts/
 * quantize-downscale.fuzz.test.ts`) — reproducible failures, no flakiness.
 *
 * Skips gracefully (loud console.warn, suite still "passes") if `packages/
 * core/pkg/` hasn't been built yet (`pnpm run build:wasm`), same convention
 * `pixel-parity.test.ts` uses.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { setWasmIdSeed, WasmPixelCore } from '@pixelforge/core'
import { createEmptyBuffer } from '../pixel-buffer'
import type { Command } from './commands'
import { TsPixelCore, type PixelCore } from './pixel-core'
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
  console.warn(`[wasm-pixel-core.differential.fuzz] ${wasmPath} not found — run "pnpm run build:wasm" in packages/core first. Skipping this suite.`)
}

// ── Deterministic LCG ────────────────────────────────────────────────────
function makeRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0xffffffff
  }
}
function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length]
}
function int(rng: () => number, max: number): number {
  return Math.floor(rng() * max)
}

function makeDoc(w: number, h: number): DocSnapshot {
  return {
    canvasWidth: w,
    canvasHeight: h,
    timeline: {
      frames: [{ id: 'seed-f1', layers: [{ id: 'seed-l1', name: 'Layer 1', visible: true, locked: false, opacity: 100, pixels: createEmptyBuffer(w, h) }], activeLayerId: 'seed-l1', durationMs: 83 }],
      currentFrameIndex: 0,
      isPlaying: false,
      fps: 12,
      loop: true,
      selectedFrameIndices: [0],
    },
  }
}

function rgba(rng: () => number): number {
  return ((int(rng, 256) << 24) | (int(rng, 256) << 16) | (int(rng, 256) << 8) | int(rng, 256)) >>> 0
}

/** Builds ONE random command using the TS core's CURRENT state as the oracle for valid ids/canvas size (both cores are fed the identical command object, so this never needs to ask the Wasm core anything). */
function randomCommand(rng: () => number, ts: TsPixelCore, strokeOpen: boolean): Command {
  const snap = ts.snapshot()
  const w = snap.canvasWidth
  const h = snap.canvasHeight
  const frame = snap.timeline.frames[snap.timeline.currentFrameIndex]
  const layers = frame.layers
  const layerId = pick(rng, layers).id

  const pool: Array<() => Command> = [
    () => (strokeOpen ? { type: 'stroke.points', points: Int32Array.from([int(rng, w), int(rng, h), int(rng, w), int(rng, h)]), rgba: rgba(rng) } : { type: 'stroke.begin', layerId }),
    () => (strokeOpen ? { type: 'stroke.end', label: 'Draw' } : { type: 'stroke.begin', layerId }),
    () => ({ type: 'fill', layerId, x: int(rng, w), y: int(rng, h), rgba: rgba(rng) }),
    () => ({ type: 'region.clear', layerId, rect: { x: int(rng, w), y: int(rng, h), w: int(rng, w) + 1, h: int(rng, h) + 1 } }),
    () => {
      const rw = int(rng, w) + 1
      const rh = int(rng, h) + 1
      const rx = int(rng, Math.max(1, w - rw + 1))
      const ry = int(rng, Math.max(1, h - rh + 1))
      return { type: 'selection.commit', layerId, at: { x: rx, y: ry, w: rw, h: rh }, pixels: new Uint8ClampedArray(rw * rh * 4).map(() => int(rng, 256)) }
    },
    () => ({ type: 'layer.add' }),
    () => ({ type: 'layer.remove', layerId }),
    () => ({ type: 'layer.meta', layerId, patch: { visible: rng() > 0.5, locked: rng() > 0.5, opacity: int(rng, 101) } }),
    () => ({ type: 'layer.reorder', from: int(rng, layers.length), to: int(rng, layers.length) }),
    () => ({ type: 'layer.setActive', layerId }),
    () => ({ type: 'frame.add' }),
    () => ({ type: 'frame.remove', index: int(rng, snap.timeline.frames.length) }),
    () => ({ type: 'frame.select', index: int(rng, snap.timeline.frames.length) }),
    () => ({ type: 'frame.paste', at: int(rng, snap.timeline.frames.length + 1), frames: [{ durationMs: 50, layers: [{ name: 'Pasted', visible: true, locked: false, opacity: 100, w, h, data: new Uint8Array(w * h * 4).map(() => int(rng, 256)) }] }] }),
    () => ({
      type: 'doc.replace',
      canvasWidth: w,
      canvasHeight: h,
      frames: [{ pixels: { w, h, data: new Uint8ClampedArray(w * h * 4).map(() => int(rng, 256)) } }],
      frameDurationMs: 80,
      label: 'Import',
    }),
    () => ({ type: 'undo' }),
    () => ({ type: 'redo' }),
    () => ({ type: 'timeline.setFps', fps: int(rng, 60) + 1 }),
    () => ({ type: 'timeline.toggleLoop' }),
    () => ({ type: 'timeline.setFrameSelection', indices: [int(rng, snap.timeline.frames.length)] }),
    () => ({ type: 'timeline.togglePlayback' }),
  ]
  return pick(rng, pool)()
}

function assertResultsMatch(seed: number, step: number, cmd: Command, ts: ReturnType<PixelCore['dispatch']>, wasm: ReturnType<PixelCore['dispatch']>): void {
  const ctx = `seed=${seed} step=${step} cmd=${cmd.type}`
  expect(wasm.changed, ctx).toBe(ts.changed)
  expect(wasm.contentChanged, ctx).toBe(ts.contentChanged)
  expect(wasm.historyChanged, ctx).toBe(ts.historyChanged)
  expect(wasm.canUndo, ctx).toBe(ts.canUndo)
  expect(wasm.canRedo, ctx).toBe(ts.canRedo)
  expect(wasm.strokeOpen, ctx).toBe(ts.strokeOpen)
  expect(wasm.dirty, ctx).toEqual(ts.dirty)
  expect(wasm.evicted, ctx).toEqual(ts.evicted)
  expect(wasm.layerRevisions, ctx).toEqual(ts.layerRevisions)
}

const SEEDS = pkgAvailable ? 300 : 0
const STEPS = 60

describe.runIf(pkgAvailable)('WasmPixelCore vs TsPixelCore (differential fuzz)', () => {
  it(`produces identical DispatchResult fields and exportDocument() across ${SEEDS} seeds x ${STEPS} steps`, () => {
    for (let seed = 0; seed < SEEDS; seed++) {
      const rng = makeRng(seed + 1)
      const initW = 2 + int(rng, 3)
      const initH = 2 + int(rng, 3)

      setIdSeed('fuzz')
      const ts = new TsPixelCore(makeDoc(initW, initH))
      setWasmIdSeed('fuzz')
      const wasm = new WasmPixelCore(wasmModule, makeDoc(initW, initH))

      let strokeOpen = false
      for (let step = 0; step < STEPS; step++) {
        const cmd = randomCommand(rng, ts, strokeOpen)
        const tsResult = ts.dispatch(cmd)
        const wasmResult = wasm.dispatch(cmd)
        assertResultsMatch(seed, step, cmd, tsResult, wasmResult)
        strokeOpen = tsResult.strokeOpen

        if (step % 7 === 0) {
          const tsExport = ts.exportDocument()
          const wasmExport = wasm.exportDocument()
          expect(wasmExport.w, `seed=${seed} step=${step} export.w`).toBe(tsExport.w)
          expect(wasmExport.h, `seed=${seed} step=${step} export.h`).toBe(tsExport.h)
          expect(wasmExport.frames.length, `seed=${seed} step=${step} export.frames.length`).toBe(tsExport.frames.length)
          for (let f = 0; f < tsExport.frames.length; f++) {
            expect(wasmExport.frames[f].id, `seed=${seed} step=${step} frame[${f}].id`).toBe(tsExport.frames[f].id)
            expect(wasmExport.frames[f].activeLayerId, `seed=${seed} step=${step} frame[${f}].activeLayerId`).toBe(tsExport.frames[f].activeLayerId)
            expect(wasmExport.frames[f].layers.length, `seed=${seed} step=${step} frame[${f}].layers.length`).toBe(tsExport.frames[f].layers.length)
            for (let l = 0; l < tsExport.frames[f].layers.length; l++) {
              expect(wasmExport.frames[f].layers[l].id, `seed=${seed} step=${step} frame[${f}].layer[${l}].id`).toBe(tsExport.frames[f].layers[l].id)
              expect(Array.from(wasmExport.frames[f].layers[l].data), `seed=${seed} step=${step} frame[${f}].layer[${l}].data`).toEqual(Array.from(tsExport.frames[f].layers[l].data))
            }
          }
        }
      }
    }
  })
})

describe('WasmPixelCore vs TsPixelCore (skip notice)', () => {
  it('warns when pkg/ is not built', () => {
    if (!pkgAvailable) console.warn('[wasm-pixel-core.differential.fuzz] wasm pkg/ not built — this suite did not run.')
    expect(true).toBe(true)
  })
})

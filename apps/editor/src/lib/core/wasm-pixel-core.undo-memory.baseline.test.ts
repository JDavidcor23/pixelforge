/**
 * Phase 7 task 7.7: re-verifies the edit-history spec's "Bounded Undo
 * Memory" budget (<1KB for a single-pixel stroke) on the WASM path, mirroring
 * `apps/editor/src/lib/history.undo-memory.baseline.test.ts`'s exact
 * reference scenario (64x64 canvas, 8 frames, 4 layers each) so the two
 * numbers are directly comparable. Skips gracefully if `packages/core/pkg/`
 * hasn't been built (same convention every other Wasm-dependent suite here
 * uses).
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { setWasmIdSeed, WasmPixelCore } from '@pixelforge/core'
import { createEmptyBuffer } from '../pixel-buffer'
import { packPoints, packRgba } from './color-codec'
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
  console.warn(`[wasm-pixel-core.undo-memory.baseline] ${wasmPath} not found — run "pnpm run build:wasm" in packages/core first. Skipping this suite.`)
}

const CANVAS_SIZE = 64
const FRAME_COUNT = 8
const LAYER_COUNT = 4
const RED = { r: 255, g: 0, b: 0, a: 255 }

function makeDoc(): DocSnapshot {
  const frames = Array.from({ length: FRAME_COUNT }, (_, i) => {
    const layers = Array.from({ length: LAYER_COUNT }, (_, j) => ({
      id: `f${i}-l${j}`,
      name: `Layer ${j}`,
      visible: true,
      locked: false,
      opacity: 100,
      pixels: createEmptyBuffer(CANVAS_SIZE, CANVAS_SIZE),
    }))
    return { id: `frame-${i}`, layers, activeLayerId: layers[0].id, durationMs: 83 }
  })
  return {
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    timeline: { frames, currentFrameIndex: 0, isPlaying: false, fps: 12, loop: true, selectedFrameIndices: [0] },
  }
}

describe.runIf(pkgAvailable)('undo memory — WasmPixelCore (reference scenario, mirrors the TsPixelCore baseline)', () => {
  it('a single-pixel stroke on 64x64/8-frame/4-layer retains far under 1KB', () => {
    setWasmIdSeed('undomem')
    const core = new WasmPixelCore(wasmModule, makeDoc())
    const layerId = 'f0-l0'

    core.dispatch({ type: 'stroke.begin', layerId })
    core.dispatch({ type: 'stroke.points', points: packPoints([{ x: 10, y: 20 }]), rgba: packRgba(RED) })
    core.dispatch({ type: 'stroke.end', label: '1px stroke' })

    expect(core.canUndo).toBe(true)
    const retainedBytes = core.historyBytes()

    // Same shape as the TS reference: ONE dirty-rect patch, a single pixel ->
    // 4 bytes `before` + 4 bytes `after` = 8 bytes, regardless of
    // frame/layer count.
    expect(retainedBytes).toBe(8)
    expect(retainedBytes).toBeLessThan(1024)
  })
})

describe('undo memory — WasmPixelCore (skip notice)', () => {
  it('warns when pkg/ is not built', () => {
    if (!pkgAvailable) console.warn('[wasm-pixel-core.undo-memory.baseline] wasm pkg/ not built — this suite did not run.')
    expect(true).toBe(true)
  })
})

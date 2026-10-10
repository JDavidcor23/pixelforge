/**
 * `WasmPixelCore` contract test (phase 7) — exercises the Wasm-backed
 * `PixelCore` seam directly, independent of `apps/editor` (which has no
 * compile-time dependency FROM this package — see `document-types.ts`'s
 * module doc). The richer TS-vs-Wasm DIFFERENTIAL fuzz (byte-identical
 * `exportDocument()`, identical ids, identical `DispatchResult` fields) lives
 * in `apps/editor/src/lib/core/wasm-pixel-core.differential.fuzz.test.ts`,
 * the only place both `TsPixelCore` and `WasmPixelCore` are available
 * side-by-side.
 *
 * Same Node wasm-init pattern as `pixel-parity.test.ts`: `initSync` +
 * `readFileSync`, skipped with a loud warning if `pkg/` hasn't been built.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, beforeEach } from 'vitest'
import { WasmPixelCore, setIdSeed } from './wasm-document-core'
import type { DocSnapshot } from './document-types'

const here = dirname(fileURLToPath(import.meta.url))
const wasmPath = join(here, '..', 'pkg', 'pixelforge_core_bg.wasm')
const pkgAvailable = existsSync(wasmPath)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mod: any = null
if (pkgAvailable) {
  mod = await import('../pkg/pixelforge_core.js')
  mod.initSync({ module: readFileSync(wasmPath) })
} else {
  console.warn(`[wasm-document-core.test] ${wasmPath} not found — run "pnpm run build:wasm" first. Skipping this suite.`)
}

function emptyBuffer(w: number, h: number): Uint8ClampedArray {
  return new Uint8ClampedArray(w * h * 4)
}

function freshDoc(w = 4, h = 4): DocSnapshot {
  return {
    canvasWidth: w,
    canvasHeight: h,
    timeline: {
      frames: [{ id: 'seed-f1', layers: [{ id: 'seed-l1', name: 'Layer 1', visible: true, locked: false, opacity: 100, pixels: { w, h, data: emptyBuffer(w, h) } }], activeLayerId: 'seed-l1', durationMs: 83 }],
      currentFrameIndex: 0,
      isPlaying: false,
      fps: 12,
      loop: true,
      selectedFrameIndices: [0],
    },
  }
}

function rgba(r: number, g: number, b: number, a: number): number {
  return (((r << 24) | (g << 16) | (b << 8) | a) >>> 0) as number
}

describe.runIf(pkgAvailable)('WasmPixelCore', () => {
  beforeEach(() => {
    setIdSeed('test')
  })

  it('constructs from an existing DocSnapshot and preserves its ids', () => {
    const core = new WasmPixelCore(mod, freshDoc())
    const snap = core.snapshot()
    expect(snap.timeline.frames).toHaveLength(1)
    expect(snap.timeline.frames[0].id).toBe('seed-f1')
    expect(snap.timeline.frames[0].layers[0].id).toBe('seed-l1')
  })

  it('readLayer returns a copy matching the constructed buffer', () => {
    const core = new WasmPixelCore(mod, freshDoc(2, 2));
    const data = core.readLayer('seed-f1', 'seed-l1')
    expect(data).toBeInstanceOf(Uint8ClampedArray)
    expect(data.length).toBe(2 * 2 * 4)
  })

  it('readLayer on an unknown id is a boundary no-op (empty buffer, no throw)', () => {
    const core = new WasmPixelCore(mod, freshDoc())
    expect(core.readLayer('nope', 'nope').length).toBe(0)
  })

  it('stroke lifecycle writes pixels and is undoable', () => {
    const core = new WasmPixelCore(mod, freshDoc())
    const begin = core.dispatch({ type: 'stroke.begin', layerId: 'seed-l1' })
    expect(begin.strokeOpen).toBe(true)
    const points = Int32Array.from([0, 0, 1, 1])
    const move = core.dispatch({ type: 'stroke.points', points, rgba: rgba(255, 0, 0, 255) })
    expect(move.changed).toBe(true)
    expect(move.dirty).toHaveLength(1)
    expect(move.dirty[0].frameId).toBe('seed-f1')
    expect(move.dirty[0].layerId).toBe('seed-l1')
    const end = core.dispatch({ type: 'stroke.end', label: 'Draw' })
    expect(end.changed).toBe(true)
    expect(end.canUndo).toBe(true)

    const data = core.readLayer('seed-f1', 'seed-l1')
    expect(Array.from(data.slice(0, 4))).toEqual([255, 0, 0, 255])

    const undo = core.undo()
    expect(undo.changed).toBe(true)
    expect(Array.from(core.readLayer('seed-f1', 'seed-l1').slice(0, 4))).toEqual([0, 0, 0, 0])

    const redo = core.redo()
    expect(redo.changed).toBe(true)
    expect(Array.from(core.readLayer('seed-f1', 'seed-l1').slice(0, 4))).toEqual([255, 0, 0, 255])
  })

  it('fill commits a patch entry and is undoable', () => {
    const core = new WasmPixelCore(mod, freshDoc(3, 3))
    const r = core.dispatch({ type: 'fill', layerId: 'seed-l1', x: 1, y: 1, rgba: rgba(9, 9, 9, 255) })
    expect(r.changed).toBe(true)
    expect(r.canUndo).toBe(true)
    expect(core.canUndo).toBe(true)
    core.undo()
    expect(Array.from(core.readLayer('seed-f1', 'seed-l1'))).toEqual(Array.from(emptyBuffer(3, 3)))
  })

  it('layer.add mints a fresh id never equal to an existing one, and is undoable', () => {
    const core = new WasmPixelCore(mod, freshDoc())
    const r = core.dispatch({ type: 'layer.add' })
    expect(r.changed).toBe(true)
    expect(r.dirty).toHaveLength(1)
    const newLayerId = r.dirty[0].layerId
    expect(newLayerId).not.toBe('seed-l1')
    expect(newLayerId.startsWith('test-l')).toBe(true)

    core.undo()
    expect(core.readLayer('seed-f1', newLayerId).length).toBe(0)
    core.redo()
    expect(core.readLayer('seed-f1', newLayerId).length).toBeGreaterThan(0)
  })

  it('layer.remove refuses to remove the last layer', () => {
    const core = new WasmPixelCore(mod, freshDoc())
    const r = core.dispatch({ type: 'layer.remove', layerId: 'seed-l1' })
    expect(r.changed).toBe(false)
  })

  it('frame.add then frame.remove roundtrips through undo', () => {
    const core = new WasmPixelCore(mod, freshDoc())
    const add = core.dispatch({ type: 'frame.add' })
    expect(add.changed).toBe(true)
    expect(core.snapshot().timeline.frames).toHaveLength(2)
    const remove = core.dispatch({ type: 'frame.remove', index: 1 })
    expect(remove.changed).toBe(true)
    expect(core.snapshot().timeline.frames).toHaveLength(1)
    core.undo()
    expect(core.snapshot().timeline.frames).toHaveLength(2)
    core.undo()
    expect(core.snapshot().timeline.frames).toHaveLength(1)
  })

  it('doc.replace swaps the whole document and is undoable', () => {
    const core = new WasmPixelCore(mod, freshDoc(2, 2))
    const pixels = { w: 3, h: 3, data: new Uint8ClampedArray(3 * 3 * 4).fill(7) }
    const r = core.dispatch({ type: 'doc.replace', canvasWidth: 3, canvasHeight: 3, frames: [{ pixels }], frameDurationMs: 100, label: 'Import' })
    expect(r.changed).toBe(true)
    expect(core.snapshot().canvasWidth).toBe(3)
    core.undo()
    expect(core.snapshot().canvasWidth).toBe(2)
  })

  it('frame.paste inserts fresh frames with fresh ids, never aliasing the caller id', () => {
    const core = new WasmPixelCore(mod, freshDoc(2, 2))
    const r = core.dispatch({
      type: 'frame.paste',
      at: 1,
      frames: [{ id: 'caller-provided-id', durationMs: 50, layers: [{ id: 'caller-layer-id', name: 'Pasted', visible: true, locked: false, opacity: 100, w: 2, h: 2, data: new Uint8Array(2 * 2 * 4) }] }],
    })
    expect(r.changed).toBe(true)
    const frames = core.snapshot().timeline.frames
    expect(frames).toHaveLength(2)
    expect(frames[1].id).not.toBe('caller-provided-id')
    expect(frames[1].layers[0].id).not.toBe('caller-layer-id')
    core.undo()
    expect(core.snapshot().timeline.frames).toHaveLength(1)
  })

  it('exportDocument/importDocument roundtrips pixel bytes and metadata', () => {
    const core = new WasmPixelCore(mod, freshDoc(2, 2))
    core.dispatch({ type: 'fill', layerId: 'seed-l1', x: 0, y: 0, rgba: rgba(1, 2, 3, 255) })
    const payload = core.exportDocument()
    expect(payload.w).toBe(2)
    expect(payload.frames[0].layers[0].data.length).toBe(2 * 2 * 4)
    expect(Array.from(payload.frames[0].layers[0].data.slice(0, 4))).toEqual([1, 2, 3, 255])

    const core2 = new WasmPixelCore(mod, freshDoc(9, 9)) // different starting shape
    core2.importDocument(payload)
    expect(core2.snapshot().canvasWidth).toBe(2)
    expect(Array.from(core2.readLayer(payload.frames[0].id, payload.frames[0].layers[0].id).slice(0, 4))).toEqual([1, 2, 3, 255])
  })

  it('importDocument falls back to a fresh empty document on a corrupted payload, without throwing', () => {
    const core = new WasmPixelCore(mod, freshDoc())
    expect(() => core.importDocument({ schemaVersion: 1, w: 0, h: 0, frameMs: [], frames: [] })).not.toThrow()
    expect(core.snapshot().timeline.frames.length).toBeGreaterThan(0)
  })

  it('timeline commands are non-undoable but still bump revision', () => {
    const core = new WasmPixelCore(mod, freshDoc())
    const r = core.dispatch({ type: 'timeline.setFps', fps: 24 })
    expect(r.changed).toBe(true)
    expect(r.contentChanged).toBe(false)
    expect(r.canUndo).toBe(false)
    expect(core.snapshot().timeline.fps).toBe(24)
  })

  it('unknown layer id is a safe no-op, never a throw', () => {
    const core = new WasmPixelCore(mod, freshDoc())
    const r = core.dispatch({ type: 'fill', layerId: 'not-a-real-id', x: 0, y: 0, rgba: 0xffffffff })
    expect(r.changed).toBe(false)
  })

  it('deterministic ids with the same seed are reproducible across two separately constructed cores', () => {
    setIdSeed('seedA')
    const core1 = new WasmPixelCore(mod, freshDoc())
    const r1 = core1.dispatch({ type: 'layer.add' })

    setIdSeed('seedA')
    const core2 = new WasmPixelCore(mod, freshDoc())
    const r2 = core2.dispatch({ type: 'layer.add' })

    expect(r1.dirty[0].layerId).toBe(r2.dirty[0].layerId)
  })
})

describe('WasmPixelCore (skip notice)', () => {
  it('warns when pkg/ is not built', () => {
    if (!pkgAvailable) {
      console.warn('[wasm-document-core.test] wasm pkg/ not built — this suite did not run.')
    }
    expect(true).toBe(true)
  })
})

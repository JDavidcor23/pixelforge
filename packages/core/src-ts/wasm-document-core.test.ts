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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wasmExports: any = null
if (pkgAvailable) {
  mod = await import('../pkg/pixelforge_core.js')
  wasmExports = mod.initSync({ module: readFileSync(wasmPath) })
} else {
  console.warn(`[wasm-document-core.test] ${wasmPath} not found — run "pnpm run build:wasm" first. Skipping this suite.`)
}

function emptyBuffer(w: number, h: number): Uint8ClampedArray {
  return new Uint8ClampedArray(w * h * 4)
}

/** `DocumentLayerPayload.data` is `Uint8Array` (unlike `DocSnapshot`'s `Uint8ClampedArray` pixels) — a distinct helper for `importDocument`-payload test literals. */
function emptyPayloadLayerData(w: number, h: number): Uint8Array {
  return new Uint8Array(w * h * 4)
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

describe.runIf(pkgAvailable)('WasmPixelCore — layer names surviving the wire boundary (fix-agent 7g, item 2, WARNING #3)', () => {
  it('a name containing a literal NUL character round-trips through layer.meta/exportDocument/importDocument without corrupting ANY other layer\'s name', () => {
    // Reproduces judges' `nul.jb.test.ts` (scratchpad `judgeB7`): the OLD
    // `\u0000`-joined wire format desynced every name reported AFTER one
    // containing a literal NUL — confirmed (before this fix) layer B's name
    // was reported as "y" (stolen from the back half of A's corrupted name)
    // and layer C's name vanished from the array entirely. The length-
    // prefixed encoding this test guards has no separator to desync.
    const doc: DocSnapshot = {
      canvasWidth: 1,
      canvasHeight: 1,
      timeline: {
        frames: [
          {
            id: 'F',
            activeLayerId: 'A',
            durationMs: 83,
            layers: [
              { id: 'A', name: 'A', visible: true, locked: false, opacity: 100, pixels: { w: 1, h: 1, data: emptyBuffer(1, 1) } },
              { id: 'B', name: 'B', visible: true, locked: false, opacity: 100, pixels: { w: 1, h: 1, data: emptyBuffer(1, 1) } },
              { id: 'C', name: 'C', visible: true, locked: false, opacity: 100, pixels: { w: 1, h: 1, data: emptyBuffer(1, 1) } },
            ],
          },
        ],
        currentFrameIndex: 0,
        isPlaying: false,
        fps: 12,
        loop: true,
        selectedFrameIndices: [0],
      },
    }
    const core = new WasmPixelCore(mod, doc)
    core.dispatch({ type: 'layer.meta', layerId: 'A', patch: { name: 'x\u0000y' } })

    const namesAfterMeta = core.snapshot().timeline.frames[0].layers.map((l) => l.name)
    expect(namesAfterMeta).toEqual(['x\u0000y', 'B', 'C'])

    const exported = core.exportDocument()
    expect(exported.frames[0].layers.map((l) => l.name)).toEqual(['x\u0000y', 'B', 'C'])

    core.importDocument(exported)
    expect(core.snapshot().timeline.frames[0].layers.map((l) => l.name)).toEqual(['x\u0000y', 'B', 'C'])
  })
})

describe.runIf(pkgAvailable)('WasmPixelCore — importDocument robustness parity with TsPixelCore (fix-agent 7g, item 2, WARNING #3)', () => {
  function baseDoc(): DocSnapshot {
    return freshDoc(2, 2)
  }

  it('a frameMs array shorter than the frame count falls back to the default duration per missing frame, instead of rejecting the whole import', () => {
    const core = new WasmPixelCore(mod, baseDoc())
    const payload = {
      schemaVersion: 1,
      w: 2,
      h: 2,
      frameMs: [100], // only 1 entry for 2 frames
      frames: [
        { id: 'F1', activeLayerId: 'A', layers: [{ id: 'A', name: 'A', visible: true, locked: false, opacity: 100, data: emptyPayloadLayerData(2, 2) }] },
        { id: 'F2', activeLayerId: 'B', layers: [{ id: 'B', name: 'B', visible: true, locked: false, opacity: 100, data: emptyPayloadLayerData(2, 2) }] },
      ],
    }
    expect(() => core.importDocument(payload)).not.toThrow()
    const snap = core.snapshot()
    expect(snap.timeline.frames).toHaveLength(2)
    expect(snap.timeline.frames[0].durationMs).toBe(100)
    expect(snap.timeline.frames[1].durationMs).toBe(83) // DEFAULT_FRAME_DURATION_MS fallback, mirrors TsPixelCore's payloadToDoc
  })

  it('a missing frameMs field falls back to the default duration for every frame', () => {
    const core = new WasmPixelCore(mod, baseDoc())
    const payload = {
      schemaVersion: 1,
      w: 2,
      h: 2,
      frames: [{ id: 'F1', activeLayerId: 'A', layers: [{ id: 'A', name: 'A', visible: true, locked: false, opacity: 100, data: emptyPayloadLayerData(2, 2) }] }],
      // frameMs intentionally omitted
    } as unknown as Parameters<WasmPixelCore['importDocument']>[0]
    expect(() => core.importDocument(payload)).not.toThrow()
    expect(core.snapshot().timeline.frames[0].durationMs).toBe(83)
  })

  it('a duplicate layer id reused across two different frames is repaired (the second occurrence gets a fresh id), never silently aliased', () => {
    const core = new WasmPixelCore(mod, baseDoc())
    const payload = {
      schemaVersion: 1,
      w: 2,
      h: 2,
      frameMs: [100, 100],
      frames: [
        { id: 'F1', activeLayerId: 'DUP', layers: [{ id: 'DUP', name: 'A', visible: true, locked: false, opacity: 100, data: emptyPayloadLayerData(2, 2) }] },
        { id: 'F2', activeLayerId: 'DUP', layers: [{ id: 'DUP', name: 'B', visible: true, locked: false, opacity: 100, data: emptyPayloadLayerData(2, 2) }] },
      ],
    }
    expect(() => core.importDocument(payload)).not.toThrow()
    const snap = core.snapshot()
    const idF1 = snap.timeline.frames[0].layers[0].id
    const idF2 = snap.timeline.frames[1].layers[0].id
    expect(idF1).toBe('DUP')
    expect(idF2).not.toBe('DUP') // repaired to a fresh id
    expect(idF2).not.toBe(idF1)
  })

  it('a duplicate frame id is repaired (the second occurrence gets a fresh id)', () => {
    const core = new WasmPixelCore(mod, baseDoc())
    const payload = {
      schemaVersion: 1,
      w: 2,
      h: 2,
      frameMs: [100, 100],
      frames: [
        { id: 'DUP', activeLayerId: 'A', layers: [{ id: 'A', name: 'A', visible: true, locked: false, opacity: 100, data: emptyPayloadLayerData(2, 2) }] },
        { id: 'DUP', activeLayerId: 'B', layers: [{ id: 'B', name: 'B', visible: true, locked: false, opacity: 100, data: emptyPayloadLayerData(2, 2) }] },
      ],
    }
    expect(() => core.importDocument(payload)).not.toThrow()
    const snap = core.snapshot()
    expect(snap.timeline.frames[0].id).toBe('DUP')
    expect(snap.timeline.frames[1].id).not.toBe('DUP')
  })

  it('a frame with every layer byte-length-mismatched gets ONE synthesized fallback layer instead of rejecting the whole import', () => {
    const core = new WasmPixelCore(mod, baseDoc())
    const payload = {
      schemaVersion: 1,
      w: 2,
      h: 2,
      frameMs: [100],
      frames: [{ id: 'F1', activeLayerId: 'A', layers: [{ id: 'A', name: 'A', visible: true, locked: false, opacity: 100, data: new Uint8Array(5) /* wrong length */ }] }],
    }
    expect(() => core.importDocument(payload)).not.toThrow()
    const snap = core.snapshot()
    expect(snap.timeline.frames).toHaveLength(1)
    expect(snap.timeline.frames[0].layers).toHaveLength(1)
    expect(core.readLayer('F1', snap.timeline.frames[0].layers[0].id).length).toBe(2 * 2 * 4)
  })
})

describe.runIf(pkgAvailable)('WasmPixelCore memory — importDocument frees the PREVIOUS WasmDocument (phase 7f WARNING #6)', () => {
  it('repeated importDocument on the SAME instance does not grow Wasm linear memory without bound', () => {
    // Reproduces judges' `mem.jb.test.ts` (scratchpad `judgeB7`), which found
    // 300 sequential `importDocument` calls of a ~1MB document on the SAME
    // `WasmPixelCore` grew `memory.buffer.byteLength` by ~1MB EACH call
    // (300MB+ for 300 calls) — before this fix, the OLD `WasmDocument` was
    // simply dropped by reference, relying entirely on wasm-bindgen's
    // `FinalizationRegistry` (not deterministic, and in a tight synchronous
    // loop with no `await`, V8 gets no chance to run it at all).
    const pageSize = 65536
    const w = 256
    const h = 256
    const docBytes = w * h * 4 // ~256KB per layer
    function bigPayload() {
      return {
        schemaVersion: 1,
        w,
        h,
        frameMs: [83],
        frames: [{ id: 'f0', activeLayerId: 'l0', layers: [{ id: 'l0', name: 'a', visible: true, locked: false, opacity: 100, data: new Uint8Array(docBytes) }] }],
      }
    }

    const core = new WasmPixelCore(mod, freshDoc(w, h))
    const startPages = wasmExports.memory.buffer.byteLength / pageSize

    const N = 80
    for (let i = 0; i < N; i++) core.importDocument(bigPayload())

    const endPages = wasmExports.memory.buffer.byteLength / pageSize
    const grownBytes = (endPages - startPages) * pageSize

    // A bound, not zero: Wasm memory only grows in whole 64KB pages and never
    // shrinks (no `memory.grow` reversal in wasm), so some residual growth
    // from allocator fragmentation across 80 calls is expected. The DEFECT
    // this guards against is LINEAR growth proportional to `N * docBytes`
    // (~20MB for 80 calls at this size, confirmed reproducible before this
    // fix) — bounding at 4x ONE document's size catches that class of bug
    // while tolerating normal allocator overhead.
    expect(grownBytes).toBeLessThan(docBytes * 4)
  })

  it('repeated doc.replace DISPATCHES on the SAME instance PLATEAU instead of growing linearly forever (fix-agent 7g, item 5)', () => {
    // Unlike `importDocument` (which replaces `this.doc` with a brand-new
    // `WasmDocument` instance), `doc.replace` mutates the SAME `Document`
    // struct in place (`document.rs`'s `doc_replace` reassigns `self.frames`
    // etc.) — no new `WasmDocument` is ever allocated, so there is no
    // "previous instance" to `.free()` here; Rust's own `Drop` reclaims the
    // OLD `Vec<Frame>` the instant `self.frames = new_frames` runs. BUT
    // `doc.replace` IS undoable (`HistoryEntry::DocReplace` retains a FULL
    // before/after snapshot of the whole document for undo), so memory DOES
    // legitimately grow for a while — that is the documented "Bounded
    // History Retention" budget working as designed (`history.rs`'s
    // `HISTORY_MAX_BYTES` eviction), not a leak. The real invariant this
    // test checks: growth PLATEAUS once that budget is hit (every new entry
    // evicts an old one of comparable size) — a genuine per-call leak would
    // keep growing at the SAME rate indefinitely instead.
    const pageSize = 65536
    const w = 256
    const h = 256
    const docBytes = w * h * 4
    const core = new WasmPixelCore(mod, freshDoc(w, h))
    const pagesAt = (): number => wasmExports.memory.buffer.byteLength / pageSize
    const replaceOnce = (): void => {
      core.dispatch({ type: 'doc.replace', canvasWidth: w, canvasHeight: h, frames: [{ pixels: { w, h, data: new Uint8ClampedArray(docBytes) } }], frameDurationMs: 83, label: 'Import' })
    }

    const startPages = pagesAt()
    const N = 80
    for (let i = 0; i < N; i++) replaceOnce()
    const midPages = pagesAt()
    for (let i = 0; i < N; i++) replaceOnce()
    const endPages = pagesAt()

    const firstHalfGrowth = (midPages - startPages) * pageSize
    const secondHalfGrowth = (endPages - midPages) * pageSize
    // The second N calls must grow memory by meaningfully LESS than the
    // first N did — proof the history's own eviction is bounding retention,
    // not that nothing was ever retained (some growth up to the history
    // budget is expected and correct).
    expect(secondHalfGrowth).toBeLessThan(firstHalfGrowth)
  })
})

describe.runIf(pkgAvailable)('WasmPixelCore — dispose() (fix-agent 7g, item 5)', () => {
  it('releases the underlying WasmDocument deterministically — further calls on the instance throw, never silently succeed on freed memory', () => {
    const core = new WasmPixelCore(mod, freshDoc())
    expect(() => core.dispose()).not.toThrow()
    expect(() => core.dispatch({ type: 'layer.add' })).toThrow()
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

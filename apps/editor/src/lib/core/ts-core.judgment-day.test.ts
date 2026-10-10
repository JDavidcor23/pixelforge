import { describe, it, expect } from 'vitest'
import type { AnimationFrame, Layer } from '@/types'
import { createEmptyBuffer, extractRect, getPixel, putPixel } from '../pixel-buffer'
import { packPoints, packRgba } from './color-codec'
import { frameToSerializedFrame } from './serialize'
import {
  createCoreState,
  currentActiveLayerId,
  currentLayers,
  currentFrame,
  dispatchCommand,
  type CoreState,
  type DocSnapshot,
} from './ts-core'

/**
 * Permanent regression tests for the judgment-day (iteration 1) review of
 * phase 2/2b. Two independent blind judges reproduced real bugs in two
 * scratch test files (judgeA/judgeB); this file folds their repros into the
 * permanent suite, rewritten against the phase 2c fix's INTENTIONALLY
 * changed behavior (everything document-level is now undoable, patch
 * entries address frames by stable id). Each test documents which judge
 * repro it replaces and why the assertion changed.
 */

const RED = { r: 255, g: 0, b: 0, a: 255 }
const BLUE = { r: 0, g: 0, b: 255, a: 255 }
const TRANSPARENT = { r: 0, g: 0, b: 0, a: 0 }

function makeLayer(id: string, w = 4, h = 4): Layer {
  return { id, name: id, visible: true, locked: false, opacity: 100, pixels: createEmptyBuffer(w, h) }
}

function makeFrame(id: string, layerId: string, w = 4, h = 4): AnimationFrame {
  return { id, layers: [makeLayer(layerId, w, h)], activeLayerId: layerId, durationMs: 100 }
}

function d(s: CoreState, ...cmds: Parameters<typeof dispatchCommand>[1][]): CoreState {
  for (const c of cmds) s = dispatchCommand(s, c).state
  return s
}

function stroke(s: CoreState, layerId: string, points: Array<{ x: number; y: number }>, color = RED): CoreState {
  return d(
    s,
    { type: 'stroke.begin', layerId },
    { type: 'stroke.points', points: packPoints(points), rgba: packRgba(color) },
    { type: 'stroke.end', label: 'Draw' }
  )
}

// ── judgeA: activeLayerId-dangling.test.ts ──────────────────────────────────
//
// Original repro: draw on layer A, switch active to B, REMOVE layer A
// (non-undoable at the time), then undo the stroke — `activeLayerId` was
// force-restored to the entry's recorded 'A', which no longer existed among
// the frame's layers. Fix (architecture decision): layer.remove is now
// undoable AND `applyEntry` never trusts a recorded activeLayerId blindly
// (see `resolveActiveLayerId` in ts-core.ts). Behavior intentionally
// changed: `layer.remove` now pushes its own history entry, so a single
// `undo()` right after it undoes the REMOVAL (restoring layer A), not the
// older stroke — this test asserts both halves: the undo-of-removal
// restores A, and activeLayerId is never left dangling at any step.
describe('judgment-day / judgeA: activeLayerId never dangles across layer.remove + undo', () => {
  it('undoing a layer.remove restores the layer, and activeLayerId always points at an existing layer', () => {
    function doc(): DocSnapshot {
      const layerA = makeLayer('A')
      const layerB = makeLayer('B')
      return {
        canvasWidth: 4,
        canvasHeight: 4,
        timeline: {
          frames: [{ id: 'f0', layers: [layerA, layerB], activeLayerId: 'A', durationMs: 100 }],
          currentFrameIndex: 0,
          isPlaying: false,
          fps: 12,
          loop: true,
          selectedFrameIndices: [0],
        },
      }
    }

    let state = createCoreState(doc())
    state = stroke(state, 'A', [{ x: 1, y: 1 }])
    state = d(state, { type: 'layer.setActive', layerId: 'B' })
    expect(currentActiveLayerId(state.doc)).toBe('B')

    // layer.remove is now undoable (phase 2c) — removing A pushes a 2nd entry.
    state = d(state, { type: 'layer.remove', layerId: 'A' })
    expect(currentLayers(state.doc).map((l) => l.id)).toEqual(['B'])
    expect(currentActiveLayerId(state.doc)).toBe('B')

    // undo() pops the MOST RECENT entry — the removal — restoring A.
    state = d(state, { type: 'undo' })
    const layerIds = currentLayers(state.doc).map((l) => l.id)
    expect(layerIds).toContain('A')
    // activeLayerId after undoing the removal must point at a real layer.
    expect(layerIds).toContain(currentActiveLayerId(state.doc))

    // A second undo reverts the original stroke on A; activeLayerId still
    // must never dangle, regardless of which layer was active when the
    // stroke happened.
    state = d(state, { type: 'undo' })
    const layerIdsAfter = currentLayers(state.doc).map((l) => l.id)
    expect(layerIdsAfter).toContain(currentActiveLayerId(state.doc))
    expect(getPixel(currentLayers(state.doc).find((l) => l.id === 'A')!.pixels, 1, 1)).toEqual(TRANSPARENT)
  })
})

// ── judgeA: frame-paste-stale-index.test.ts ─────────────────────────────────
//
// Original repro: a patch entry recorded `frameIndex: 3` (the array position
// at dispatch time); a later `frame.paste` shifted that frame to index 5
// WITHOUT updating any existing entry, so `undo()` jumped to and mutated
// whatever frame now sat at the STALE index 3 instead of the frame that was
// actually drawn on. Fix: patch entries address frames by stable `frameId`
// (`lib/core/history.ts`), resolved via `frameIndexById` at apply-time —
// index drift from ANY later structural command can no longer corrupt an
// older entry.
describe('judgment-day / judgeA: patch entries survive frame-array reordering (stable frameId, not index)', () => {
  it('undo() locates the original frame by id even after a LATER structural command shifted every index', () => {
    const frames = [makeFrame('f0', 'L0'), makeFrame('f1', 'L1'), makeFrame('f2', 'L2'), makeFrame('f3', 'L3')]
    const doc: DocSnapshot = {
      canvasWidth: 4,
      canvasHeight: 4,
      timeline: { frames, currentFrameIndex: 3, isPlaying: false, fps: 12, loop: true, selectedFrameIndices: [3] },
    }
    let state = createCoreState(doc)

    // Stroke on frame f3 (index 3) — the patch entry below records
    // frameId:'f3', not "index 3".
    state = stroke(state, 'L3', [{ x: 0, y: 0 }], RED)
    expect(state.history.entries).toHaveLength(1)

    // A later structural command (paste 2 frames at index 1) shifts f3 from
    // array position 3 to position 5. This itself is undoable now, but
    // we dig PAST it (2 undos) to reach the original stroke entry and
    // confirm it still targets f3 correctly, wherever f3 now lives.
    // judgment-day round 2 (finding 6): the core assigns FRESH ids to pasted
    // frames/layers, never the caller-supplied ones — so this test reads
    // back whatever ids actually landed instead of asserting the literal
    // 'pA'/'pB' input ids survived verbatim.
    const pasted: AnimationFrame[] = [makeFrame('pA', 'LA'), makeFrame('pB', 'LB')]
    state = d(state, { type: 'frame.paste', at: 1, frames: pasted.map(frameToSerializedFrame) })
    const [pastedId1, pastedId2] = state.doc.timeline.frames.slice(1, 3).map((f) => f.id)
    expect(pastedId1).not.toBe('pA')
    expect(pastedId2).not.toBe('pB')
    expect(state.doc.timeline.frames.map((f) => f.id)).toEqual(['f0', pastedId1, pastedId2, 'f1', 'f2', 'f3'])
    expect(state.history.entries).toHaveLength(2) // paste is its own (structural) entry now

    state = d(state, { type: 'undo' }) // undoes the paste — f3 back at index 3
    expect(state.doc.timeline.frames.map((f) => f.id)).toEqual(['f0', 'f1', 'f2', 'f3'])

    state = d(state, { type: 'undo' }) // undoes the ORIGINAL stroke — must land on f3, not whatever sat at index 3 meanwhile
    expect(state.doc.timeline.currentFrameIndex).toBe(3)
    expect(currentFrame(state.doc).id).toBe('f3')
    expect(getPixel(currentFrame(state.doc).layers[0].pixels, 0, 0)).toEqual(TRANSPARENT)
    // f1 (the frame that used to sit at the stale index 3 after the paste) must be untouched.
    const f1 = state.doc.timeline.frames.find((f) => f.id === 'f1')!
    expect(getPixel(f1.layers[0].pixels, 0, 0)).toEqual(TRANSPARENT)
  })

  it('applyEntry resolves a patch by frameId even when the frames array has been reordered independently of its own history', () => {
    // Direct, deterministic unit test of the fix without depending on
    // paste's own undo semantics: construct a CoreState whose history
    // references frame 'f3' by id, then simulate frames having been
    // reordered (as any structural command would do) and confirm undo
    // still finds 'f3' correctly.
    const frames = [makeFrame('f0', 'L0'), makeFrame('f3', 'L3')] // 'f3' now sits at array index 1, not 3
    putPixel(frames[1].layers[0].pixels, 2, 2, RED) // simulate "after" state already applied

    const doc: DocSnapshot = {
      canvasWidth: 4,
      canvasHeight: 4,
      timeline: { frames, currentFrameIndex: 1, isPlaying: false, fps: 12, loop: true, selectedFrameIndices: [1] },
    }

    const before = createEmptyBuffer(4, 4)
    const after = createEmptyBuffer(4, 4)
    putPixel(after, 2, 2, RED)
    const rect = { x: 2, y: 2, w: 1, h: 1 }

    const state: CoreState = {
      doc,
      strokeState: null,
      revision: 0,
      idSeed: 'test',
      frameIdCounter: { value: 0 },
      layerIdCounter: { value: 0 },
      history: {
        cursor: 0,
        entries: [
          {
            kind: 'patch',
            label: 'Draw',
            frameId: 'f3',
            activeLayerId: 'L3',
            patches: [
              {
                layerId: 'L3',
                rect,
                before: extractRect(before, rect),
                after: extractRect(after, rect),
              },
            ],
          },
        ],
      },
    }

    const undone = dispatchCommand(state, { type: 'undo' }).state
    const f3 = undone.doc.timeline.frames.find((f) => f.id === 'f3')!
    expect(getPixel(f3.layers[0].pixels, 2, 2)).toEqual(TRANSPARENT)
    expect(undone.doc.timeline.currentFrameIndex).toBe(1) // jumped to f3's REAL (current) index, not a stale one
  })
})

// ── judgeB core.judge.test.ts: selected scenarios ───────────────────────────

describe('judgment-day / judgeB-C: layer.remove no longer silently consumes an earlier patch entry', () => {
  it('undo after layer.remove reverts the removal (not the earlier stroke), and the stroke is still undoable after that', () => {
    let s = createCoreState({
      canvasWidth: 4,
      canvasHeight: 4,
      timeline: { frames: [makeFrame('f0', 'L0')], currentFrameIndex: 0, isPlaying: false, fps: 10, loop: true, selectedFrameIndices: [0] },
    })
    s = d(s, { type: 'layer.add' })
    const newId = currentLayers(s.doc)[1].id
    s = stroke(s, newId, [{ x: 1, y: 1 }])
    s = d(s, { type: 'layer.remove', layerId: newId })

    expect(s.history.entries).toHaveLength(3) // add, stroke, remove — all undoable now
    expect(currentLayers(s.doc)).toHaveLength(1)

    const afterFirstUndo = dispatchCommand(s, { type: 'undo' })
    expect(afterFirstUndo.result.changed).toBe(true)
    expect(currentLayers(afterFirstUndo.state.doc)).toHaveLength(2) // the layer is BACK, not silently dropped
    expect(afterFirstUndo.state.history.cursor).toBe(1) // the earlier stroke entry is still there, untouched

    const afterSecondUndo = dispatchCommand(afterFirstUndo.state, { type: 'undo' })
    const restoredLayer = currentLayers(afterSecondUndo.state.doc).find((l) => l.id === newId)!
    expect(getPixel(restoredLayer.pixels, 1, 1)).toEqual(TRANSPARENT) // stroke itself is still undoable
  })
})

describe('judgment-day / judgeB-G: structural undo preserves CURRENT playback/view prefs', () => {
  it('undoing a frame.add does not revert fps/isPlaying changed afterward', () => {
    let s = createCoreState({
      canvasWidth: 4,
      canvasHeight: 4,
      timeline: { frames: [makeFrame('f0', 'L0')], currentFrameIndex: 0, isPlaying: false, fps: 12, loop: true, selectedFrameIndices: [0] },
    })
    s = d(s, { type: 'frame.add' })
    s = d(s, { type: 'timeline.setFps', fps: 24 }, { type: 'timeline.togglePlayback' })
    expect(s.doc.timeline.fps).toBe(24)
    expect(s.doc.timeline.isPlaying).toBe(true)

    s = d(s, { type: 'undo' }) // undoes frame.add
    expect(s.doc.timeline.frames).toHaveLength(1)
    expect(s.doc.timeline.fps).toBe(24) // NOT reverted to 12
    expect(s.doc.timeline.isPlaying).toBe(true) // NOT reverted to false
  })
})

describe('judgment-day / judgeB-H: stroke.points bounds-validates every pixel, never wraps', () => {
  it('an out-of-bounds x is ignored, not wrapped into the next row', () => {
    let s = createCoreState({
      canvasWidth: 8,
      canvasHeight: 8,
      timeline: { frames: [makeFrame('f0', 'L0', 8, 8)], currentFrameIndex: 0, isPlaying: false, fps: 10, loop: true, selectedFrameIndices: [0] },
    })
    s = d(s, { type: 'stroke.begin', layerId: 'L0' }, { type: 'stroke.points', points: packPoints([{ x: 8, y: 0 }]), rgba: packRgba(RED) })
    expect(getPixel(currentLayers(s.doc)[0].pixels, 0, 1)).toEqual(TRANSPARENT) // would be RED if x=8,y=0 wrapped to (0,1)
  })
})

describe('judgment-day / judgeB-E: stroke.begin while a stroke is open commits the open one first', () => {
  it('a 2nd stroke.begin on a different gesture does not lose the 1st stroke', () => {
    let s = createCoreState({
      canvasWidth: 4,
      canvasHeight: 4,
      timeline: { frames: [makeFrame('f0', 'L0')], currentFrameIndex: 0, isPlaying: false, fps: 10, loop: true, selectedFrameIndices: [0] },
    })
    s = d(s, { type: 'stroke.begin', layerId: 'L0' }, { type: 'stroke.points', points: packPoints([{ x: 0, y: 0 }]), rgba: packRgba(RED) })
    // missed stroke.end — begin a new stroke without ending the first.
    s = stroke(s, 'L0', [{ x: 2, y: 2 }], BLUE)

    expect(getPixel(currentLayers(s.doc)[0].pixels, 0, 0)).toEqual(RED) // 1st stroke's pixel preserved
    expect(getPixel(currentLayers(s.doc)[0].pixels, 2, 2)).toEqual(BLUE)
    expect(s.history.entries).toHaveLength(2) // both strokes got their own entry — neither was lost

    s = d(s, { type: 'undo' })
    expect(getPixel(currentLayers(s.doc)[0].pixels, 2, 2)).toEqual(TRANSPARENT)
    expect(getPixel(currentLayers(s.doc)[0].pixels, 0, 0)).toEqual(RED) // 1st stroke survives the 2nd's undo
  })
})

describe('judgment-day / judgeB-F: frame.select ends an open stroke instead of corrupting it', () => {
  it('switching frames mid-stroke commits the stroke to the frame it began on', () => {
    let s = createCoreState({
      canvasWidth: 4,
      canvasHeight: 4,
      timeline: {
        frames: [makeFrame('f0', 'L'), makeFrame('f1', 'L')], // same layer id on purpose, like compound.slice's frame.paste
        currentFrameIndex: 0,
        isPlaying: false,
        fps: 10,
        loop: true,
        selectedFrameIndices: [0],
      },
    })
    s = d(s, { type: 'stroke.begin', layerId: 'L' }, { type: 'stroke.points', points: packPoints([{ x: 1, y: 1 }]), rgba: packRgba(RED) })
    s = d(s, { type: 'frame.select', index: 1 }) // mid-stroke frame switch

    expect(s.strokeState).toBeNull() // the stroke was ended, not left dangling onto the new frame
    expect(s.history.entries).toHaveLength(1)
    const entry = s.history.entries[0]
    expect(entry.kind === 'patch' && entry.frameId).toBe('f0') // committed to the ORIGINAL frame

    const f0 = s.doc.timeline.frames.find((f) => f.id === 'f0')!
    const f1 = s.doc.timeline.frames.find((f) => f.id === 'f1')!
    expect(getPixel(f0.layers[0].pixels, 1, 1)).toEqual(RED)
    expect(getPixel(f1.layers[0].pixels, 1, 1)).toEqual(TRANSPARENT) // the NEW current frame was untouched
  })
})

describe('judgment-day: locked layers reject pixel mutation (no-op, no history entry)', () => {
  it('stroke/fill/region.clear are no-ops on a locked layer', () => {
    let s = createCoreState({
      canvasWidth: 4,
      canvasHeight: 4,
      timeline: { frames: [makeFrame('f0', 'L0')], currentFrameIndex: 0, isPlaying: false, fps: 10, loop: true, selectedFrameIndices: [0] },
    })
    s = d(s, { type: 'layer.meta', layerId: 'L0', patch: { locked: true } })
    expect(s.history.entries).toHaveLength(1) // the lock itself IS undoable

    const afterStroke = stroke(s, 'L0', [{ x: 0, y: 0 }], RED)
    expect(afterStroke.history.entries).toHaveLength(1) // no entry added — the stroke never took effect
    expect(getPixel(currentLayers(afterStroke.doc)[0].pixels, 0, 0)).toEqual(TRANSPARENT)

    const afterFill = dispatchCommand(afterStroke, { type: 'fill', layerId: 'L0', x: 0, y: 0, rgba: packRgba(RED) })
    expect(afterFill.result.changed).toBe(false)

    const afterClear = dispatchCommand(afterStroke, { type: 'region.clear', layerId: 'L0', rect: { x: 0, y: 0, w: 1, h: 1 } })
    expect(afterClear.result.changed).toBe(false)
  })
})

describe('judgment-day: no-op commands never push an empty history entry', () => {
  it('selection.commit with identical pixels is a no-op', () => {
    let s = createCoreState({
      canvasWidth: 2,
      canvasHeight: 2,
      timeline: { frames: [makeFrame('f0', 'L0', 2, 2)], currentFrameIndex: 0, isPlaying: false, fps: 10, loop: true, selectedFrameIndices: [0] },
    })
    const samePixels = currentLayers(s.doc)[0].pixels
    const outcome = dispatchCommand(s, {
      type: 'selection.commit',
      layerId: 'L0',
      at: { x: 0, y: 0, w: samePixels.w, h: samePixels.h },
      pixels: samePixels.data,
    })
    expect(outcome.result.changed).toBe(false)
    expect(outcome.state.history.entries).toHaveLength(0)
  })

  it('frame.remove with an out-of-range index is a no-op, not a crash', () => {
    const s = createCoreState({
      canvasWidth: 2,
      canvasHeight: 2,
      timeline: {
        frames: [makeFrame('f0', 'L0', 2, 2), makeFrame('f1', 'L1', 2, 2)],
        currentFrameIndex: 0,
        isPlaying: false,
        fps: 10,
        loop: true,
        selectedFrameIndices: [0],
      },
    })
    const outcome = dispatchCommand(s, { type: 'frame.remove', index: 99 })
    expect(outcome.result.changed).toBe(false)
    expect(outcome.state.doc.timeline.frames).toHaveLength(2)
  })

  it('layer.reorder with from===to is a no-op', () => {
    const s = createCoreState({
      canvasWidth: 2,
      canvasHeight: 2,
      timeline: { frames: [makeFrame('f0', 'L0', 2, 2)], currentFrameIndex: 0, isPlaying: false, fps: 10, loop: true, selectedFrameIndices: [0] },
    })
    const outcome = dispatchCommand(s, { type: 'layer.reorder', from: 0, to: 0 })
    expect(outcome.result.changed).toBe(false)
    expect(outcome.state.history.entries).toHaveLength(0)
  })
})

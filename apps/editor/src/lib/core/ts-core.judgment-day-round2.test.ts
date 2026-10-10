import { describe, it, expect } from 'vitest'
import type { AnimationFrame, Layer } from '@/types'
import { createEmptyBuffer, getPixel, putPixel } from '../pixel-buffer'
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
import { entryBytes } from './history'

/**
 * Permanent regression tests for the judgment-day ROUND 2 review. Two blind
 * judges reproduced these in scratch files (judgeA2/judgeB2); this file
 * folds their CONFIRMED repros into the permanent suite. Several assertions
 * are rewritten against this round's DECISIONS (findings 3 and 6 in
 * particular change the expected behavior from what the scratch repro
 * originally asserted) — each test documents which judge repro it replaces
 * and why.
 */

const RED = { r: 255, g: 0, b: 0, a: 255 }
const BLUE = { r: 0, g: 0, b: 255, a: 255 }
const TRANSPARENT = { r: 0, g: 0, b: 0, a: 0 }

function makeLayer(id: string, w = 4, h = 4): Layer {
  return { id, name: id, visible: true, locked: false, opacity: 100, pixels: createEmptyBuffer(w, h) }
}
function makeFrame(id: string, layerIds: string[], w = 4, h = 4): AnimationFrame {
  return { id, layers: layerIds.map((l) => makeLayer(l, w, h)), activeLayerId: layerIds[0], durationMs: 100 }
}
function doc(frames: AnimationFrame[], w = 4, h = 4): DocSnapshot {
  return {
    canvasWidth: w,
    canvasHeight: h,
    timeline: { frames, currentFrameIndex: 0, isPlaying: false, fps: 12, loop: true, selectedFrameIndices: [0] },
  }
}
function d(s: CoreState, ...cmds: Parameters<typeof dispatchCommand>[1][]): CoreState {
  for (const c of cmds) s = dispatchCommand(s, c).state
  return s
}
function px(s: CoreState, layerId: string, x: number, y: number, frameIdx = s.doc.timeline.currentFrameIndex) {
  const l = s.doc.timeline.frames[frameIdx].layers.find((q) => q.id === layerId)!
  return getPixel(l.pixels, x, y)
}
function undoAll(s: CoreState): CoreState {
  while (s.history.cursor >= 0) s = d(s, { type: 'undo' })
  return s
}

// ── Finding 1 (CRITICAL): render contract is a revision counter, not buffer identity ──

describe('judgment-day round 2 / finding 1: render contract is layerRevisions, never pixel-buffer identity', () => {
  it('stroke.points bumps the touched layer`s revision on EVERY batch, even though the buffer reference never changes mid-gesture', () => {
    let s = createCoreState(doc([makeFrame('f0', ['A'])]))
    s = d(s, { type: 'stroke.begin', layerId: 'A' })
    const rev0 = s.layerRevisions?.['A'] ?? 0

    s = d(s, { type: 'stroke.points', points: packPoints([{ x: 0, y: 0 }]), rgba: packRgba(RED) })
    // This is the `stroke.working` buffer — the SAME object every batch of
    // this gesture mutates in place (phase 2c's "zero clones per batch"
    // perf fix) for the REST of the drag.
    const workingRef = currentLayers(s.doc)[0].pixels
    const rev1 = s.layerRevisions!['A']

    s = d(s, { type: 'stroke.points', points: packPoints([{ x: 1, y: 0 }]), rgba: packRgba(RED) })
    const ref2 = currentLayers(s.doc)[0].pixels

    // The buffer identity must stay stable — asserting otherwise would mean
    // re-introducing a clone-per-move allocation. A Konva layer keyed on
    // THIS identity would never re-render mid-stroke — that was the bug.
    expect(ref2).toBe(workingRef)

    // The render contract instead: `layerRevisions` bumps every batch.
    expect(rev1).toBeGreaterThan(rev0)
    expect(s.layerRevisions!['A']).toBeGreaterThan(rev1)
  })

  it('stroke.end (commit) also bumps the revision/docRevision signal, so Zustand/Konva update on pointer-up, not just mid-drag', () => {
    let s = createCoreState(doc([makeFrame('f0', ['A'])]))
    s = d(s, { type: 'stroke.begin', layerId: 'A' }, { type: 'stroke.points', points: packPoints([{ x: 0, y: 0 }]), rgba: packRgba(RED) })
    const revBeforeEnd = s.contentRevision
    const outcome = dispatchCommand(s, { type: 'stroke.end', label: 'Draw' })

    expect(outcome.result.changed).toBe(true)
    expect(outcome.result.dirty.length).toBeGreaterThan(0)
    expect(outcome.state.contentRevision).toBeGreaterThan(revBeforeEnd!)
    expect(outcome.state.history.entries).toHaveLength(1)
  })
})

// ── Finding 2: every document-changing command commits an open stroke first ──
// (judgeB2.test.ts: "judgeB2: mid-stroke structural commands")

describe('judgment-day round 2 / finding 2: document-changing commands commit an open stroke first', () => {
  it('layer.meta mid-stroke: undoing everything resurrects the partial stroke pixel, not a corrupted/lost one', () => {
    let s = createCoreState(doc([makeFrame('f0', ['A', 'B'])]))
    s = d(
      s,
      { type: 'stroke.begin', layerId: 'A' },
      { type: 'stroke.points', points: packPoints([{ x: 0, y: 0 }]), rgba: packRgba(RED) },
      { type: 'layer.meta', layerId: 'B', patch: { visible: false } },
      { type: 'stroke.points', points: packPoints([{ x: 1, y: 0 }]), rgba: packRgba(RED) },
      { type: 'stroke.end', label: 'Draw' }
    )
    s = undoAll(s)
    expect(px(s, 'A', 0, 0).a).toBe(0) // back to blank
  })

  it('frame.paste mid-stroke commits the stroke as its OWN entry before the paste, so undo unwinds both independently', () => {
    let s = createCoreState(doc([makeFrame('f0', ['A'])]))
    const clip = { ...makeFrame('pf', ['P']) }
    s = d(
      s,
      { type: 'stroke.begin', layerId: 'A' },
      { type: 'stroke.points', points: packPoints([{ x: 0, y: 0 }]), rgba: packRgba(RED) },
      { type: 'frame.paste', at: 1, frames: [frameToSerializedFrame(clip)] },
      { type: 'stroke.end', label: 'Draw' }
    )
    s = undoAll(s)
    expect(s.doc.timeline.frames).toHaveLength(1)
    expect(px(s, 'A', 0, 0, 0).a).toBe(0)
  })

  it('doc.replace mid-stroke (async import lands during drag) commits the partial stroke as a real, undoable entry', () => {
    let s = createCoreState(doc([makeFrame('f0', ['A'])]))
    s = d(
      s,
      { type: 'stroke.begin', layerId: 'A' },
      { type: 'stroke.points', points: packPoints([{ x: 0, y: 0 }]), rgba: packRgba(RED) },
      { type: 'doc.replace', canvasWidth: 4, canvasHeight: 4, frames: [{ pixels: createEmptyBuffer(4, 4) }], frameDurationMs: 100, label: 'AI' }
    )
    s = undoAll(s)
    expect(px(s, 'A', 0, 0, 0).a).toBe(0)
  })

  it('region.clear mid-stroke on the same layer commits the stroke first, so the clear is never silently dropped by the next batch', () => {
    let s = createCoreState(doc([makeFrame('f0', ['A'])]))
    s = d(
      s,
      { type: 'stroke.begin', layerId: 'A' },
      { type: 'stroke.points', points: packPoints([{ x: 3, y: 3 }]), rgba: packRgba(BLUE) },
      { type: 'stroke.end', label: 'Draw' }
    )
    s = d(
      s,
      { type: 'stroke.begin', layerId: 'A' },
      { type: 'stroke.points', points: packPoints([{ x: 0, y: 0 }]), rgba: packRgba(RED) },
      { type: 'region.clear', layerId: 'A', rect: { x: 3, y: 3, w: 1, h: 1 } },
      { type: 'stroke.points', points: packPoints([{ x: 1, y: 0 }]), rgba: packRgba(RED) }
    )
    expect(px(s, 'A', 3, 3).a).toBe(0) // clear still holds
  })
})

// ── Finding 3 (DECISION): undo/redo FOCUSES the entry's own target ──
// Adapted from judgeA2's scratch repros — the orchestrator's decision is the
// OPPOSITE of what those scratch files originally asserted (Aseprite-style:
// undo jumps you to what it affected, overriding a later non-undoable
// view-state change — it does NOT preserve "what the user was looking at").

describe('judgment-day round 2 / finding 3: undo/redo focuses the affected target (Aseprite-style), not a stale recorded view', () => {
  it('judgeA2 active-layer-revert.test.ts, DECISION-adjusted: undoing a patch focuses ITS OWN layer, overriding a later layer.setActive', () => {
    const d0: DocSnapshot = {
      canvasWidth: 4,
      canvasHeight: 4,
      timeline: {
        frames: [{ id: 'f0', layers: [makeLayer('L0'), makeLayer('L1')], activeLayerId: 'L0', durationMs: 100 }],
        currentFrameIndex: 0,
        isPlaying: false,
        fps: 12,
        loop: true,
        selectedFrameIndices: [0],
      },
    }
    let s = createCoreState(d0)
    s = d(
      s,
      { type: 'stroke.begin', layerId: 'L0' },
      { type: 'stroke.points', points: packPoints([{ x: 0, y: 0 }]), rgba: packRgba(RED) },
      { type: 'stroke.end', label: 'Draw' }
    )
    s = d(s, { type: 'layer.setActive', layerId: 'L1' })
    expect(currentActiveLayerId(s.doc)).toBe('L1')

    s = d(s, { type: 'undo' }) // undoes the stroke on L0

    // DECISION: undo focuses the PATCH ENTRY'S OWN target (L0), not the
    // user's later (non-undoable) L1 selection — "undo/redo focuses the
    // target of the entry it applies".
    expect(currentActiveLayerId(s.doc)).toBe('L0')
  })

  it('judgeA2 frame-select-revert.test.ts, DECISION-adjusted: undoing layer.add focuses the frame it affected, overriding a later frame.select', () => {
    const frames = [makeFrame('f0', ['L0']), makeFrame('f1', ['L1'])]
    let s = createCoreState(doc(frames))

    s = d(s, { type: 'layer.add' }) // structural entry on frame f0 (index 0)
    expect(s.doc.timeline.currentFrameIndex).toBe(0)

    s = d(s, { type: 'frame.select', index: 1 }) // non-undoable navigation
    expect(s.doc.timeline.currentFrameIndex).toBe(1)

    s = d(s, { type: 'undo' }) // undoes the layer.add

    // DECISION: undo focuses the STRUCTURAL ENTRY'S OWN frame (f0, index 0),
    // not the user's later navigation to frame 1.
    expect(s.doc.timeline.currentFrameIndex).toBe(0)
    expect(currentFrame(s.doc).id).toBe('f0')
  })

  it('falls back to the CURRENT selection when the entry`s own target no longer exists (e.g. undoing an add whose frame was later removed elsewhere)', () => {
    let s = createCoreState(doc([makeFrame('f0', ['L0']), makeFrame('f1', ['L1'])]))
    s = d(s, { type: 'frame.add' }) // adds f2
    const addedId = currentFrame(s.doc).id
    expect(addedId).not.toBe('f0')
    expect(addedId).not.toBe('f1')

    s = d(s, { type: 'frame.select', index: 0 }) // user looks at f0 instead
    expect(currentFrame(s.doc).id).toBe('f0')

    s = d(s, { type: 'undo' }) // undoes frame.add — the added frame is GONE, so its "own target" can't be focused

    // Falls back to the CURRENT (still valid) selection — f0 — not index 2
    // (the stale push-time position) and not index 0 by coincidence only.
    expect(currentFrame(s.doc).id).toBe('f0')
  })
})

// ── Finding 4: structural history is small records, not whole-document snapshots ──

describe('judgment-day round 2 / finding 4: structural history entries are small records, bounded by the byte budget', () => {
  it('a visibility toggle on a 16-frame/4-layer/384px document costs under 1 KB (not the whole document, twice)', () => {
    const W = 384
    const frames = Array.from({ length: 16 }, (_, i) =>
      makeFrame(`f${i}`, [`A${i}`, `B${i}`, `C${i}`, `D${i}`], W, W)
    )
    let s = createCoreState(doc(frames, W, W))

    s = d(s, { type: 'layer.meta', layerId: 'B0', patch: { visible: false } })

    const toggleEntry = s.history.entries[s.history.entries.length - 1]
    expect(toggleEntry.kind).toBe('layer.meta')
    expect(entryBytes(toggleEntry)).toBeLessThan(1024)
  })

  it('judgeB2 memory repro: 5 strokes + 1 toggle on the same 16x4x384 doc keep ALL 6 entries (the toggle no longer evicts the strokes)', () => {
    const W = 384
    const frames = Array.from({ length: 16 }, (_, i) =>
      makeFrame(`f${i}`, [`A${i}`, `B${i}`, `C${i}`, `D${i}`], W, W)
    )
    let s = createCoreState(doc(frames, W, W))
    for (let i = 0; i < 5; i++) {
      s = d(
        s,
        { type: 'stroke.begin', layerId: 'A0' },
        { type: 'stroke.points', points: packPoints([{ x: i, y: 0 }]), rgba: packRgba(RED) },
        { type: 'stroke.end', label: 'Draw' }
      )
    }
    expect(s.history.entries).toHaveLength(5)

    s = d(s, { type: 'layer.meta', layerId: 'B0', patch: { visible: false } })

    expect(s.history.entries).toHaveLength(6) // nothing evicted — the toggle was cheap
  })

  it('a single entry that alone exceeds the byte budget is kept alone (never exceeds silently, never crashes)', () => {
    let s = createCoreState(doc([makeFrame('f0', ['A'])], 4, 4))
    // A doc.replace with a huge canvas is the one deliberately-full-snapshot
    // kind — if it alone busts the budget, it must survive as the sole entry.
    const hugeW = 4096
    s = d(s, {
      type: 'doc.replace',
      canvasWidth: hugeW,
      canvasHeight: hugeW,
      frames: [{ pixels: createEmptyBuffer(hugeW, hugeW) }],
      frameDurationMs: 100,
      label: 'Huge AI import',
    })
    expect(s.history.entries).toHaveLength(1)
  })
})

// ── Finding 6/7: fresh ids + fresh buffers on paste; validation no-ops ──

describe('judgment-day round 2 / finding 6: frame.paste deep-copies with fresh ids and fresh buffers', () => {
  it('judgeB2 paste repro, DECISION-adjusted: a pasted frame gets its OWN layer id — drawing on it never touches the source', () => {
    let s = createCoreState(doc([makeFrame('f0', ['A'])]))
    const sourceBuffer = currentLayers(s.doc)[0].pixels
    const pasted = { ...s.doc.timeline.frames[0], id: 'f1' } // caller passes the SAME layer id/buffer on purpose
    s = d(s, { type: 'frame.paste', at: 1, frames: [frameToSerializedFrame(pasted)] })

    const pastedLayerId = s.doc.timeline.frames[1].layers[0].id
    expect(pastedLayerId).not.toBe('A') // fresh id, never aliasing the source's
    expect(s.doc.timeline.frames[1].layers[0].pixels).not.toBe(sourceBuffer) // fresh (cloned) buffer

    s = d(
      s,
      { type: 'stroke.begin', layerId: pastedLayerId },
      { type: 'stroke.points', points: packPoints([{ x: 0, y: 0 }]), rgba: packRgba(RED) },
      { type: 'stroke.end', label: 'Draw' }
    )
    expect(px(s, pastedLayerId, 0, 0, 1).a).toBe(255)
    expect(px(s, 'A', 0, 0, 0).a).toBe(0) // the SOURCE frame's original layer is untouched

    s = d(s, { type: 'undo' })
    expect(px(s, pastedLayerId, 0, 0, 1).a).toBe(0)
    expect(s.doc.timeline.currentFrameIndex).toBe(1)
  })

  it('structural undo/redo preserves frame/layer ids so later patch entries still resolve', () => {
    let s = createCoreState(doc([makeFrame('f0', ['A'])]))
    s = d(s, { type: 'frame.add' })
    const newId = currentFrame(s.doc).id
    const newLayer = currentLayers(s.doc)[0].id
    s = d(
      s,
      { type: 'stroke.begin', layerId: newLayer },
      { type: 'stroke.points', points: packPoints([{ x: 0, y: 0 }]), rgba: packRgba(RED) },
      { type: 'stroke.end', label: 'Draw' },
      { type: 'undo' },
      { type: 'undo' },
      { type: 'redo' },
      { type: 'redo' }
    )
    expect(currentFrame(s.doc).id).toBe(newId)
    expect(px(s, newLayer, 0, 0).a).toBe(255)
  })
})

describe('judgment-day round 2 / finding 7: validation — clamped/no-op instead of dangling/out-of-range state', () => {
  it('frame.paste with at > length clamps instead of leaving currentFrameIndex out of range', () => {
    let s = createCoreState(doc([makeFrame('f0', ['A'])]))
    s = d(s, { type: 'frame.paste', at: 5, frames: [frameToSerializedFrame(makeFrame('p', ['P']))] })
    expect(s.doc.timeline.currentFrameIndex).toBeLessThan(s.doc.timeline.frames.length)
  })

  it('layer.setActive with an unknown id is a no-op — activeLayerId never dangles', () => {
    let s = createCoreState(doc([makeFrame('f0', ['A'])]))
    const outcome = dispatchCommand(s, { type: 'layer.setActive', layerId: 'ghost' })
    expect(outcome.result.changed).toBe(false)
    expect(currentLayers(outcome.state.doc).some((l) => l.id === currentFrame(outcome.state.doc).activeLayerId)).toBe(true)
  })
})

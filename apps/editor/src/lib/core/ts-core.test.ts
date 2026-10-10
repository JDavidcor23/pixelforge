import { describe, it, expect } from 'vitest'
import type { AnimationFrame, Layer } from '@/types'
import { createEmptyBuffer, getPixel, putPixel } from '../pixel-buffer'
import { packPoints, packRgba } from './color-codec'
import { frameToSerializedFrame } from './serialize'
import {
  createCoreState,
  currentActiveLayerId,
  currentLayers,
  dispatchCommand,
  coreCanUndo,
  coreCanRedo,
  docToPayload,
  payloadToDoc,
  type DocSnapshot,
} from './ts-core'

const RED = { r: 255, g: 0, b: 0, a: 255 }
const GREEN = { r: 0, g: 255, b: 0, a: 255 }
const TRANSPARENT = { r: 0, g: 0, b: 0, a: 0 }

function makeLayer(id: string, w: number, h: number): Layer {
  return { id, name: `Layer ${id}`, visible: true, locked: false, opacity: 100, pixels: createEmptyBuffer(w, h) }
}

function makeDoc(w: number, h: number, frameCount = 1, layerCount = 1): DocSnapshot {
  const frames: AnimationFrame[] = Array.from({ length: frameCount }, (_, fi) => {
    const layers = Array.from({ length: layerCount }, (_, li) => makeLayer(`f${fi}-l${li}`, w, h))
    return { id: `frame-${fi}`, layers, activeLayerId: layers[0].id, durationMs: 83 }
  })
  return {
    canvasWidth: w,
    canvasHeight: h,
    timeline: { frames, currentFrameIndex: 0, isPlaying: false, fps: 12, loop: true, selectedFrameIndices: [0] },
  }
}

function dispatchStroke(state: ReturnType<typeof createCoreState>, layerId: string, points: Array<{ x: number; y: number }>, color = RED) {
  let outcome = dispatchCommand(state, { type: 'stroke.begin', layerId })
  outcome = dispatchCommand(outcome.state, { type: 'stroke.points', points: packPoints(points), rgba: packRgba(color) })
  outcome = dispatchCommand(outcome.state, { type: 'stroke.end', label: 'Draw' })
  return outcome
}

describe('edit-history: "Mutation via dispatch is observable"', () => {
  it('one dispatched stroke produces exactly one undo-stack entry', () => {
    const doc = makeDoc(4, 4)
    const state = createCoreState(doc)

    expect(coreCanUndo(state)).toBe(false)

    const outcome = dispatchStroke(state, currentActiveLayerId(doc), [{ x: 0, y: 0 }])

    expect(getPixel(currentLayers(outcome.state.doc)[0].pixels, 0, 0)).toEqual(RED)
    expect(outcome.state.history.entries).toHaveLength(1)
    expect(coreCanUndo(outcome.state)).toBe(true)
  })
})

describe('edit-history: "Undo/Redo Correctness"', () => {
  it('single undo restores prior state', () => {
    const doc = makeDoc(4, 4)
    const state = createCoreState(doc)

    const afterDraw = dispatchStroke(state, currentActiveLayerId(doc), [{ x: 1, y: 1 }]).state
    expect(getPixel(currentLayers(afterDraw.doc)[0].pixels, 1, 1)).toEqual(RED)

    const undone = dispatchCommand(afterDraw, { type: 'undo' }).state
    expect(getPixel(currentLayers(undone.doc)[0].pixels, 1, 1)).toEqual(TRANSPARENT)
  })

  it('redo restores the undone state', () => {
    const doc = makeDoc(4, 4)
    const state = createCoreState(doc)

    const afterDraw = dispatchStroke(state, currentActiveLayerId(doc), [{ x: 1, y: 1 }]).state
    const undone = dispatchCommand(afterDraw, { type: 'undo' }).state
    const redone = dispatchCommand(undone, { type: 'redo' }).state

    expect(getPixel(currentLayers(redone.doc)[0].pixels, 1, 1)).toEqual(RED)
  })

  it('multi-step N-command undo/redo round-trip returns to the identical final state', () => {
    const doc = makeDoc(4, 4)
    let state = createCoreState(doc)
    const layerId = currentActiveLayerId(doc)

    state = dispatchStroke(state, layerId, [{ x: 0, y: 0 }], RED).state
    state = dispatchStroke(state, layerId, [{ x: 1, y: 1 }], GREEN).state
    state = dispatchCommand(state, { type: 'fill', layerId, x: 3, y: 3, rgba: packRgba(RED) }).state

    const finalLayerBefore = currentLayers(state.doc)[0].pixels.data.slice()

    // Undo all 3, then redo all 3, in order.
    let s = state
    s = dispatchCommand(s, { type: 'undo' }).state
    s = dispatchCommand(s, { type: 'undo' }).state
    s = dispatchCommand(s, { type: 'undo' }).state
    expect(coreCanUndo(s)).toBe(false)

    s = dispatchCommand(s, { type: 'redo' }).state
    s = dispatchCommand(s, { type: 'redo' }).state
    s = dispatchCommand(s, { type: 'redo' }).state
    expect(coreCanRedo(s)).toBe(false)

    expect(currentLayers(s.doc)[0].pixels.data).toEqual(finalLayerBefore)
  })
})

describe('edit-history: "Bounded Undo Memory"', () => {
  it('a single-pixel stroke on a 64x64/8-frame/4-layer document retains under 1KB', () => {
    const doc = makeDoc(64, 64, 8, 4)
    const state = createCoreState(doc)

    const outcome = dispatchStroke(state, currentActiveLayerId(doc), [{ x: 10, y: 20 }])
    expect(outcome.state.history.entries).toHaveLength(1)

    const entry = outcome.state.history.entries[0]
    if (entry.kind !== 'patch') throw new Error('expected a patch entry')
    const retainedBytes = entry.patches.reduce((sum, p) => sum + p.before.byteLength + p.after.byteLength, 0)

    expect(retainedBytes).toBeLessThan(1024)
  })
})

describe('frame.add / frame.remove via dispatch', () => {
  it('frame.add creates a new frame and is undoable as one entry', () => {
    const doc = makeDoc(4, 4)
    const state = createCoreState(doc)

    const added = dispatchCommand(state, { type: 'frame.add' }).state
    expect(added.doc.timeline.frames).toHaveLength(2)
    expect(added.doc.timeline.currentFrameIndex).toBe(1)
    expect(added.history.entries).toHaveLength(1)

    const undone = dispatchCommand(added, { type: 'undo' }).state
    expect(undone.doc.timeline.frames).toHaveLength(1)
  })

  it('frame.remove is a no-op on the last remaining frame', () => {
    const doc = makeDoc(4, 4)
    const state = createCoreState(doc)
    const outcome = dispatchCommand(state, { type: 'frame.remove', index: 0 })
    expect(outcome.result.changed).toBe(false)
    expect(outcome.state.doc.timeline.frames).toHaveLength(1)
  })

  it('frame.remove is a no-op for a fractional in-range index, never a corrupting partial-remove (fix-agent 7g, item 3)', () => {
    // Before the fix: a fractional index like 1.5 (3 frames, neither <0 nor
    // >=length) passed the range guard, `frames[1.5]` read back `undefined`
    // for the "removed" frame, the `filter` removed NOTHING (every integer
    // index is `!== 1.5`), yet `changed:true` was reported and a corrupt
    // history entry (`frame: undefined`) was pushed anyway.
    const doc = makeDoc(4, 4, 3, 1)
    const state = createCoreState(doc)
    const outcome = dispatchCommand(state, { type: 'frame.remove', index: 1.5 })
    expect(outcome.result.changed).toBe(false)
    expect(outcome.state.doc.timeline.frames).toHaveLength(3)
    expect(outcome.state.history.entries).toHaveLength(0)
  })
})

describe('doc.replace via dispatch (AI Copilot apply/import)', () => {
  it('replaces the whole document and is undoable', () => {
    const doc = makeDoc(4, 4)
    const state = createCoreState(doc)

    const newPixels = createEmptyBuffer(8, 8)
    putPixel(newPixels, 0, 0, GREEN)

    const replaced = dispatchCommand(state, {
      type: 'doc.replace',
      canvasWidth: 8,
      canvasHeight: 8,
      frames: [{ pixels: newPixels }],
      frameDurationMs: 100,
      label: 'AI Copilot: Apply Generated Image',
    }).state

    expect(replaced.doc.canvasWidth).toBe(8)
    expect(getPixel(currentLayers(replaced.doc)[0].pixels, 0, 0)).toEqual(GREEN)

    const undone = dispatchCommand(replaced, { type: 'undo' }).state
    expect(undone.doc.canvasWidth).toBe(4)
  })
})

describe('docToPayload / payloadToDoc round-trip (replaces lib/document-payload.ts)', () => {
  it('restores byte-identical pixels, frame durations and layer metadata', () => {
    const doc = makeDoc(2, 2, 2, 1)
    putPixel(doc.timeline.frames[0].layers[0].pixels, 0, 0, RED)
    putPixel(doc.timeline.frames[1].layers[0].pixels, 1, 1, GREEN)

    const payload = docToPayload(doc)
    const restored = payloadToDoc(payload)

    expect(restored.canvasWidth).toBe(2)
    expect(restored.canvasHeight).toBe(2)
    expect(restored.timeline.frames).toHaveLength(2)
    expect(getPixel(restored.timeline.frames[0].layers[0].pixels, 0, 0)).toEqual(RED)
    expect(getPixel(restored.timeline.frames[1].layers[0].pixels, 1, 1)).toEqual(GREEN)
  })
})

// ── Phase 2c (judgment-day fixes): "patch-based undo is only sound if EVERY
// document mutation goes through history" — layer CRUD, frame.paste and
// selection/clipboard pixel ops are now ALL undoable. This REPLACES phase
// 2b's "non-undoable" characterization below; see
// `ts-core.judgment-day.test.ts` for the regression tests that motivated
// the change and `design.md`'s "Command Undoability" note. ────────────────

describe('layer CRUD via dispatch (undoable, phase 2c)', () => {
  it('layer.add appends a layer to the CURRENT FRAME only, and is undoable as one entry', () => {
    const doc = makeDoc(4, 4, 2, 1) // 2 frames, 1 layer each
    const state = createCoreState(doc)

    const added = dispatchCommand(state, { type: 'layer.add' }).state
    expect(currentLayers(added.doc)).toHaveLength(2)
    expect(added.doc.timeline.frames[1].layers).toHaveLength(1) // other frame untouched
    expect(added.history.entries).toHaveLength(1)
    expect(coreCanUndo(added)).toBe(true)

    const undone = dispatchCommand(added, { type: 'undo' }).state
    expect(currentLayers(undone.doc)).toHaveLength(1)
  })

  it('layer.remove drops the layer, reassigns activeLayerId if it was active, and is undoable', () => {
    const doc = makeDoc(4, 4)
    let state = createCoreState(doc)
    state = dispatchCommand(state, { type: 'layer.add' }).state
    const second = currentLayers(state.doc)[1].id

    state = dispatchCommand(state, { type: 'layer.setActive', layerId: second }).state
    state = dispatchCommand(state, { type: 'layer.remove', layerId: second }).state

    expect(currentLayers(state.doc)).toHaveLength(1)
    expect(currentActiveLayerId(state.doc)).toBe(currentLayers(state.doc)[0].id)

    const undone = dispatchCommand(state, { type: 'undo' }).state
    expect(currentLayers(undone.doc).map((l) => l.id)).toContain(second)
  })

  it('layer.remove is a no-op on the last remaining layer', () => {
    const doc = makeDoc(4, 4)
    const state = createCoreState(doc)
    const outcome = dispatchCommand(state, { type: 'layer.remove', layerId: currentActiveLayerId(doc) })
    expect(outcome.result.changed).toBe(false)
    expect(currentLayers(outcome.state.doc)).toHaveLength(1)
  })

  it('layer.meta patches name/visible/locked/opacity without touching pixels, and is undoable', () => {
    const doc = makeDoc(4, 4)
    const state = createCoreState(doc)
    const layerId = currentActiveLayerId(doc)

    const outcome = dispatchCommand(state, {
      type: 'layer.meta',
      layerId,
      patch: { visible: false, locked: true, opacity: 50, name: 'Renamed' },
    })

    const layer = currentLayers(outcome.state.doc).find((l) => l.id === layerId)!
    expect(layer.visible).toBe(false)
    expect(layer.locked).toBe(true)
    expect(layer.opacity).toBe(50)
    expect(layer.name).toBe('Renamed')
    expect(outcome.state.history.entries).toHaveLength(1)
  })

  it('layer.meta is a no-op when the patch does not actually change anything', () => {
    const doc = makeDoc(4, 4)
    const state = createCoreState(doc)
    const layerId = currentActiveLayerId(doc)
    const outcome = dispatchCommand(state, { type: 'layer.meta', layerId, patch: { visible: true } }) // already true
    expect(outcome.result.changed).toBe(false)
    expect(outcome.state.history.entries).toHaveLength(0)
  })

  it('layer.reorder moves a layer within the current frame, and is undoable', () => {
    const doc = makeDoc(4, 4, 1, 3)
    const state = createCoreState(doc)
    const ids = currentLayers(state.doc).map((l) => l.id)

    const outcome = dispatchCommand(state, { type: 'layer.reorder', from: 0, to: 2 })
    expect(currentLayers(outcome.state.doc).map((l) => l.id)).toEqual([ids[1], ids[2], ids[0]])
    expect(outcome.state.history.entries).toHaveLength(1)
  })

  it('layer.reorder is a no-op for a fractional from/to, never a crash (fix-agent 7g, item 3)', () => {
    // Before the fix: `from: 1.5` (3 layers, in-range) passed the range
    // guard, then `layers[1.5].id` threw an uncaught TypeError (`layers[1.5]`
    // is `undefined` — array indexing with a non-integer key never matches).
    const doc = makeDoc(4, 4, 1, 3)
    const state = createCoreState(doc)
    const ids = currentLayers(state.doc).map((l) => l.id)
    expect(() => dispatchCommand(state, { type: 'layer.reorder', from: 1.5, to: 2 })).not.toThrow()
    const outcome = dispatchCommand(state, { type: 'layer.reorder', from: 1.5, to: 2 })
    expect(outcome.result.changed).toBe(false)
    expect(currentLayers(outcome.state.doc).map((l) => l.id)).toEqual(ids)
  })
})

describe('frame.select (non-undoable view state) / frame.paste (undoable, phase 2c)', () => {
  it('frame.select switches currentFrameIndex with no history entry and no snapshot step', () => {
    const doc = makeDoc(4, 4, 3, 1)
    const state = createCoreState(doc)

    const outcome = dispatchCommand(state, { type: 'frame.select', index: 2 })
    expect(outcome.state.doc.timeline.currentFrameIndex).toBe(2)
    expect(outcome.state.doc.timeline.selectedFrameIndices).toEqual([2])
    expect(outcome.state.history.entries).toHaveLength(0)
  })

  it('a stroke dispatched after frame.select lands on the NEW current frame only', () => {
    const doc = makeDoc(4, 4, 2, 1)
    let state = createCoreState(doc)
    state = dispatchCommand(state, { type: 'frame.select', index: 1 }).state
    const layerId = currentActiveLayerId(state.doc)

    state = dispatchStroke(state, layerId, [{ x: 0, y: 0 }]).state

    expect(getPixel(currentLayers(state.doc)[0].pixels, 0, 0)).toEqual(RED)
    expect(getPixel(state.doc.timeline.frames[0].layers[0].pixels, 0, 0)).toEqual(TRANSPARENT)
  })

  it('frame.paste is a no-op for a fractional `at`, never a corrupted fractional currentFrameIndex (fix-agent 7g, item 3)', () => {
    // Before the fix: `at: 1.5` survived `Math.max(0, Math.min(at, length))`
    // clamping unchanged (clamping doesn't round), and was stored directly as
    // `currentFrameIndex: 1.5` — `Array.prototype.splice` silently truncates
    // a fractional `start`, so the paste itself landed at index 1, but the
    // STORED `currentFrameIndex` stayed fractional, which would crash the
    // NEXT command (`currentFrame(doc)` reads `frames[1.5]`, `undefined`).
    const doc = makeDoc(4, 4, 1, 1)
    const state = createCoreState(doc)
    const pasted: AnimationFrame[] = [{ id: 'pasted-1', layers: [makeLayer('p1', 4, 4)], activeLayerId: 'p1', durationMs: 83 }]
    const outcome = dispatchCommand(state, { type: 'frame.paste', at: 1.5, frames: pasted.map(frameToSerializedFrame) })
    expect(outcome.result.changed).toBe(false)
    expect(outcome.state.doc.timeline.frames).toHaveLength(1)
    expect(Number.isInteger(outcome.state.doc.timeline.currentFrameIndex)).toBe(true)
  })

  it('frame.paste inserts frames at the given index, selects them, and is undoable as one entry', () => {
    const doc = makeDoc(4, 4, 1, 1)
    const state = createCoreState(doc)
    const pasted: AnimationFrame[] = [
      { id: 'pasted-1', layers: [makeLayer('p1', 4, 4)], activeLayerId: 'p1', durationMs: 83 },
    ]

    const outcome = dispatchCommand(state, { type: 'frame.paste', at: 1, frames: pasted.map(frameToSerializedFrame) })
    expect(outcome.state.doc.timeline.frames).toHaveLength(2)
    // judgment-day round 2 (finding 6): the core deep-copies pasted frames
    // with a FRESH id, never the caller-supplied one — a paste must never
    // alias ids (or buffers) with whatever is still sitting in the
    // clipboard, so a second paste of the same clipboard entry can't
    // collide.
    expect(outcome.state.doc.timeline.frames[1].id).not.toBe('pasted-1')
    expect(outcome.state.doc.timeline.frames[1].layers[0].id).not.toBe('p1')
    expect(outcome.state.doc.timeline.frames[1].layers[0].pixels).not.toBe(pasted[0].layers[0].pixels)
    expect(outcome.state.doc.timeline.currentFrameIndex).toBe(1)
    expect(outcome.state.history.entries).toHaveLength(1)

    const undone = dispatchCommand(outcome.state, { type: 'undo' }).state
    expect(undone.doc.timeline.frames).toHaveLength(1)
  })
})

describe('selection.commit / region.clear via dispatch (undoable, phase 2c)', () => {
  it('selection.commit replaces the target layer pixels, reports the changed rect, and is undoable', () => {
    const doc = makeDoc(2, 2)
    const state = createCoreState(doc)
    const layerId = currentActiveLayerId(doc)

    const newPixels = createEmptyBuffer(2, 2)
    putPixel(newPixels, 0, 0, RED)

    const outcome = dispatchCommand(state, {
      type: 'selection.commit',
      layerId,
      at: { x: 0, y: 0, w: 2, h: 2 },
      pixels: newPixels.data,
    })
    expect(getPixel(currentLayers(outcome.state.doc)[0].pixels, 0, 0)).toEqual(RED)
    expect(outcome.state.history.entries).toHaveLength(1)
    expect(outcome.result.dirty).toHaveLength(1)

    const undone = dispatchCommand(outcome.state, { type: 'undo' }).state
    expect(getPixel(currentLayers(undone.doc)[0].pixels, 0, 0)).toEqual(TRANSPARENT)
  })

  it('selection.commit with byte-identical pixels is a no-op (phase 2c)', () => {
    const doc = makeDoc(2, 2)
    const state = createCoreState(doc)
    const layerId = currentActiveLayerId(doc)
    const samePixels = currentLayers(doc)[0].pixels

    const outcome = dispatchCommand(state, {
      type: 'selection.commit',
      layerId,
      at: { x: 0, y: 0, w: samePixels.w, h: samePixels.h },
      pixels: samePixels.data,
    })
    expect(outcome.result.changed).toBe(false)
    expect(outcome.state.history.entries).toHaveLength(0)
  })

  it('region.clear erases only the given rect, clipped to canvas bounds, and is undoable', () => {
    const doc = makeDoc(4, 4)
    let state = createCoreState(doc)
    const layerId = currentActiveLayerId(doc)
    state = dispatchCommand(state, { type: 'fill', layerId, x: 0, y: 0, rgba: packRgba(RED) }).state
    expect(state.history.entries).toHaveLength(1)

    const outcome = dispatchCommand(state, { type: 'region.clear', layerId, rect: { x: -1, y: -1, w: 3, h: 3 } })

    expect(getPixel(currentLayers(outcome.state.doc)[0].pixels, 0, 0)).toEqual(TRANSPARENT)
    expect(getPixel(currentLayers(outcome.state.doc)[0].pixels, 1, 1)).toEqual(TRANSPARENT)
    expect(getPixel(currentLayers(outcome.state.doc)[0].pixels, 2, 2)).toEqual(RED) // outside the cleared rect
    expect(outcome.state.history.entries).toHaveLength(2) // region.clear IS undoable now — its own 2nd entry

    const undone = dispatchCommand(outcome.state, { type: 'undo' }).state
    expect(getPixel(currentLayers(undone.doc)[0].pixels, 0, 0)).toEqual(RED) // back to the filled state
  })
})

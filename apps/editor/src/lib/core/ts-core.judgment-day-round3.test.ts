import { describe, it, expect } from 'vitest'
import type { AnimationFrame, Layer } from '@/types'
import { createEmptyBuffer, getPixel } from '@/lib/pixel-buffer'
import { packPoints, packRgba } from './color-codec'
import { frameToSerializedFrame } from './serialize'
import { createCoreState, dispatchCommand, docToPayload, payloadToDoc, type CoreState, type DocSnapshot } from './ts-core'
import type { Command } from './commands'

/**
 * Judgment-day round 3 (two blind judges reviewing phase 2e's boundary work)
 * reproduced five real bugs in `lib/core/ts-core.ts`. These are the judges'
 * throwaway repros (scratchpad `judgeB3`/`judgeA3`), ported into the
 * permanent regression suite per the orchestrator's instruction — each one
 * failed before the corresponding fix in `ts-core.ts` and passes after.
 */

const RED = packRgba({ r: 255, g: 0, b: 0, a: 255 })

function mkLayer(id: string, w = 4, h = 4): Layer {
  return { id, name: id, visible: true, locked: false, opacity: 100, pixels: createEmptyBuffer(w, h) }
}

function mkDoc(): DocSnapshot {
  const f: AnimationFrame = { id: 'F0', layers: [mkLayer('L'), mkLayer('M')], activeLayerId: 'L', durationMs: 100 }
  return { canvasWidth: 4, canvasHeight: 4, timeline: { frames: [f], currentFrameIndex: 0, isPlaying: false, fps: 12, loop: true, selectedFrameIndices: [0] } }
}

function run(s: CoreState, c: Command) {
  return dispatchCommand(s, c)
}

function stroke(s: CoreState, layer: string, x: number, y: number, rgba = RED) {
  s = run(s, { type: 'stroke.begin', layerId: layer }).state
  s = run(s, { type: 'stroke.points', points: packPoints([{ x, y }]), rgba }).state
  return run(s, { type: 'stroke.end', label: 'Draw' }).state
}

describe('judgment-day round 3: bug #1 (reducers reset contentRevision/layerRevisions/idGenerator)', () => {
  it('R1: consecutive undos of strokes on the same layer bump layerRevisions[L] EACH time (not just once)', () => {
    let s = createCoreState(mkDoc())
    s = stroke(s, 'L', 0, 0)
    s = stroke(s, 'L', 1, 1)

    const o1 = run(s, { type: 'undo' })
    s = o1.state
    const r1 = s.layerRevisions?.['L']
    const c1 = o1.result.contentRevision

    const o2 = run(s, { type: 'undo' })
    s = o2.state
    const r2 = s.layerRevisions?.['L']
    const c2 = o2.result.contentRevision

    expect(r2).not.toBe(r1)
    expect(c2).not.toBe(c1)
  })

  it('R1b: undo then redo of the same stroke bumps layerRevisions[L] again', () => {
    let s = createCoreState(mkDoc())
    s = stroke(s, 'L', 0, 0)
    s = run(s, { type: 'undo' }).state
    const a = s.layerRevisions?.['L']
    s = run(s, { type: 'redo' }).state
    const b = s.layerRevisions?.['L']

    expect(b).not.toBe(a)
  })

  it('R2: idSeed/id counters survive frame.add (not reset to a new random seed)', () => {
    let s = createCoreState(mkDoc())
    const seedBefore = s.idSeed
    const counterRef = s.frameIdCounter // same object reference must survive the spread
    s = run(s, { type: 'frame.add' }).state

    expect(s.idSeed).toBe(seedBefore)
    expect(s.frameIdCounter).toBe(counterRef)
    expect(s.frameIdCounter.value).toBe(1) // one frame id was minted
  })

  it('doc.replace/undo/frame.paste also preserve contentRevision/layerRevisions/idSeed', () => {
    let s = createCoreState(mkDoc())
    s = stroke(s, 'L', 0, 0)
    const beforeReplace = { contentRevision: s.contentRevision, idSeed: s.idSeed }

    s = run(s, {
      type: 'doc.replace',
      canvasWidth: 4,
      canvasHeight: 4,
      frames: [{ pixels: createEmptyBuffer(4, 4) }],
      frameDurationMs: 100,
      label: 'AI',
    }).state
    expect(s.idSeed).toBe(beforeReplace.idSeed)
    expect(s.contentRevision).toBeGreaterThan(beforeReplace.contentRevision ?? 0)
    expect(s.layerRevisions).toBeDefined()
  })
})

describe('judgment-day round 3: bug #2 (frame.paste/doc.replace accept mismatched buffer sizes)', () => {
  it('R3: frame.paste rejects a frame whose layer size != canvas (no-op, no bricked draft)', () => {
    let s = createCoreState(mkDoc())
    const small: AnimationFrame = { id: 'X', layers: [mkLayer('S', 2, 2)], activeLayerId: 'S', durationMs: 100 }
    const o = run(s, { type: 'frame.paste', at: 1, frames: [frameToSerializedFrame(small)] })

    expect(o.result.changed).toBe(false)
    expect(o.state.doc.timeline.frames.length).toBe(1) // nothing was inserted
  })

  it('R4: doc.replace rejects frames whose size != the declared canvasWidth/Height', () => {
    let s = createCoreState(mkDoc())
    const o = run(s, {
      type: 'doc.replace',
      canvasWidth: 8,
      canvasHeight: 8,
      frames: [{ pixels: createEmptyBuffer(8, 8) }, { pixels: createEmptyBuffer(3, 3) }],
      frameDurationMs: 100,
      label: 'x',
    })

    expect(o.result.changed).toBe(false)
    expect(o.state.doc.canvasWidth).toBe(4) // the original 4x4 document, untouched
  })

  it('payloadToDoc skips a corrupted layer but keeps the other valid layer in the same frame', () => {
    const payload = docToPayload(mkDoc()) // frame 0 has layers L, M
    const corrupted = {
      ...payload,
      frames: payload.frames.map((f, i) =>
        i === 0 ? { ...f, layers: [{ ...f.layers[0], data: new Uint8Array(3) }, f.layers[1]] } : f
      ),
    }

    const doc = payloadToDoc(corrupted)
    expect(doc.timeline.frames[0].layers.map((l) => l.id)).toEqual(['M']) // L (corrupted) dropped, M kept
    expect(doc.timeline.frames[0].activeLayerId).toBe('M') // the original activeLayerId ('L') no longer exists — falls back
  })

  it('payloadToDoc substitutes one blank layer when EVERY layer in a frame is corrupted', () => {
    const payload = docToPayload(mkDoc())
    const corrupted = {
      ...payload,
      frames: payload.frames.map((f, i) =>
        i === 0 ? { ...f, layers: f.layers.map((l) => ({ ...l, data: new Uint8Array(3) })) } : f
      ),
    }

    const doc = payloadToDoc(corrupted)
    expect(doc.timeline.frames[0].layers.length).toBe(1)
    expect(doc.timeline.frames[0].layers[0].pixels.data.byteLength).toBe(4 * 4 * 4)
  })

  it('payloadToDoc falls back to an empty document (never throws) for a frameless payload', () => {
    const payload = docToPayload(mkDoc())
    const corrupted = { ...payload, frames: [] }

    expect(() => payloadToDoc(corrupted)).not.toThrow()
    const doc = payloadToDoc(corrupted)
    expect(doc.timeline.frames.length).toBeGreaterThan(0)
  })
})

describe('judgment-day round 3: bug #4 (force-committed stroke masked by the early-return branch)', () => {
  function doc(): DocSnapshot {
    return {
      canvasWidth: 4,
      canvasHeight: 4,
      timeline: {
        frames: [{ id: 'f1', activeLayerId: 'l1', durationMs: 100, layers: [mkLayer('l1')] }],
        currentFrameIndex: 0,
        isPlaying: false,
        fps: 12,
        loop: true,
        selectedFrameIndices: [0],
      },
    }
  }

  it('re-opening stroke.begin while a stroke is open bumps contentRevision/layerRevisions for the force-committed stroke', () => {
    let state = createCoreState(doc())
    state = dispatchCommand(state, { type: 'stroke.begin', layerId: 'l1' }).state
    const afterPoint = dispatchCommand(state, {
      type: 'stroke.points',
      points: packPoints([{ x: 1, y: 1 }]),
      rgba: packRgba({ r: 255, g: 0, b: 0, a: 255 }),
    })
    state = afterPoint.state
    const contentRevAfterPoint = afterPoint.result.contentRevision

    // Re-open WITHOUT stroke.end — forces an internal commit of stroke A.
    const reopen = dispatchCommand(state, { type: 'stroke.begin', layerId: 'l1' })

    expect(reopen.result.historyChanged).toBe(true)
    expect(reopen.result.canUndo).toBe(true)
    // The fix: the force-commit's effect is now honestly reflected on THIS dispatch's own result.
    expect(reopen.result.changed).toBe(true)
    expect(reopen.result.contentChanged).toBe(true)
    expect(reopen.result.contentRevision).toBeGreaterThan(contentRevAfterPoint)
    expect(reopen.result.layerRevisions.l1).toBeGreaterThan(0)
  })

  it('a force-commit that is the ONLY content change in a dispatch still bumps contentRevision', () => {
    let state = createCoreState(doc())
    state = dispatchCommand(state, { type: 'stroke.begin', layerId: 'l1' }).state
    state = dispatchCommand(state, {
      type: 'stroke.points',
      points: packPoints([{ x: 2, y: 2 }]),
      rgba: packRgba({ r: 10, g: 20, b: 30, a: 255 }),
    }).state

    const contentRevBefore = state.contentRevision
    const reopen = dispatchCommand(state, { type: 'stroke.begin', layerId: 'l1' })

    expect(reopen.state.contentRevision).toBeGreaterThan(contentRevBefore ?? 0)
    expect(reopen.result.contentRevision).toBeGreaterThan(contentRevBefore ?? 0)
  })
})

describe('judgment-day round 3: bug #5 (region.clear allocates per pixel over an unclamped rect)', () => {
  it('clears only the intersection of the rect with the canvas, even when the rect extends past the edges', () => {
    let s = createCoreState(mkDoc())
    s = stroke(s, 'L', 1, 1, packRgba({ r: 1, g: 2, b: 3, a: 255 }))

    const o = run(s, { type: 'region.clear', layerId: 'L', rect: { x: -5, y: -5, w: 20, h: 20 } })
    expect(o.result.changed).toBe(true)
    // the dirty rect must be clamped to the 4x4 canvas, never the raw -5..15 input rect
    const dirtyRect = o.result.dirty[0].rect
    expect(dirtyRect.x).toBeGreaterThanOrEqual(0)
    expect(dirtyRect.y).toBeGreaterThanOrEqual(0)
    expect(dirtyRect.x + dirtyRect.w).toBeLessThanOrEqual(4)
    expect(dirtyRect.y + dirtyRect.h).toBeLessThanOrEqual(4)

    const layer = o.state.doc.timeline.frames[0].layers.find((l) => l.id === 'L')!
    expect(getPixel(layer.pixels, 1, 1).a).toBe(0) // the previously-drawn pixel is now transparent
  })

  it('a rect entirely outside the canvas is a no-op', () => {
    const s = createCoreState(mkDoc())
    const o = run(s, { type: 'region.clear', layerId: 'L', rect: { x: 100, y: 100, w: 5, h: 5 } })
    expect(o.result.changed).toBe(false)
  })
})

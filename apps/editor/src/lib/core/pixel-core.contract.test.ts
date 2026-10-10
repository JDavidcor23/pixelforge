import { describe, it, expect } from 'vitest'
import { createEmptyBuffer, getPixel } from '../pixel-buffer'
import { packPoints, packRgba } from './color-codec'
import { TsPixelCore, type PixelCore } from './pixel-core'
import { setIdSeed, type DocSnapshot } from './ts-core'

/**
 * Core contract test suite (phase 2e, task "add a core contract test suite
 * parameterized over implementations"). ONLY `'ts'` exists today — this is
 * the future TS<->Wasm parity gate design.md's "Testing Strategy" describes
 * (`describe.each(['ts','wasm'])`); phase 4+ adds a `'wasm'` entry to the
 * SAME table below, and every test here must keep passing for BOTH without
 * modification, because it only talks to the `PixelCore` interface, never
 * TS-specific internals.
 */

const RED = packRgba({ r: 255, g: 0, b: 0, a: 255 })
const GREEN = packRgba({ r: 0, g: 255, b: 0, a: 255 })

function makeDoc(w = 4, h = 4): DocSnapshot {
  const layer = { id: 'L0', name: 'Layer 1', visible: true, locked: false, opacity: 100, pixels: createEmptyBuffer(w, h) }
  return {
    canvasWidth: w,
    canvasHeight: h,
    timeline: {
      frames: [{ id: 'F0', layers: [layer], activeLayerId: 'L0', durationMs: 83 }],
      currentFrameIndex: 0,
      isPlaying: false,
      fps: 12,
      loop: true,
      selectedFrameIndices: [0],
    },
  }
}

interface ContractCase {
  readonly name: 'ts'
  readonly make: () => PixelCore
}

const implementations: readonly ContractCase[] = [{ name: 'ts', make: () => new TsPixelCore(makeDoc()) }]

describe.each(implementations)('PixelCore contract ($name)', ({ make }) => {
  it('dispatch is observable: a stroke writes a pixel readable back via readLayer', () => {
    const core = make()
    core.dispatch({ type: 'stroke.begin', layerId: 'L0' })
    core.dispatch({ type: 'stroke.points', points: packPoints([{ x: 0, y: 0 }]), rgba: RED })
    core.dispatch({ type: 'stroke.end', label: 'Draw' })

    const data = core.readLayer('F0', 'L0')
    expect(data[0]).toBe(255) // R
    expect(data[3]).toBe(255) // A
  })

  it('undo/redo round-trips to byte-identical state', () => {
    const core = make()
    core.dispatch({ type: 'stroke.begin', layerId: 'L0' })
    core.dispatch({ type: 'stroke.points', points: packPoints([{ x: 1, y: 1 }]), rgba: RED })
    core.dispatch({ type: 'stroke.end', label: 'Draw' })
    const afterDraw = core.readLayer('F0', 'L0').slice()

    expect(core.canUndo).toBe(true)
    core.undo()
    expect(core.canUndo).toBe(false)
    expect(core.canRedo).toBe(true)

    core.redo()
    expect(core.canRedo).toBe(false)
    expect(core.readLayer('F0', 'L0')).toEqual(afterDraw)
  })

  it('exportDocument/importDocument round-trips byte-identical content', () => {
    const core = make()
    core.dispatch({ type: 'fill', layerId: 'L0', x: 0, y: 0, rgba: GREEN })
    const exported = core.exportDocument()

    core.importDocument(exported)

    expect(core.exportDocument()).toEqual(exported)
    expect(core.canUndo).toBe(false) // importDocument resets history, same as production `importDocument`
  })

  it('unknown ids are boundary-validated no-ops, never a throw', () => {
    const core = make()
    expect(() => core.readLayer('ghost-frame', 'ghost-layer')).not.toThrow()
    expect(core.readLayer('ghost-frame', 'ghost-layer').length).toBe(0)

    const outcome = core.dispatch({ type: 'layer.setActive', layerId: 'ghost-layer' })
    expect(outcome.changed).toBe(false)
  })

  it('a deterministic id seed produces reproducible ids for the same command script (the TS<->Wasm parity gate)', () => {
    setIdSeed('parity-test')
    const coreA = make()
    setIdSeed('parity-test')
    const coreB = make()

    coreA.dispatch({ type: 'layer.add' })
    coreA.dispatch({ type: 'frame.add' })
    coreB.dispatch({ type: 'layer.add' })
    coreB.dispatch({ type: 'frame.add' })

    expect(coreA.exportDocument()).toEqual(coreB.exportDocument())
  })

  it('getPixel over the readLayer view matches the committed stroke color', () => {
    const core = make()
    core.dispatch({ type: 'stroke.begin', layerId: 'L0' })
    core.dispatch({ type: 'stroke.points', points: packPoints([{ x: 2, y: 2 }]), rgba: GREEN })
    core.dispatch({ type: 'stroke.end', label: 'Draw' })

    const data = core.readLayer('F0', 'L0')
    const color = getPixel({ w: 4, h: 4, data }, 2, 2)
    expect(color).toEqual({ r: 0, g: 255, b: 0, a: 255 })
  })
})

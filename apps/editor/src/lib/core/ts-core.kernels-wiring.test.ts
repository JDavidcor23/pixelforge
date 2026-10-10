/**
 * Phase 5: proves `ts-core.ts`'s `fill` case actually CALLS
 * `getActiveKernels().floodFill(...)` and uses its return value — not just
 * that the default (TS) path still produces correct pixels (every other
 * `fill`-dispatching test in this suite already covers that). Mocks
 * `./kernels` with a fake `PixelKernels` whose `floodFill` writes an
 * intentionally-WRONG, easily-recognizable pattern and reports a distinctive
 * dirty rect — if `dispatchCommand`'s `fill` case ever stopped calling the
 * resolved kernel (e.g. a regression back to a hardcoded import), this test
 * would see the OLD correct flood-fill output instead of the fake's, and
 * fail.
 */
import { describe, expect, it, vi } from 'vitest'
import type { AnimationFrame, Layer } from '@/types'
import { createEmptyBuffer, getPixel } from '../pixel-buffer'
import { packRgba } from './color-codec'
import type { PixelKernels } from '@pixelforge/core'

const fakeFloodFill = vi.fn<PixelKernels['floodFill']>((data, _w, _h, _x, _y) => {
  // writes a single recognizable pixel at (0,0) regardless of seed/size —
  // nothing like a real 4-connected flood fill would ever produce for a
  // seed at (2,2) on a uniform canvas (a real fill would touch EVERY pixel).
  data[0] = 1
  data[1] = 2
  data[2] = 3
  data[3] = 4
  return [0, 0, 1, 1]
})

vi.mock('./kernels', () => ({
  getActiveKernels: (): PixelKernels => ({
    impl: 'wasm',
    floodFill: fakeFloodFill,
    putPoints: () => 0,
    cloneBuffer: (d) => new Uint8Array(d),
    diffRect: () => undefined,
    extractRect: () => undefined,
    writeRect: () => false,
    bytesEqual: (a, b) => a.length === b.length,
    quantize: () => undefined,
    downscale: () => undefined,
  }),
}))

function makeLayer(id: string, w: number, h: number): Layer {
  return { id, name: `Layer ${id}`, visible: true, locked: false, opacity: 100, pixels: createEmptyBuffer(w, h) }
}

function makeDoc(w: number, h: number) {
  const layers = [makeLayer('L0', w, h)]
  const frame: AnimationFrame = { id: 'f0', layers, activeLayerId: 'L0', durationMs: 83 }
  return {
    canvasWidth: w,
    canvasHeight: h,
    timeline: { frames: [frame], currentFrameIndex: 0, isPlaying: false, fps: 12, loop: true, selectedFrameIndices: [0] },
  }
}

describe('ts-core "fill" is wired to the resolved PixelKernels (phase 5)', () => {
  it("dispatching 'fill' calls getActiveKernels().floodFill and writes exactly what it returned", async () => {
    const { createCoreState, dispatchCommand, currentLayers } = await import('./ts-core')
    const doc = makeDoc(4, 4)
    const state = createCoreState(doc)

    const outcome = dispatchCommand(state, { type: 'fill', layerId: 'L0', x: 2, y: 2, rgba: packRgba({ r: 9, g: 9, b: 9, a: 255 }) })

    expect(fakeFloodFill).toHaveBeenCalledTimes(1)
    const [, w, h, x, y, rgba] = fakeFloodFill.mock.calls[0]
    expect([w, h, x, y]).toEqual([4, 4, 2, 2])
    expect(rgba).toBe(packRgba({ r: 9, g: 9, b: 9, a: 255 }))

    // the result reflects the FAKE kernel's output, not a real flood fill
    const resultLayer = currentLayers(outcome.state.doc)[0]
    expect(getPixel(resultLayer.pixels, 0, 0)).toEqual({ r: 1, g: 2, b: 3, a: 4 })
    expect(getPixel(resultLayer.pixels, 3, 3)).toEqual({ r: 0, g: 0, b: 0, a: 0 }) // untouched — a real fill from (2,2) on a uniform canvas would have filled this too

    expect(outcome.result.changed).toBe(true)
    expect(outcome.result.dirty).toEqual([{ frameId: 'f0', layerId: 'L0', rect: { x: 0, y: 0, w: 1, h: 1 } }])
  })

  it("a kernel reporting 'undefined' (its own no-op) is a true dispatch no-op — no history entry, no dirty rect", async () => {
    fakeFloodFill.mockImplementationOnce(() => undefined)
    const { createCoreState, dispatchCommand } = await import('./ts-core')
    const doc = makeDoc(4, 4)
    const state = createCoreState(doc)

    const outcome = dispatchCommand(state, { type: 'fill', layerId: 'L0', x: 0, y: 0, rgba: 0 })
    expect(outcome.result.changed).toBe(false)
    expect(outcome.result.dirty).toEqual([])
    expect(outcome.state.history.entries).toHaveLength(0)
  })
})

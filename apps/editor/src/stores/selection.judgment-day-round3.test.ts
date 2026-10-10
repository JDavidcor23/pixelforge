import { describe, it, expect, beforeEach } from 'vitest'
import { useSpriteEditorStore } from './index'
import { createEmptyBuffer, getPixel } from '@/lib'
import { packPoints, packRgba } from '@/lib/core/color-codec'
import { timelineToDocumentPayload } from '@/lib/core/test-helpers'
import type { Layer, Timeline } from '@/types'

// Pixel content doesn't matter for layer metadata here — a tiny 4x4 canvas
// is enough to exercise floating-selection baking.
const emptyPixels = () => createEmptyBuffer(4, 4)

function seedLayers(layers: Layer[], activeLayerId = layers[0].id) {
  const timeline: Timeline = {
    frames: [{ id: 'frame-0', layers, activeLayerId, durationMs: 83 }],
    currentFrameIndex: 0,
    isPlaying: false,
    fps: 12,
    loop: true,
    selectedFrameIndices: [0],
  }
  useSpriteEditorStore.getState().importDocument(timelineToDocumentPayload(timeline, 4, 4))
}

/**
 * Judgment-day round 3, bug #3 (WARNING-real): a floating selection used to
 * bake into whichever layer was ACTIVE at commit time, not the layer it was
 * lifted FROM. Ported from the judge's `float.test.ts` ("F1") repro.
 */
describe('judgment-day round 3 bug #3: floating selection is bound to its source layer', () => {
  beforeEach(() => {
    seedLayers([
      { id: 'L', name: 'Layer 1', visible: true, locked: false, opacity: 100, pixels: emptyPixels() },
      { id: 'M', name: 'Layer 2', visible: true, locked: false, opacity: 100, pixels: emptyPixels() },
    ])
    useSpriteEditorStore.setState({ selection: null, activeTool: 'pencil' })
  })

  it('F1: float lifted from L, active layer switched to M, commit bakes into L — M is left untouched', () => {
    const st = () => useSpriteEditorStore.getState()
    const paint = (layer: string, x: number, color: number) => {
      st().setActiveLayer(layer)
      st().dispatch({ type: 'stroke.begin', layerId: layer })
      st().dispatch({ type: 'stroke.points', points: packPoints([{ x, y: 0 }]), rgba: color })
      st().dispatch({ type: 'stroke.end', label: 'Draw' })
    }

    paint('M', 0, packRgba({ r: 0, g: 0, b: 255, a: 255 })) // M(0,0) = blue
    paint('L', 0, packRgba({ r: 255, g: 0, b: 0, a: 255 })) // L(0,0) = red

    st().setActiveLayer('L')
    st().setSelection({ rect: { x: 0, y: 0, width: 1, height: 1 }, rotation: 0, scaleX: 1, scaleY: 1, floatingPixels: null, originalArea: null })
    st().floatSelection() // sourceLayerId/sourceFrameId = L / frame-0

    st().setActiveLayer('M') // bug repro: this used to just flip activeLayerId with no commit
    st().setSelectionTransform({ x: 2, y: 0, rotation: 0, scaleX: 1, scaleY: 1 })
    st().commitTransformation() // by now `selection` is already null (committed to L on the setActiveLayer above) — this is a no-op

    const layer = (id: string) => st().timeline.frames[st().timeline.currentFrameIndex].layers.find((l) => l.id === id)!

    expect(getPixel(layer('M').pixels, 0, 0)).toEqual({ r: 0, g: 0, b: 255, a: 255 }) // M's own stroke, untouched
    expect(getPixel(layer('L').pixels, 0, 0)).toEqual({ r: 255, g: 0, b: 0, a: 255 }) // the float baked back into L, not moved
    expect(st().selection).toBeNull()
  })

  it('committing with no pending float is a safe no-op', () => {
    useSpriteEditorStore.getState().commitTransformation()
    expect(useSpriteEditorStore.getState().selection).toBeNull()
  })

  it('cancels the float (does not throw) if its source layer was removed while floating', () => {
    const st = () => useSpriteEditorStore.getState()
    st().setActiveLayer('L')
    st().setSelection({ rect: { x: 0, y: 0, width: 1, height: 1 }, rotation: 0, scaleX: 1, scaleY: 1, floatingPixels: null, originalArea: null })
    st().floatSelection()

    // `removeLayer` commits (or cancels) the float itself before removing —
    // since the source (L) is still current at that point, this exercises
    // the "frame/layer no longer exists" defensive branch only indirectly;
    // the direct contract is: calling commitTransformation after the source
    // is gone never throws.
    st().removeLayer('L')
    expect(() => st().commitTransformation()).not.toThrow()
  })
})

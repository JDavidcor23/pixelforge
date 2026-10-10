import { describe, it, expect, beforeEach } from 'vitest'
import { useSpriteEditorStore } from './index'
import { createEmptyBuffer } from '@/lib'
import { timelineToDocumentPayload } from '@/lib/core/test-helpers'
import type { Layer, Timeline } from '@/types'

// These tests exercise layer metadata only (name, order) — pixel content is
// irrelevant, so a minimal 1x1 buffer stands in for a real sprite.
const emptyPixels = () => createEmptyBuffer(1, 1)

/**
 * Phase 2e: layer CRUD is routed through `dispatch`, which reads the
 * document from `timeline.frames[currentFrameIndex]` — the single source of
 * truth. `core.slice.ts` no longer re-syncs from zustand state on every
 * dispatch (`syncCore` is gone), so seeding must go through `importDocument`
 * — the same path production code uses to restore a draft — instead of a
 * raw `setState({ layers, timeline })`. See `lib/core/test-helpers.ts`.
 */
function seedLayers(layers: Layer[], activeLayerId = layers[0].id) {
  const timeline: Timeline = {
    frames: [{ id: 'frame-0', layers, activeLayerId, durationMs: 83 }],
    currentFrameIndex: 0,
    isPlaying: false,
    fps: 12,
    loop: true,
    selectedFrameIndices: [0],
  }
  useSpriteEditorStore.getState().importDocument(timelineToDocumentPayload(timeline, 1, 1))
}

describe('useSpriteEditorStore - Layer Actions', () => {
  beforeEach(() => {
    seedLayers([
      {
        id: 'layer-1',
        name: 'Layer 1',
        visible: true,
        locked: false,
        opacity: 100,
        pixels: emptyPixels(),
      },
    ])
  })

  it('should update the name of a specific layer', () => {
    const { updateLayerName } = useSpriteEditorStore.getState()

    updateLayerName('layer-1', 'New Layer Name')

    const state = useSpriteEditorStore.getState()
    const layer = state.layers.find(l => l.id === 'layer-1')
    expect(layer?.name).toBe('New Layer Name')
  })

  it('should not update other layers', () => {
    seedLayers([
      { id: 'l1', name: 'L1', visible: true, locked: false, opacity: 100, pixels: emptyPixels() },
      { id: 'l2', name: 'L2', visible: true, locked: false, opacity: 100, pixels: emptyPixels() }
    ])

    const { updateLayerName } = useSpriteEditorStore.getState()
    updateLayerName('l1', 'Renamed L1')

    const state = useSpriteEditorStore.getState()
    expect(state.layers.find(l => l.id === 'l1')?.name).toBe('Renamed L1')
    expect(state.layers.find(l => l.id === 'l2')?.name).toBe('L2')
  })

  describe('reorderLayers', () => {
    beforeEach(() => {
      seedLayers([
        { id: 'l1', name: 'L1', visible: true, locked: false, opacity: 100, pixels: emptyPixels() }, // Index 0 (bottom)
        { id: 'l2', name: 'L2', visible: true, locked: false, opacity: 100, pixels: emptyPixels() }, // Index 1
        { id: 'l3', name: 'L3', visible: true, locked: false, opacity: 100, pixels: emptyPixels() }  // Index 2 (top)
      ])
    })

    it('should move a layer from index 0 to index 2', () => {
      const { reorderLayers } = useSpriteEditorStore.getState()
      reorderLayers(0, 2)

      const state = useSpriteEditorStore.getState()
      expect(state.layers[0].id).toBe('l2')
      expect(state.layers[1].id).toBe('l3')
      expect(state.layers[2].id).toBe('l1')
    })

    it('should move a layer from index 2 to index 1', () => {
      const { reorderLayers } = useSpriteEditorStore.getState()
      reorderLayers(2, 1)

      const state = useSpriteEditorStore.getState()
      expect(state.layers[0].id).toBe('l1')
      expect(state.layers[1].id).toBe('l3')
      expect(state.layers[2].id).toBe('l2')
    })
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { useSpriteEditorStore } from './index'

describe('useSpriteEditorStore - Layer Actions', () => {
  beforeEach(() => {
    useSpriteEditorStore.setState({
      layers: [
        {
          id: 'layer-1',
          name: 'Layer 1',
          visible: true,
          locked: false,
          opacity: 100,
          pixels: []
        }
      ],
      activeLayerId: 'layer-1'
    })
  })

  it('should update the name of a specific layer', () => {
    const { updateLayerName } = useSpriteEditorStore.getState()
    
    updateLayerName('layer-1', 'New Layer Name')
    
    const state = useSpriteEditorStore.getState()
    const layer = state.layers.find(l => l.id === 'layer-1')
    expect(layer?.name).toBe('New Layer Name')
  })

  it('should not update other layers', () => {
    useSpriteEditorStore.setState({
      layers: [
        { id: 'l1', name: 'L1', visible: true, locked: false, opacity: 100, pixels: [] },
        { id: 'l2', name: 'L2', visible: true, locked: false, opacity: 100, pixels: [] }
      ]
    })
    
    const { updateLayerName } = useSpriteEditorStore.getState()
    updateLayerName('l1', 'Renamed L1')
    
    const state = useSpriteEditorStore.getState()
    expect(state.layers.find(l => l.id === 'l1')?.name).toBe('Renamed L1')
    expect(state.layers.find(l => l.id === 'l2')?.name).toBe('L2')
  })

  describe('reorderLayers', () => {
    beforeEach(() => {
      useSpriteEditorStore.setState({
        layers: [
          { id: 'l1', name: 'L1', visible: true, locked: false, opacity: 100, pixels: [] }, // Index 0 (bottom)
          { id: 'l2', name: 'L2', visible: true, locked: false, opacity: 100, pixels: [] }, // Index 1
          { id: 'l3', name: 'L3', visible: true, locked: false, opacity: 100, pixels: [] }  // Index 2 (top)
        ]
      })
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

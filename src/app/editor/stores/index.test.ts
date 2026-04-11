import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSpriteEditorStore } from './index'

describe('useSpriteEditorStore - Tool Transitions', () => {
  beforeEach(() => {
    // Reset store state if needed, though with persist it might be tricky.
    // For these tests, we'll just set the state manually at start.
    useSpriteEditorStore.setState({
      activeTool: 'pencil',
      selection: null,
    })
  })

  it('should clear selection when switching from select to pencil', () => {
    useSpriteEditorStore.setState({
      activeTool: 'select',
      selection: {
        rect: { x: 0, y: 0, width: 10, height: 10 },
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        floatingPixels: null,
        originalArea: null
      }
    })

    const { setActiveTool } = useSpriteEditorStore.getState()
    setActiveTool('pencil')

    const state = useSpriteEditorStore.getState()
    expect(state.activeTool).toBe('pencil')
    expect(state.selection).toBeNull()
  })

  it('should commit transformation and clear selection when switching from transform to select', () => {
    const commitTransformationSpy = vi.fn()
    
    useSpriteEditorStore.setState({
      activeTool: 'transform',
      selection: {
        rect: { x: 5, y: 5, width: 10, height: 10 },
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        floatingPixels: [[{ r: 255, g: 0, b: 0, a: 255 }]],
        originalArea: { x: 0, y: 0, width: 1, height: 1 }
      },
      // Mock commitTransformation since we want to verify it's called
      // and it's responsible for clearing selection in real code.
      commitTransformation: commitTransformationSpy
    })

    const { setActiveTool } = useSpriteEditorStore.getState()
    setActiveTool('select')

    expect(commitTransformationSpy).toHaveBeenCalled()
    // In real code, commitTransformation clears selection.
    // Here we just verify it was called when switching from transform to select.
  })

  it('should NOT clear selection when switching from select to transform', () => {
    const selection = {
      rect: { x: 0, y: 0, width: 10, height: 10 },
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      floatingPixels: null,
      originalArea: null
    }

    useSpriteEditorStore.setState({
      activeTool: 'select',
      selection
    })

    const { setActiveTool } = useSpriteEditorStore.getState()
    setActiveTool('transform')

    const state = useSpriteEditorStore.getState()
    expect(state.activeTool).toBe('transform')
    expect(state.selection).toEqual(selection)
  })
})

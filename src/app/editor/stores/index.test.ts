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

// ── Helpers ──────────────────────────────────────────────────────────

const RED = { r: 255, g: 0, b: 0, a: 255 }
const GREEN = { r: 0, g: 255, b: 0, a: 255 }
const BLUE = { r: 0, g: 0, b: 255, a: 255 }
const TRANSPARENT = { r: 0, g: 0, b: 0, a: 0 }

function make2x2Buffer() {
  return [
    [{ ...RED }, { ...GREEN }],
    [{ ...BLUE }, { ...RED }],
  ]
}

function setupWithSelection() {
  const pixels = make2x2Buffer()
  useSpriteEditorStore.setState({
    canvasWidth: 2,
    canvasHeight: 2,
    layers: [{
      id: 'layer-1',
      name: 'Layer 1',
      visible: true,
      locked: false,
      opacity: 100,
      pixels,
    }],
    activeLayerId: 'layer-1',
    activeTool: 'select',
    selection: {
      rect: { x: 0, y: 0, width: 2, height: 1 },
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      floatingPixels: null,
      originalArea: null,
    },
    clipboard: null,
  })
}

describe('useSpriteEditorStore - Copy', () => {
  beforeEach(setupWithSelection)

  it('should copy selected pixels to clipboard', () => {
    const { copySelection } = useSpriteEditorStore.getState()
    copySelection()

    const state = useSpriteEditorStore.getState()
    expect(state.clipboard).not.toBeNull()
    expect(state.clipboard).toHaveLength(1)     // 1 row (height=1)
    expect(state.clipboard![0]).toHaveLength(2)  // 2 cols (width=2)
    expect(state.clipboard![0][0]).toEqual(RED)
    expect(state.clipboard![0][1]).toEqual(GREEN)
  })

  it('should NOT modify the layer pixels on copy', () => {
    const { copySelection } = useSpriteEditorStore.getState()
    copySelection()

    const state = useSpriteEditorStore.getState()
    const layer = state.layers.find(l => l.id === 'layer-1')!
    expect(layer.pixels[0][0]).toEqual(RED)
    expect(layer.pixels[0][1]).toEqual(GREEN)
  })

  it('should do nothing if no selection exists', () => {
    useSpriteEditorStore.setState({ selection: null })

    const { copySelection } = useSpriteEditorStore.getState()
    copySelection()

    const state = useSpriteEditorStore.getState()
    expect(state.clipboard).toBeNull()
  })
})

describe('useSpriteEditorStore - Cut', () => {
  beforeEach(setupWithSelection)

  it('should copy selected pixels to clipboard and erase them from the layer', () => {
    const { cutSelection } = useSpriteEditorStore.getState()
    cutSelection()

    const state = useSpriteEditorStore.getState()
    // Clipboard should have the pixels
    expect(state.clipboard).not.toBeNull()
    expect(state.clipboard![0][0]).toEqual(RED)
    expect(state.clipboard![0][1]).toEqual(GREEN)

    // Layer should have transparent pixels where the selection was
    const layer = state.layers.find(l => l.id === 'layer-1')!
    expect(layer.pixels[0][0]).toEqual(TRANSPARENT)
    expect(layer.pixels[0][1]).toEqual(TRANSPARENT)

    // Unaffected pixels remain
    expect(layer.pixels[1][0]).toEqual(BLUE)
    expect(layer.pixels[1][1]).toEqual(RED)
  })

  it('should clear the selection after cut', () => {
    const { cutSelection } = useSpriteEditorStore.getState()
    cutSelection()

    const state = useSpriteEditorStore.getState()
    expect(state.selection).toBeNull()
  })
})

describe('useSpriteEditorStore - Paste', () => {
  beforeEach(() => {
    setupWithSelection()
    // Pre-fill the clipboard
    useSpriteEditorStore.setState({
      clipboard: [[{ ...GREEN }, { ...BLUE }]],
    })
  })

  it('should create a floating selection from clipboard contents', () => {
    const { pasteClipboard } = useSpriteEditorStore.getState()
    pasteClipboard()

    const state = useSpriteEditorStore.getState()
    expect(state.selection).not.toBeNull()
    expect(state.selection!.floatingPixels).not.toBeNull()
    expect(state.selection!.floatingPixels![0][0]).toEqual(GREEN)
    expect(state.selection!.floatingPixels![0][1]).toEqual(BLUE)
  })

  it('should switch to transform tool on paste', () => {
    const { pasteClipboard } = useSpriteEditorStore.getState()
    pasteClipboard()

    const state = useSpriteEditorStore.getState()
    expect(state.activeTool).toBe('transform')
  })

  it('should do nothing if clipboard is empty', () => {
    useSpriteEditorStore.setState({ clipboard: null })

    const { pasteClipboard } = useSpriteEditorStore.getState()
    pasteClipboard()

    const state = useSpriteEditorStore.getState()
    expect(state.selection).not.toBeNull() // unchanged from setupWithSelection
  })
})

describe('useSpriteEditorStore - Delete Selection', () => {
  beforeEach(setupWithSelection)

  it('should erase selected pixels and clear selection', () => {
    const { deleteSelection } = useSpriteEditorStore.getState()
    deleteSelection()

    const state = useSpriteEditorStore.getState()
    const layer = state.layers.find(l => l.id === 'layer-1')!
    expect(layer.pixels[0][0]).toEqual(TRANSPARENT)
    expect(layer.pixels[0][1]).toEqual(TRANSPARENT)
    expect(layer.pixels[1][0]).toEqual(BLUE)
    expect(state.selection).toBeNull()
  })
})

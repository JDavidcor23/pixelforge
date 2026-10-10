import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSpriteEditorStore } from './index'
import { createEmptyBuffer, getPixel, putPixel } from '@/lib'
import { packPoints, packRgba } from '@/lib/core/color-codec'
import { timelineToDocumentPayload } from '@/lib/core/test-helpers'
import type { PixelBuffer, RgbaColor, Timeline } from '@/types'

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
        floatingPixels: (() => {
          const buf = createEmptyBuffer(1, 1)
          putPixel(buf, 0, 0, { r: 255, g: 0, b: 0, a: 255 })
          return buf
        })(),
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

const RED: RgbaColor = { r: 255, g: 0, b: 0, a: 255 }
const GREEN: RgbaColor = { r: 0, g: 255, b: 0, a: 255 }
const BLUE: RgbaColor = { r: 0, g: 0, b: 255, a: 255 }
const TRANSPARENT: RgbaColor = { r: 0, g: 0, b: 0, a: 0 }

function make2x2Buffer(): PixelBuffer {
  const buf = createEmptyBuffer(2, 2)
  putPixel(buf, 0, 0, RED)
  putPixel(buf, 1, 0, GREEN)
  putPixel(buf, 0, 1, BLUE)
  putPixel(buf, 1, 1, RED)
  return buf
}

/**
 * Phase 2e: `core.slice.ts` no longer re-syncs from zustand state on every
 * dispatch (`syncCore` is gone), so seeding the document must go through
 * `importDocument` — the same path production code uses to restore a draft —
 * instead of a raw `setState({ layers, timeline, ... })`. See
 * `lib/core/test-helpers.ts`.
 */
function setupWithSelection() {
  const pixels = make2x2Buffer()
  const layers = [{
    id: 'layer-1',
    name: 'Layer 1',
    visible: true,
    locked: false,
    opacity: 100,
    pixels,
  }]
  const timeline: Timeline = {
    frames: [{ id: 'frame-0', layers, activeLayerId: 'layer-1', durationMs: 83 }],
    currentFrameIndex: 0,
    isPlaying: false,
    fps: 12,
    loop: true,
    selectedFrameIndices: [0],
  }
  useSpriteEditorStore.getState().importDocument(timelineToDocumentPayload(timeline, 2, 2))

  useSpriteEditorStore.setState({
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
    expect(state.clipboard!.h).toBe(1)  // 1 row (height=1)
    expect(state.clipboard!.w).toBe(2)  // 2 cols (width=2)
    expect(getPixel(state.clipboard!, 0, 0)).toEqual(RED)
    expect(getPixel(state.clipboard!, 1, 0)).toEqual(GREEN)
  })

  it('should NOT modify the layer pixels on copy', () => {
    const { copySelection } = useSpriteEditorStore.getState()
    copySelection()

    const state = useSpriteEditorStore.getState()
    const layer = state.layers.find(l => l.id === 'layer-1')!
    expect(getPixel(layer.pixels, 0, 0)).toEqual(RED)
    expect(getPixel(layer.pixels, 1, 0)).toEqual(GREEN)
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
    expect(getPixel(state.clipboard!, 0, 0)).toEqual(RED)
    expect(getPixel(state.clipboard!, 1, 0)).toEqual(GREEN)

    // Layer should have transparent pixels where the selection was
    const layer = state.layers.find(l => l.id === 'layer-1')!
    expect(getPixel(layer.pixels, 0, 0)).toEqual(TRANSPARENT)
    expect(getPixel(layer.pixels, 1, 0)).toEqual(TRANSPARENT)

    // Unaffected pixels remain
    expect(getPixel(layer.pixels, 0, 1)).toEqual(BLUE)
    expect(getPixel(layer.pixels, 1, 1)).toEqual(RED)
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
    const clipboard = createEmptyBuffer(2, 1)
    putPixel(clipboard, 0, 0, GREEN)
    putPixel(clipboard, 1, 0, BLUE)
    useSpriteEditorStore.setState({ clipboard })
  })

  it('should create a floating selection from clipboard contents', () => {
    const { pasteClipboard } = useSpriteEditorStore.getState()
    pasteClipboard()

    const state = useSpriteEditorStore.getState()
    expect(state.selection).not.toBeNull()
    expect(state.selection!.floatingPixels).not.toBeNull()
    expect(getPixel(state.selection!.floatingPixels!, 0, 0)).toEqual(GREEN)
    expect(getPixel(state.selection!.floatingPixels!, 1, 0)).toEqual(BLUE)
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
    expect(getPixel(layer.pixels, 0, 0)).toEqual(TRANSPARENT)
    expect(getPixel(layer.pixels, 1, 0)).toEqual(TRANSPARENT)
    expect(getPixel(layer.pixels, 0, 1)).toEqual(BLUE)
    expect(state.selection).toBeNull()
  })
})

// ── Judgment-day round 2 ──────────────────────────────────────────────

describe('useSpriteEditorStore - judgment-day round 2 / finding 5: docRevision is content-only (autosave split)', () => {
  it('judgeB2 repro: playback frame navigation does NOT bump docRevision — only a real edit does', () => {
    const { addFrame, goToNextFrame, goToPreviousFrame } = useSpriteEditorStore.getState()
    addFrame() // need a 2nd frame for navigation to actually move
    const r0 = useSpriteEditorStore.getState().docRevision

    goToNextFrame()
    goToPreviousFrame()
    goToNextFrame()

    expect(useSpriteEditorStore.getState().docRevision).toBe(r0)

    // Sanity: a real document edit on the (now-current) frame DOES bump it.
    const { dispatch, activeLayerId } = useSpriteEditorStore.getState()
    dispatch({ type: 'stroke.begin', layerId: activeLayerId })
    dispatch({ type: 'stroke.points', points: packPoints([{ x: 0, y: 0 }]), rgba: packRgba(RED) })
    dispatch({ type: 'stroke.end', label: 'Draw' })
    expect(useSpriteEditorStore.getState().docRevision).toBeGreaterThan(r0)
  })

  it('toggling playback/fps/loop does not bump docRevision either', () => {
    const { togglePlayback, setFps, toggleLoop } = useSpriteEditorStore.getState()
    const r0 = useSpriteEditorStore.getState().docRevision

    togglePlayback()
    setFps(24)
    toggleLoop()

    expect(useSpriteEditorStore.getState().docRevision).toBe(r0)
  })
})

describe('useSpriteEditorStore - judgment-day round 2 / finding 1 + 9: layerRevisions and isStrokeOpen', () => {
  it('layerRevisions bumps for the drawn layer on every stroke.points batch', () => {
    const { dispatch, activeLayerId } = useSpriteEditorStore.getState()
    dispatch({ type: 'stroke.begin', layerId: activeLayerId })
    const rev0 = useSpriteEditorStore.getState().layerRevisions[activeLayerId] ?? 0

    dispatch({ type: 'stroke.points', points: packPoints([{ x: 0, y: 0 }]), rgba: packRgba(RED) })
    const rev1 = useSpriteEditorStore.getState().layerRevisions[activeLayerId]
    expect(rev1).toBeGreaterThan(rev0)

    dispatch({ type: 'stroke.points', points: packPoints([{ x: 1, y: 0 }]), rgba: packRgba(RED) })
    expect(useSpriteEditorStore.getState().layerRevisions[activeLayerId]).toBeGreaterThan(rev1)

    dispatch({ type: 'stroke.end', label: 'Draw' })
  })

  it('isStrokeOpen flips to false when a command OTHER than stroke.end force-commits the open stroke mid-drag', () => {
    const { addFrame, dispatch, setCurrentFrame } = useSpriteEditorStore.getState()
    addFrame() // 2 frames — frame.select to the other one is a valid, stroke-committing navigation
    setCurrentFrame(0)

    dispatch({ type: 'stroke.begin', layerId: useSpriteEditorStore.getState().activeLayerId })
    dispatch({
      type: 'stroke.points',
      points: packPoints([{ x: 0, y: 0 }]),
      rgba: packRgba(RED),
    })
    expect(useSpriteEditorStore.getState().isStrokeOpen).toBe(true)

    // A mid-drag frame switch (same mechanism a Ctrl+Z/tool-switch uses) —
    // the canvas interaction hook never called stroke.end itself.
    setCurrentFrame(1)

    expect(useSpriteEditorStore.getState().isStrokeOpen).toBe(false)
  })
})

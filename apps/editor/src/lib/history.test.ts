import { describe, it, expect } from 'vitest'
import type { AnimationFrame, Layer } from '@/types'
import { cloneLayers, cloneFrames } from './history'
import { createEmptyBuffer, getPixel, putPixel } from './pixel-buffer'

// Characterization tests for the frame-switch working-copy clone helpers.
// Phase 2 (migrate-to-rust-core) removed this file's old `createSnapshot` /
// `HistoryEntry` tests — the undo/redo history itself moved to
// `lib/core/history.ts` (dirty-rect based, see `lib/core/history.test.ts`
// and `lib/core/ts-core.test.ts`). `cloneLayers`/`cloneFrames` stay: they
// still back `saveCurrentFrameSnapshot`/`restoreFrameSnapshot`, which were
// NOT migrated to the dispatch seam in phase 2 (documented deviation).

const RED = { r: 255, g: 0, b: 0, a: 255 }

function makeLayer(id: string): Layer {
  const pixels = createEmptyBuffer(1, 1)
  putPixel(pixels, 0, 0, RED)
  return {
    id,
    name: `Layer ${id}`,
    visible: true,
    locked: false,
    opacity: 100,
    pixels,
  }
}

function makeFrame(id: string, layers: Layer[]): AnimationFrame {
  return { id, layers, activeLayerId: layers[0].id, durationMs: 100 }
}

describe('cloneLayers', () => {
  it('deep-clones each layer pixel buffer — mutating the clone leaves the original intact', () => {
    const original = [makeLayer('l1')]
    const clone = cloneLayers(original)
    putPixel(clone[0].pixels, 0, 0, { r: 0, g: 0, b: 0, a: 0 })

    expect(getPixel(original[0].pixels, 0, 0)).toEqual(RED)
    expect(clone[0]).not.toBe(original[0]) // new layer object
    expect(clone[0].pixels.data).not.toBe(original[0].pixels.data) // new backing array
  })
})

describe('cloneFrames', () => {
  it('deep-clones frames AND the layers nested inside each frame', () => {
    const layers = [makeLayer('l1')]
    const frames = [makeFrame('f1', layers)]
    const cloned = cloneFrames(frames)

    expect(cloned).not.toBe(frames)
    expect(cloned[0]).not.toBe(frames[0])
    expect(cloned[0].layers).not.toBe(frames[0].layers)
    expect(cloned[0].layers[0]).not.toBe(frames[0].layers[0])
    expect(cloned[0].layers[0].pixels).not.toBe(frames[0].layers[0].pixels)
  })
})

import { describe, it, expect, vi } from 'vitest'
import type { DocumentPayload } from '@/types/document'
import type { AIGeneration } from '@/types'
import {
  blankDocument,
  createUntitledSprite,
  documentFromPixels,
  documentHasContent,
  flattenDocumentFrame,
} from './document-preview'

const layer = (id: string, rgba: number[], opacity = 100, visible = true) => ({
  id,
  name: id,
  visible,
  locked: false,
  opacity,
  data: new Uint8Array(rgba),
})

const twoFrameDoc = (frame2Alpha: number): DocumentPayload => ({
  schemaVersion: 1,
  w: 1,
  h: 1,
  frameMs: [83, 83],
  frames: [
    { id: 'f1', activeLayerId: 'a', layers: [layer('a', [0, 0, 0, 0])] },
    { id: 'f2', activeLayerId: 'b', layers: [layer('b', [10, 20, 30, frame2Alpha])] },
  ],
})

describe('documentHasContent', () => {
  it('is false when every pixel of every layer of every frame is transparent', () => {
    expect(documentHasContent(twoFrameDoc(0))).toBe(false)
  })

  it('is true when any frame holds a non-transparent pixel', () => {
    expect(documentHasContent(twoFrameDoc(1))).toBe(true)
  })
})

describe('flattenDocumentFrame', () => {
  it('composites visible layers bottom to top with their opacity and skips hidden ones', () => {
    const doc: DocumentPayload = {
      schemaVersion: 1,
      w: 1,
      h: 1,
      frameMs: [83],
      frames: [
        {
          id: 'f1',
          activeLayerId: 'top',
          layers: [layer('bottom', [255, 0, 0, 255]), layer('top', [0, 0, 255, 255], 50), layer('hidden', [0, 255, 0, 255], 100, false)],
        },
      ],
    }
    const flat = flattenDocumentFrame(doc, 0)
    expect(flat.w).toBe(1)
    expect(flat.h).toBe(1)
    expect(Array.from(flat.data)).toEqual([128, 0, 128, 255])
  })

  it('flattens the requested frame, clamped to the last one', () => {
    expect(Array.from(flattenDocumentFrame(twoFrameDoc(255), 1).data)).toEqual([10, 20, 30, 255])
    expect(Array.from(flattenDocumentFrame(twoFrameDoc(255), 9).data)).toEqual([10, 20, 30, 255])
  })
})

describe('documentFromPixels / blankDocument', () => {
  it('builds a one-frame, one-layer document that holds the pixels as-is', () => {
    const doc = documentFromPixels({ w: 1, h: 1, data: new Uint8ClampedArray([1, 2, 3, 4]) })
    expect(doc.w).toBe(1)
    expect(doc.frames).toHaveLength(1)
    expect(doc.frameMs).toHaveLength(1)
    expect(doc.frames[0].layers).toHaveLength(1)
    expect(doc.frames[0].activeLayerId).toBe(doc.frames[0].layers[0].id)
    expect(Array.from(doc.frames[0].layers[0].data)).toEqual([1, 2, 3, 4])
  })

  it('blankDocument is transparent at the given size', () => {
    const doc = blankDocument(2, 3)
    expect(doc.w).toBe(2)
    expect(doc.h).toBe(3)
    expect(doc.frames[0].layers[0].data).toHaveLength(2 * 3 * 4)
    expect(documentHasContent(doc)).toBe(false)
  })
})

describe('createUntitledSprite', () => {
  it('adds a drawing named with the next free "Untitled N" over the current generation labels', () => {
    const created: AIGeneration = { id: 'new', prompt: 'Untitled 3', base64: 'x', timestamp: 0, width: 1, height: 1, kind: 'drawing' }
    const addDrawing = vi.fn(() => created)
    const assets = {
      getState: () => ({
        generations: [
          { id: 'a', prompt: 'Untitled 2', base64: '', timestamp: 0, width: 1, height: 1 },
          { id: 'b', prompt: 'knight', base64: '', timestamp: 0, width: 1, height: 1 },
        ],
        openAssetId: null,
        addDrawing,
        updateDrawingContent: vi.fn(),
        removeGeneration: vi.fn(),
        setOpenAssetId: vi.fn(),
      }),
      subscribe: vi.fn(() => () => {}),
    }

    const result = createUntitledSprite(assets, { base64: 'png', width: 4, height: 5 })

    expect(result).toBe(created)
    expect(addDrawing).toHaveBeenCalledWith({ prompt: 'Untitled 3', base64: 'png', width: 4, height: 5 })
  })
})

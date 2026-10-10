import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import type { DocumentRepository, StoredDocument } from '@/types/document'
import { createIndexedDbDocumentRepository } from './indexeddb-document.repository.service'
import { createInMemoryDocumentRepository } from './in-memory-document.repository.service'

// Adapter contract suite (task 1.23) — the SAME behavior must hold for both
// the IndexedDB repo (via `fake-indexeddb/auto`) and the InMemory fallback,
// since `useDocumentPersistence` treats them as interchangeable. Every test
// uses a fresh random id so parallel/sequential runs never collide on the
// shared fake IndexedDB instance.

function makeDoc(id: string, revision: number): StoredDocument {
  return {
    id,
    revision,
    updatedAt: 1000 + revision,
    payload: {
      schemaVersion: 1,
      w: 2,
      h: 2,
      frameMs: [83],
      frames: [
        {
          id: 'frame-1',
          activeLayerId: 'layer-1',
          layers: [
            {
              id: 'layer-1',
              name: 'Layer 1',
              visible: true,
              locked: false,
              opacity: 100,
              data: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
            },
          ],
        },
      ],
    },
  }
}

describe.each([
  ['IndexedDB', createIndexedDbDocumentRepository],
  ['InMemory', createInMemoryDocumentRepository],
] as const)('%s DocumentRepository contract', (_label, createRepository) => {
  let repository: DocumentRepository

  beforeEach(() => {
    repository = createRepository()
  })

  it('load() returns null for a missing id', async () => {
    expect(await repository.load(crypto.randomUUID())).toBeNull()
  })

  it('save() then load() round-trips a byte-equal Uint8Array and the same revision', async () => {
    const id = crypto.randomUUID()
    const doc = makeDoc(id, 1)
    await repository.save(doc)
    const loaded = await repository.load(id)

    expect(loaded).not.toBeNull()
    expect(loaded!.revision).toBe(1)
    expect(loaded!.payload.frames[0].layers[0].data).toEqual(doc.payload.frames[0].layers[0].data)
    expect(loaded!.payload.frames[0].layers[0].data).toBeInstanceOf(Uint8Array)
  })

  it('save() overwrites an existing id in place (same key)', async () => {
    const id = crypto.randomUUID()
    await repository.save(makeDoc(id, 1))
    await repository.save(makeDoc(id, 2))
    const loaded = await repository.load(id)
    expect(loaded!.revision).toBe(2)
  })

  it('remove() deletes the document', async () => {
    const id = crypto.randomUUID()
    await repository.save(makeDoc(id, 1))
    await repository.remove(id)
    expect(await repository.load(id)).toBeNull()
  })
})

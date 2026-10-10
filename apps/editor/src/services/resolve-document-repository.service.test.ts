import { describe, it, expect, vi, beforeEach } from 'vitest'

const loadMock = vi.fn()

vi.mock('./indexeddb-document.repository.service', () => ({
  createIndexedDbDocumentRepository: () => ({ load: loadMock, save: vi.fn(), remove: vi.fn() }),
}))

import { resolveDocumentRepository } from './resolve-document-repository.service'

// Task 1.24 — "IDB-open-failure -> InMemory + notice" (pixel-core "Storage
// unavailable"). `+ notice` is the `isPersistent` flag the hook/UI surface;
// the resolve logic itself is what's unit-tested here.

describe('resolveDocumentRepository', () => {
  beforeEach(() => {
    loadMock.mockReset()
  })

  it('reports persistent when IndexedDB opens successfully', async () => {
    loadMock.mockResolvedValueOnce(null)

    const result = await resolveDocumentRepository()

    expect(result.isPersistent).toBe(true)
  })

  it('falls back to an in-memory repository when IndexedDB fails to open', async () => {
    loadMock.mockRejectedValueOnce(new Error('IndexedDB blocked (private browsing)'))

    const result = await resolveDocumentRepository()

    expect(result.isPersistent).toBe(false)
    // The fallback is a fully working repository — editing still works, it
    // just doesn't survive a reload.
    const doc = {
      id: 'x',
      revision: 1,
      updatedAt: 0,
      payload: { schemaVersion: 1, w: 1, h: 1, frameMs: [], frames: [] },
    }
    await result.repository.save(doc)
    expect(await result.repository.load('x')).toEqual(doc)
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { DocumentPayload, DocumentRepository, StoredDocument } from '@/types/document'
import { LOCAL_DRAFT_DOCUMENT_ID } from '@/constants/persistence'
import { useAssetsStore } from '@/stores/assets.store'
import { createInMemoryDocumentRepository } from './in-memory-document.repository.service'
import { migrateDraftToAsset } from './draft-to-asset-migration.service'

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => void map.delete(key),
    setItem: (key, value) => void map.set(key, value),
  }
}

const payloadWithAlpha = (alpha: number): DocumentPayload => ({
  schemaVersion: 1,
  w: 1,
  h: 1,
  frameMs: [83],
  frames: [{ id: 'f1', activeLayerId: 'l1', layers: [{ id: 'l1', name: 'l1', visible: true, locked: false, opacity: 100, data: new Uint8Array([9, 9, 9, alpha]) }] }],
})

const draft = (alpha: number): StoredDocument => ({ id: LOCAL_DRAFT_DOCUMENT_ID, revision: 7, updatedAt: 0, payload: payloadWithAlpha(alpha) })

const encodePng = () => 'data:image/png;base64,PREVIEW'

describe('migrateDraftToAsset (ADR 0015: the old hidden draft becomes an Assets item once)', () => {
  let storage: Storage

  beforeEach(() => {
    storage = memoryStorage()
    vi.stubGlobal('localStorage', memoryStorage())
    useAssetsStore.setState({ generations: [], animations: [], repository: null, openAssetId: null })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('moves a draft with content into one "Untitled N" drawing, saves its document under the new id, and removes the draft after the save', async () => {
    const repository = createInMemoryDocumentRepository()
    await repository.save(draft(255))

    const assetId = await migrateDraftToAsset({ repository, assets: useAssetsStore, storage, encodePng })

    const { generations } = useAssetsStore.getState()
    expect(generations).toHaveLength(1)
    expect(generations[0].id).toBe(assetId)
    expect(generations[0].prompt).toBe('Untitled 1')
    expect(generations[0].kind).toBe('drawing')
    expect(generations[0].base64).toBe('data:image/png;base64,PREVIEW')
    const saved = await repository.load(assetId!)
    expect(saved?.payload).toEqual(payloadWithAlpha(255))
    expect(await repository.load(LOCAL_DRAFT_DOCUMENT_ID)).toBeNull()
  })

  it('removes an empty draft without creating any asset', async () => {
    const repository = createInMemoryDocumentRepository()
    await repository.save(draft(0))

    const assetId = await migrateDraftToAsset({ repository, assets: useAssetsStore, storage, encodePng })

    expect(assetId).toBeNull()
    expect(useAssetsStore.getState().generations).toHaveLength(0)
    expect(await repository.load(LOCAL_DRAFT_DOCUMENT_ID)).toBeNull()
  })

  it('keeps the draft (and leaves no orphan asset) when saving the migrated document fails', async () => {
    const inner = createInMemoryDocumentRepository()
    await inner.save(draft(255))
    const repository: DocumentRepository = {
      load: (id) => inner.load(id),
      remove: vi.fn((id: string) => inner.remove(id)),
      save: vi.fn(async () => {
        throw new Error('QuotaExceededError')
      }),
    }

    await expect(migrateDraftToAsset({ repository, assets: useAssetsStore, storage, encodePng })).rejects.toThrow('QuotaExceededError')

    expect(repository.remove).not.toHaveBeenCalled()
    expect(await inner.load(LOCAL_DRAFT_DOCUMENT_ID)).not.toBeNull()
    expect(useAssetsStore.getState().generations).toHaveLength(0)
  })

  it('does not run twice: a second run creates no second asset', async () => {
    const repository = createInMemoryDocumentRepository()
    await repository.save(draft(255))

    const first = await migrateDraftToAsset({ repository, assets: useAssetsStore, storage, encodePng })
    const second = await migrateDraftToAsset({ repository, assets: useAssetsStore, storage, encodePng })

    expect(first).not.toBeNull()
    expect(second).toBeNull()
    expect(useAssetsStore.getState().generations).toHaveLength(1)
  })

  it('is idempotent when a previous run saved the asset but did not get to remove the draft', async () => {
    const inner = createInMemoryDocumentRepository()
    await inner.save(draft(255))
    let failRemove = true
    const repository: DocumentRepository = {
      load: (id) => inner.load(id),
      save: (doc) => inner.save(doc),
      remove: async (id) => {
        if (failRemove) throw new Error('remove failed')
        await inner.remove(id)
      },
    }

    await expect(migrateDraftToAsset({ repository, assets: useAssetsStore, storage, encodePng })).rejects.toThrow('remove failed')
    const firstAssetId = useAssetsStore.getState().generations[0].id

    failRemove = false
    const retried = await migrateDraftToAsset({ repository, assets: useAssetsStore, storage, encodePng })

    expect(retried).toBe(firstAssetId)
    expect(useAssetsStore.getState().generations).toHaveLength(1)
    expect(await inner.load(LOCAL_DRAFT_DOCUMENT_ID)).toBeNull()
  })

  it('does nothing when there is no draft', async () => {
    const repository = createInMemoryDocumentRepository()

    expect(await migrateDraftToAsset({ repository, assets: useAssetsStore, storage, encodePng })).toBeNull()
    expect(useAssetsStore.getState().generations).toHaveLength(0)
  })
})

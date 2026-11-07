import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { DocumentPayload, DocumentRepository, StoredDocument } from '@/types/document'
import type { DocStatus, PixelBuffer, SaveStatus } from '@/types'
import { ASSET_LIBRARY_LIMIT, LOCAL_DRAFT_DOCUMENT_ID, OPEN_SPRITE_ASSET_STORAGE_KEY } from '@/constants/persistence'
import { SPRITE_EDITOR_CANVAS } from '@/constants'
import { useAssetsStore } from '@/stores/assets.store'
import { createInMemoryDocumentRepository } from './in-memory-document.repository.service'
import { createInMemoryAssetLibraryRepository } from './in-memory-asset-library.repository.service'
import {
  startDocumentPersistence,
  type DocumentAssetBinding,
  type DocumentPersistenceDeps,
  type DocumentPersistenceStoreApi,
} from './document-persistence.controller'

// ADR 0015 (T2): the controller keys the document by the OPEN ASSET id instead
// of the fixed hidden `local-draft`. Fake core store + the real assets store
// (localStorage stubbed), no DOM: PNG encode/decode are injected.

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
  frames: [{ id: 'f1', activeLayerId: 'l1', layers: [{ id: 'l1', name: 'l1', visible: true, locked: false, opacity: 100, data: new Uint8Array([1, 2, 3, alpha]) }] }],
})

/** Mirrors the real store's relevant behaviour: `importDocument` resets `docRevision` to 0 and notifies subscribers. */
function makeFakeStore() {
  let docStatus: DocStatus = 'loading'
  let saveStatus: SaveStatus | undefined
  let docRevision = 0
  let doc = payloadWithAlpha(0)
  const listeners = new Set<(state: { docRevision: number }) => void>()
  const notify = () => listeners.forEach((l) => l({ docRevision }))

  const api: DocumentPersistenceStoreApi = {
    getState: () => ({ docStatus, docRevision }),
    setState: (patch) => {
      if (patch.docStatus !== undefined) docStatus = patch.docStatus
      if (patch.saveStatus !== undefined) saveStatus = patch.saveStatus
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    exportDocument: () => doc,
    importDocument: (payload) => {
      doc = payload
      docRevision = 0
      notify()
    },
  }

  return {
    api,
    getSaveStatus: () => saveStatus,
    /** A user edit: new content + a docRevision bump. */
    edit: (alpha: number) => {
      doc = payloadWithAlpha(alpha)
      docRevision += 1
      notify()
    },
  }
}

const decodedPixels: PixelBuffer = { w: 1, h: 1, data: new Uint8ClampedArray([7, 7, 7, 255]) }

function makeBinding(openAssetStorage: Storage): DocumentAssetBinding {
  let encoded = 0
  return {
    assets: useAssetsStore,
    openAssetStorage,
    currentFrameIndex: () => 0,
    encodePng: () => {
      encoded += 1
      return `data:image/png;base64,PNG${encoded}`
    },
    decodePng: vi.fn(async () => decodedPixels),
  }
}

function makeDeps(
  repository: DocumentRepository,
  store: DocumentPersistenceStoreApi,
  binding: DocumentAssetBinding,
  overrides: Partial<DocumentPersistenceDeps> = {},
): DocumentPersistenceDeps {
  return {
    resolveRepository: async () => ({ repository, isPersistent: true }),
    storage: { getItem: () => null, removeItem: () => {} },
    store,
    debounceMs: 800,
    scheduleTimeout: (fn, ms) => setTimeout(fn, ms),
    clearScheduledTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
    onPersistentChange: () => {},
    assetBinding: binding,
    ...overrides,
  }
}

const spy = (repository: DocumentRepository) => {
  const save = vi.spyOn(repository, 'save')
  return { save }
}

describe('startDocumentPersistence keyed by the open asset (ADR 0015)', () => {
  let openAssetStorage: Storage

  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('localStorage', memoryStorage())
    openAssetStorage = memoryStorage()
    useAssetsStore.setState({ generations: [], animations: [], repository: null, openAssetId: null, hydrated: true })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('lazy creation: an untouched new sprite stores nothing and creates no asset', async () => {
    const repository = createInMemoryDocumentRepository()
    const { save } = spy(repository)
    const store = makeFakeStore()

    const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))
    controller.flush()
    await vi.advanceTimersByTimeAsync(2000)
    controller.stop()

    expect(save).not.toHaveBeenCalled()
    expect(useAssetsStore.getState().generations).toHaveLength(0)
    expect(useAssetsStore.getState().openAssetId).toBeNull()
  })

  it('the first edit creates "Untitled N", makes it the open asset and saves the document under its id', async () => {
    useAssetsStore.setState({
      generations: [{ id: 'old', prompt: 'Untitled 1', base64: '', timestamp: 0, width: 1, height: 1, kind: 'drawing' }],
    })
    const repository = createInMemoryDocumentRepository()
    const store = makeFakeStore()

    const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))
    store.edit(255)
    await vi.advanceTimersByTimeAsync(800)

    const created = useAssetsStore.getState().generations.find((g) => g.id !== 'old')!
    expect(created.prompt).toBe('Untitled 2')
    expect(created.kind).toBe('drawing')
    expect(useAssetsStore.getState().openAssetId).toBe(created.id)
    expect(openAssetStorage.getItem(OPEN_SPRITE_ASSET_STORAGE_KEY)).toBe(created.id)
    expect((await repository.load(created.id))?.payload).toEqual(payloadWithAlpha(255))
    expect(await repository.load(LOCAL_DRAFT_DOCUMENT_ID)).toBeNull()
    expect(store.getSaveStatus()).toBe('saved')
    controller.stop()
  })

  it('autosave of an existing open asset bumps its revision and refreshes its PNG preview', async () => {
    const repository = createInMemoryDocumentRepository()
    const store = makeFakeStore()
    const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))

    store.edit(255)
    await vi.advanceTimersByTimeAsync(800)
    const [asset] = useAssetsStore.getState().generations
    const firstPreview = asset.base64

    store.edit(128)
    await vi.advanceTimersByTimeAsync(800)

    const updated = useAssetsStore.getState().generations.find((g) => g.id === asset.id)!
    expect(updated.revision).toBe(1)
    expect(updated.base64).not.toBe(firstPreview)
    expect(useAssetsStore.getState().generations).toHaveLength(1)
    expect((await repository.load(asset.id))?.payload).toEqual(payloadWithAlpha(128))
    controller.stop()
  })

  it('the open asset survives a reload: a fresh session restores that asset and keeps it open', async () => {
    const repository = createInMemoryDocumentRepository()
    const first = makeFakeStore()
    const c1 = await startDocumentPersistence(makeDeps(repository, first.api, makeBinding(openAssetStorage)))
    first.edit(255)
    await vi.advanceTimersByTimeAsync(800)
    const openId = useAssetsStore.getState().openAssetId
    expect(openId).not.toBeNull()
    c1.stop()

    // Reload: new core store, assets store forgets the in-memory open id, localStorage keeps it.
    useAssetsStore.setState({ openAssetId: null })
    const reloaded = makeFakeStore()
    const c2 = await startDocumentPersistence(makeDeps(repository, reloaded.api, makeBinding(openAssetStorage)))

    expect(useAssetsStore.getState().openAssetId).toBe(openId)
    expect(reloaded.api.exportDocument()).toEqual(payloadWithAlpha(255))
    c2.stop()
  })

  it('a persisted open id with no stored document starts blank with no open asset', async () => {
    openAssetStorage.setItem(OPEN_SPRITE_ASSET_STORAGE_KEY, 'gone')
    const repository = createInMemoryDocumentRepository()
    const store = makeFakeStore()

    const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))

    expect(useAssetsStore.getState().openAssetId).toBeNull()
    expect(openAssetStorage.getItem(OPEN_SPRITE_ASSET_STORAGE_KEY)).toBeNull()
    expect(store.api.exportDocument()).toEqual(payloadWithAlpha(0))
    controller.stop()
  })

  it('openAsset flushes the previous asset\'s pending edit first and does not autosave the unchanged imported content', async () => {
    const repository = createInMemoryDocumentRepository()
    const other: StoredDocument = { id: 'asset-b', revision: 3, updatedAt: 0, payload: payloadWithAlpha(42) }
    await repository.save(other)
    const store = makeFakeStore()
    const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))

    store.edit(255)
    await vi.advanceTimersByTimeAsync(800)
    const assetA = useAssetsStore.getState().openAssetId!
    store.edit(200) // pending, inside the debounce window
    const { save } = spy(repository)

    const opened = await controller.openAsset('asset-b')

    expect(opened).toBe(true)
    expect((await repository.load(assetA))?.payload).toEqual(payloadWithAlpha(200))
    expect(store.api.exportDocument()).toEqual(payloadWithAlpha(42))
    expect(useAssetsStore.getState().openAssetId).toBe('asset-b')
    expect(openAssetStorage.getItem(OPEN_SPRITE_ASSET_STORAGE_KEY)).toBe('asset-b')

    await vi.advanceTimersByTimeAsync(2000)
    controller.flush()
    expect(save).toHaveBeenCalledTimes(1) // only the flush of asset A's pending edit
    expect(save.mock.calls[0][0].id).toBe(assetA)
    controller.stop()
  })

  it('openAsset builds the document from the asset PNG when the asset has no stored document', async () => {
    useAssetsStore.setState({
      generations: [{ id: 'png-only', prompt: 'knight', base64: 'data:image/png;base64,K', timestamp: 0, width: 1, height: 1 }],
    })
    const repository = createInMemoryDocumentRepository()
    const store = makeFakeStore()
    const binding = makeBinding(openAssetStorage)
    const controller = await startDocumentPersistence(makeDeps(repository, store.api, binding))

    expect(await controller.openAsset('png-only')).toBe(true)

    expect(binding.decodePng).toHaveBeenCalledWith('data:image/png;base64,K')
    expect(Array.from(store.api.exportDocument().frames[0].layers[0].data)).toEqual([7, 7, 7, 255])
    expect(useAssetsStore.getState().openAssetId).toBe('png-only')
    controller.stop()
  })

  it('openAsset of an unknown id changes nothing and resolves false', async () => {
    const repository = createInMemoryDocumentRepository()
    const store = makeFakeStore()
    const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))

    expect(await controller.openAsset('missing')).toBe(false)
    expect(useAssetsStore.getState().openAssetId).toBeNull()
    controller.stop()
  })

  it('newSprite flushes the pending edit, opens a blank default-size document and clears the open id (lazy)', async () => {
    const repository = createInMemoryDocumentRepository()
    const store = makeFakeStore()
    const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))
    store.edit(255)
    await vi.advanceTimersByTimeAsync(800)
    const assetA = useAssetsStore.getState().openAssetId!
    store.edit(90) // pending

    controller.newSprite()

    expect((await repository.load(assetA))?.payload).toEqual(payloadWithAlpha(90))
    expect(useAssetsStore.getState().openAssetId).toBeNull()
    expect(openAssetStorage.getItem(OPEN_SPRITE_ASSET_STORAGE_KEY)).toBeNull()
    const blank = store.api.exportDocument()
    expect(blank.w).toBe(SPRITE_EDITOR_CANVAS.DEFAULT_WIDTH)
    expect(blank.h).toBe(SPRITE_EDITOR_CANVAS.DEFAULT_HEIGHT)

    await vi.advanceTimersByTimeAsync(2000)
    expect(useAssetsStore.getState().generations).toHaveLength(1) // untouched blank sprite: still lazy
    controller.stop()
  })

  it('startup migrates a local-draft with content into the open asset and removes the draft', async () => {
    const repository = createInMemoryDocumentRepository()
    await repository.save({ id: LOCAL_DRAFT_DOCUMENT_ID, revision: 4, updatedAt: 0, payload: payloadWithAlpha(255) })
    const store = makeFakeStore()

    const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))

    const [asset] = useAssetsStore.getState().generations
    expect(asset.prompt).toBe('Untitled 1')
    expect(useAssetsStore.getState().openAssetId).toBe(asset.id)
    expect(store.api.exportDocument()).toEqual(payloadWithAlpha(255))
    expect(await repository.load(LOCAL_DRAFT_DOCUMENT_ID)).toBeNull()
    controller.stop()
  })

  it('a failed save still reports the error (onPersistentChange(false) + saveStatus error)', async () => {
    const repository: DocumentRepository = {
      load: async () => null,
      remove: async () => {},
      clear: async () => {},
      save: async () => {
        throw new Error('QuotaExceededError')
      },
    }
    const onPersistentChange = vi.fn()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const store = makeFakeStore()
    const controller = await startDocumentPersistence(
      makeDeps(repository, store.api, makeBinding(openAssetStorage), { onPersistentChange }),
    )

    store.edit(255)
    await vi.advanceTimersByTimeAsync(800)

    expect(onPersistentChange).toHaveBeenLastCalledWith(false)
    expect(store.getSaveStatus()).toBe('error')
    errorSpy.mockRestore()
    controller.stop()
  })

  describe('duplicateAsset (ADR 0015: Save As becomes duplicate)', () => {
    it('creates a typed drawing asset, stores the full document under the new id and opens the copy', async () => {
      const repository = createInMemoryDocumentRepository()
      const store = makeFakeStore()
      const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))
      store.edit(255)
      await vi.advanceTimersByTimeAsync(800)
      const originalId = useAssetsStore.getState().openAssetId!

      expect(await controller.duplicateAsset({ name: '  Hero copy  ', assetType: 'character' })).toBe(true)

      const copy = useAssetsStore.getState().generations.find((g) => g.id !== originalId)!
      expect(copy.prompt).toBe('Hero copy')
      expect(copy.kind).toBe('drawing')
      expect(copy.assetType).toBe('character')
      expect((await repository.load(copy.id))?.payload).toEqual(payloadWithAlpha(255))
      expect(useAssetsStore.getState().openAssetId).toBe(copy.id)
      expect(openAssetStorage.getItem(OPEN_SPRITE_ASSET_STORAGE_KEY)).toBe(copy.id)
      controller.stop()
    })

    it("flushes the original's pending edit under the original id", async () => {
      const repository = createInMemoryDocumentRepository()
      const store = makeFakeStore()
      const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))
      store.edit(255)
      await vi.advanceTimersByTimeAsync(800)
      const originalId = useAssetsStore.getState().openAssetId!
      store.edit(90) // pending

      await controller.duplicateAsset({ name: 'copy', assetType: 'character' })

      expect((await repository.load(originalId))?.payload).toEqual(payloadWithAlpha(90))
      const copy = useAssetsStore.getState().generations.find((g) => g.id !== originalId)!
      expect((await repository.load(copy.id))?.payload).toEqual(payloadWithAlpha(90))
      controller.stop()
    })

    it('does not treat the duplicate as an edit; the next edit autosaves into the copy, not the original', async () => {
      const repository = createInMemoryDocumentRepository()
      const store = makeFakeStore()
      const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))
      store.edit(255)
      await vi.advanceTimersByTimeAsync(800)
      const originalId = useAssetsStore.getState().openAssetId!
      await controller.duplicateAsset({ name: 'copy', assetType: 'character' })
      const copyId = useAssetsStore.getState().openAssetId!
      const { save } = spy(repository)

      await vi.advanceTimersByTimeAsync(2000)
      controller.flush()
      expect(save).not.toHaveBeenCalled()

      store.edit(10)
      await vi.advanceTimersByTimeAsync(800)

      expect(save).toHaveBeenCalledTimes(1)
      expect(save.mock.calls[0][0].id).toBe(copyId)
      expect((await repository.load(originalId))?.payload).toEqual(payloadWithAlpha(255))
      expect((await repository.load(copyId))?.payload).toEqual(payloadWithAlpha(10))
      controller.stop()
    })

    it('duplicating a new, edited-but-unstored sprite stores it as "Untitled N" and opens the copy', async () => {
      const repository = createInMemoryDocumentRepository()
      const store = makeFakeStore()
      const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))
      store.edit(77) // pending, no asset yet

      expect(await controller.duplicateAsset({ name: 'Untitled 1 copy', assetType: 'character' })).toBe(true)

      const { generations, openAssetId } = useAssetsStore.getState()
      const original = generations.find((g) => g.prompt === 'Untitled 1')!
      const copy = generations.find((g) => g.prompt === 'Untitled 1 copy')!
      expect(openAssetId).toBe(copy.id)
      expect((await repository.load(original.id))?.payload).toEqual(payloadWithAlpha(77))
      expect((await repository.load(copy.id))?.payload).toEqual(payloadWithAlpha(77))
      controller.stop()
    })

    it('a repository save failure resolves false and leaves the open asset unchanged', async () => {
      const inner = createInMemoryDocumentRepository()
      const store = makeFakeStore()
      const controller = await startDocumentPersistence(makeDeps(inner, store.api, makeBinding(openAssetStorage)))
      store.edit(255)
      await vi.advanceTimersByTimeAsync(800)
      const originalId = useAssetsStore.getState().openAssetId!
      vi.spyOn(inner, 'save').mockRejectedValue(new Error('QuotaExceededError'))
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(await controller.duplicateAsset({ name: 'copy', assetType: 'character' })).toBe(false)

      expect(useAssetsStore.getState().openAssetId).toBe(originalId)
      expect(store.getSaveStatus()).toBe('error')
      expect(useAssetsStore.getState().generations.map((asset) => asset.prompt)).not.toContain('copy')
      errorSpy.mockRestore()
      controller.stop()
    })

    it('is a no-op returning false without an asset binding', async () => {
      const repository = createInMemoryDocumentRepository()
      const store = makeFakeStore()
      const controller = await startDocumentPersistence(
        makeDeps(repository, store.api, makeBinding(openAssetStorage), { assetBinding: undefined }),
      )
      expect(await controller.duplicateAsset({ name: 'copy', assetType: 'character' })).toBe(false)
      controller.stop()
    })
  })

  describe('asset removed -> stored document removed (T4b)', () => {
    const addAsset = async (repository: DocumentRepository, name: string) => {
      const asset = useAssetsStore
        .getState()
        .addDrawing({ prompt: name, base64: 'data:image/png;base64,AA', width: 1, height: 1 })
      await repository.save({ id: asset.id, revision: 1, updatedAt: 0, payload: payloadWithAlpha(9) })
      return asset
    }

    it('removeGeneration removes that asset document and leaves the others', async () => {
      const repository = createInMemoryDocumentRepository()
      const store = makeFakeStore()
      const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))
      const gone = await addAsset(repository, 'gone')
      const kept = await addAsset(repository, 'kept')

      useAssetsStore.getState().removeGeneration(gone.id)
      await vi.advanceTimersByTimeAsync(0)

      expect(await repository.load(gone.id)).toBeNull()
      expect(await repository.load(kept.id)).not.toBeNull()
      controller.stop()
    })

    it('eviction (an id leaving generations) and clearLocalHistory remove the documents', async () => {
      const repository = createInMemoryDocumentRepository()
      const store = makeFakeStore()
      const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))
      const evicted = await addAsset(repository, 'evicted')
      const survivor = await addAsset(repository, 'survivor')

      useAssetsStore.setState({ generations: useAssetsStore.getState().generations.filter((g) => g.id !== evicted.id) })
      await vi.advanceTimersByTimeAsync(0)
      expect(await repository.load(evicted.id)).toBeNull()
      expect(await repository.load(survivor.id)).not.toBeNull()

      useAssetsStore.getState().clearLocalHistory()
      await vi.advanceTimersByTimeAsync(0)
      expect(await repository.load(survivor.id)).toBeNull()
      controller.stop()
    })

    it('a content-only change (updateDrawingContent) removes nothing', async () => {
      const repository = createInMemoryDocumentRepository()
      const remove = vi.spyOn(repository, 'remove')
      const store = makeFakeStore()
      const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))
      const asset = await addAsset(repository, 'a')

      useAssetsStore.getState().updateDrawingContent(asset.id, { base64: 'data:image/png;base64,BB', width: 1, height: 1 })
      await vi.advanceTimersByTimeAsync(0)

      expect(remove).not.toHaveBeenCalled()
      controller.stop()
    })

    it('a failing remove is logged and does not throw', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const repository = createInMemoryDocumentRepository()
      vi.spyOn(repository, 'remove').mockRejectedValue(new Error('idb blocked'))
      const store = makeFakeStore()
      const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))
      const asset = await addAsset(repository, 'a')

      useAssetsStore.getState().removeGeneration(asset.id)
      await vi.advanceTimersByTimeAsync(0)

      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
      controller.stop()
    })

    it('the open asset removed: detaches it, keeps the canvas, and the next edit creates a new asset', async () => {
      const repository = createInMemoryDocumentRepository()
      const save = vi.spyOn(repository, 'save')
      const store = makeFakeStore()
      const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))
      store.edit(255)
      await vi.advanceTimersByTimeAsync(800)
      const oldId = useAssetsStore.getState().openAssetId!

      useAssetsStore.getState().removeGeneration(oldId)
      await vi.advanceTimersByTimeAsync(0)

      expect(useAssetsStore.getState().openAssetId).toBeNull()
      expect(openAssetStorage.getItem(OPEN_SPRITE_ASSET_STORAGE_KEY)).toBeNull()
      expect(store.api.exportDocument()).toEqual(payloadWithAlpha(255))
      expect(await repository.load(oldId)).toBeNull()

      save.mockClear()
      store.edit(128)
      await vi.advanceTimersByTimeAsync(800)

      const newId = useAssetsStore.getState().openAssetId!
      expect(newId).not.toBe(oldId)
      expect(save).toHaveBeenCalledTimes(1)
      expect(save.mock.calls[0][0].id).toBe(newId)
      expect(await repository.load(oldId)).toBeNull()
      controller.stop()
    })

    it('an autosave still in flight when the open asset is removed does not leave its document behind', async () => {
      const inner = createInMemoryDocumentRepository()
      let releaseSave: () => void = () => {}
      const repository: DocumentRepository = {
        ...inner,
        save: (doc) =>
          new Promise<void>((resolve) => {
            releaseSave = () => void inner.save(doc).then(resolve)
          }),
      }
      const store = makeFakeStore()
      const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))
      // An existing open asset: a first save has no Assets item until its write settles.
      const oldId = (await addAsset(inner, 'open')).id
      useAssetsStore.getState().setOpenAssetId(oldId)
      store.edit(255)
      await vi.advanceTimersByTimeAsync(800)

      useAssetsStore.getState().removeGeneration(oldId)
      await vi.advanceTimersByTimeAsync(0)
      releaseSave()
      await vi.advanceTimersByTimeAsync(0)

      expect(await inner.load(oldId)).toBeNull()
      controller.stop()
    })

    it('stop() unsubscribes from the assets store', async () => {
      const repository = createInMemoryDocumentRepository()
      const remove = vi.spyOn(repository, 'remove')
      const store = makeFakeStore()
      const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))
      const asset = await addAsset(repository, 'a')
      controller.stop()

      useAssetsStore.getState().removeGeneration(asset.id)
      await vi.advanceTimersByTimeAsync(0)

      expect(remove).not.toHaveBeenCalled()
    })
  })

  describe('review follow-ups (T7b)', () => {
    const PNG = 'data:image/png;base64,AA'
    const aiAsset = () => useAssetsStore.getState().addGeneration({ prompt: 'ai sprite', base64: PNG, width: 1, height: 1 })

    /** A full library on a repository-backed store, so eviction is active. */
    const fillLibrary = () => {
      const generations = Array.from({ length: ASSET_LIBRARY_LIMIT }, (_, i) => ({
        id: `g${i}`,
        prompt: `asset ${i}`,
        base64: PNG,
        width: 1,
        height: 1,
        timestamp: i + 1,
      }))
      useAssetsStore.setState({ generations: [...generations].reverse(), repository: createInMemoryAssetLibraryRepository() })
      return generations
    }
    const libraryIds = () => useAssetsStore.getState().generations.map((g) => g.id)

    describe('F1: restore of an opened-but-never-edited asset', () => {
      it('opens it from its PNG and keeps it as the open asset, still unstored', async () => {
        const asset = aiAsset()
        openAssetStorage.setItem(OPEN_SPRITE_ASSET_STORAGE_KEY, asset.id)
        const repository = createInMemoryDocumentRepository()
        const { save } = spy(repository)
        const store = makeFakeStore()
        const binding = makeBinding(openAssetStorage)

        const controller = await startDocumentPersistence(makeDeps(repository, store.api, binding))

        expect(binding.decodePng).toHaveBeenCalledWith(asset.base64)
        expect(useAssetsStore.getState().openAssetId).toBe(asset.id)
        expect(openAssetStorage.getItem(OPEN_SPRITE_ASSET_STORAGE_KEY)).toBe(asset.id)
        expect([...store.api.exportDocument().frames[0].layers[0].data]).toEqual([7, 7, 7, 255])
        await vi.advanceTimersByTimeAsync(2000)
        expect(save).not.toHaveBeenCalled()
        controller.stop()
      })

      it('waits for the assets library to hydrate before deciding the id is gone', async () => {
        const asset = aiAsset()
        useAssetsStore.setState({ generations: [], hydrated: false })
        openAssetStorage.setItem(OPEN_SPRITE_ASSET_STORAGE_KEY, asset.id)
        const store = makeFakeStore()

        const starting = startDocumentPersistence(
          makeDeps(createInMemoryDocumentRepository(), store.api, makeBinding(openAssetStorage)),
        )
        await vi.advanceTimersByTimeAsync(10)
        useAssetsStore.setState({ generations: [asset], hydrated: true })
        const controller = await starting

        expect(useAssetsStore.getState().openAssetId).toBe(asset.id)
        controller.stop()
      })

      it('stops waiting for a library that never hydrates and starts blank', async () => {
        useAssetsStore.setState({ hydrated: false })
        openAssetStorage.setItem(OPEN_SPRITE_ASSET_STORAGE_KEY, 'never')
        const store = makeFakeStore()

        const starting = startDocumentPersistence(
          makeDeps(createInMemoryDocumentRepository(), store.api, makeBinding(openAssetStorage)),
        )
        await vi.advanceTimersByTimeAsync(60_000)
        const controller = await starting

        expect(useAssetsStore.getState().openAssetId).toBeNull()
        controller.stop()
      })
    })

    describe('F2: a failed write never costs another asset', () => {
      it('a failed duplicate at the library limit keeps every asset and its document', async () => {
        const repository = createInMemoryDocumentRepository()
        const store = makeFakeStore()
        const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))
        fillLibrary()
        await repository.save({ id: 'g0', revision: 1, updatedAt: 0, payload: payloadWithAlpha(9) })
        useAssetsStore.getState().setOpenAssetId('g100')
        vi.spyOn(repository, 'save').mockRejectedValue(new Error('QuotaExceededError'))
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        expect(await controller.duplicateAsset({ name: 'copy', assetType: 'character' })).toBe(false)
        await vi.advanceTimersByTimeAsync(0)

        expect(libraryIds()).toHaveLength(ASSET_LIBRARY_LIMIT)
        expect(libraryIds()).toContain('g0')
        expect(await repository.load('g0')).not.toBeNull()
        errorSpy.mockRestore()
        controller.stop()
      })

      it('a successful duplicate at the limit evicts the oldest asset and its document', async () => {
        const repository = createInMemoryDocumentRepository()
        const store = makeFakeStore()
        const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))
        fillLibrary()
        await repository.save({ id: 'g0', revision: 1, updatedAt: 0, payload: payloadWithAlpha(9) })
        useAssetsStore.getState().setOpenAssetId('g100')

        expect(await controller.duplicateAsset({ name: 'copy', assetType: 'character' })).toBe(true)
        await vi.advanceTimersByTimeAsync(0)

        expect(libraryIds()).toHaveLength(ASSET_LIBRARY_LIMIT)
        expect(libraryIds()).not.toContain('g0')
        expect(libraryIds()).toContain('g100')
        expect(await repository.load('g0')).toBeNull()
        controller.stop()
      })

      it('a failed first save at the limit keeps every asset and leaves no open asset', async () => {
        const repository = createInMemoryDocumentRepository()
        const store = makeFakeStore()
        const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))
        fillLibrary()
        await repository.save({ id: 'g0', revision: 1, updatedAt: 0, payload: payloadWithAlpha(9) })
        vi.spyOn(repository, 'save').mockRejectedValue(new Error('QuotaExceededError'))
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        store.edit(255)
        await vi.advanceTimersByTimeAsync(800)

        expect(libraryIds()).toHaveLength(ASSET_LIBRARY_LIMIT)
        expect(libraryIds()).toContain('g0')
        expect(await repository.load('g0')).not.toBeNull()
        expect(useAssetsStore.getState().openAssetId).toBeNull()
        errorSpy.mockRestore()
        controller.stop()
      })

      it('a successful first save at the limit adds "Untitled N" and evicts the oldest asset', async () => {
        const repository = createInMemoryDocumentRepository()
        const store = makeFakeStore()
        const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))
        fillLibrary()
        await repository.save({ id: 'g0', revision: 1, updatedAt: 0, payload: payloadWithAlpha(9) })

        store.edit(255)
        await vi.advanceTimersByTimeAsync(800)

        const openId = useAssetsStore.getState().openAssetId!
        expect(libraryIds()).toHaveLength(ASSET_LIBRARY_LIMIT)
        expect(libraryIds()).toContain(openId)
        expect(libraryIds()).not.toContain('g0')
        expect(await repository.load(openId)).not.toBeNull()
        expect(await repository.load('g0')).toBeNull()
        controller.stop()
      })

      it('two saves before the first write settles create ONE asset', async () => {
        const inner = createInMemoryDocumentRepository()
        let releaseFirst: () => void = () => {}
        const realSave = inner.save.bind(inner)
        vi.spyOn(inner, 'save').mockImplementationOnce(
          (doc) => new Promise<void>((resolve) => { releaseFirst = () => resolve(realSave(doc)) }),
        )
        const store = makeFakeStore()
        const controller = await startDocumentPersistence(makeDeps(inner, store.api, makeBinding(openAssetStorage)))

        store.edit(100)
        await vi.advanceTimersByTimeAsync(800)
        store.edit(200)
        await vi.advanceTimersByTimeAsync(800)
        releaseFirst()
        await vi.advanceTimersByTimeAsync(0)

        expect(useAssetsStore.getState().generations).toHaveLength(1)
        expect(useAssetsStore.getState().generations[0].id).toBe(useAssetsStore.getState().openAssetId)
        controller.stop()
      })
    })

    describe('F4: a wipe cancels pending and in-flight autosave', () => {
      it('drops the pending debounced save, also on stop()', async () => {
        const repository = createInMemoryDocumentRepository()
        const { save } = spy(repository)
        const store = makeFakeStore()
        const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))
        store.edit(255)

        await controller.discardPendingSaves()
        await vi.advanceTimersByTimeAsync(2000)
        controller.stop()

        expect(save).not.toHaveBeenCalled()
        expect(useAssetsStore.getState().generations).toHaveLength(0)
        expect(useAssetsStore.getState().openAssetId).toBeNull()
      })

      it('waits for an in-flight save and ignores its result, so nothing is recreated after the wipe', async () => {
        const inner = createInMemoryDocumentRepository()
        let releaseSave: () => void = () => {}
        const realSave = inner.save.bind(inner)
        vi.spyOn(inner, 'save').mockImplementationOnce(
          (doc) => new Promise<void>((resolve) => { releaseSave = () => resolve(realSave(doc)) }),
        )
        const store = makeFakeStore()
        const controller = await startDocumentPersistence(makeDeps(inner, store.api, makeBinding(openAssetStorage)))
        store.edit(255)
        await vi.advanceTimersByTimeAsync(800)

        let settled = false
        const discarding = controller.discardPendingSaves().then(() => { settled = true })
        await vi.advanceTimersByTimeAsync(0)
        expect(settled).toBe(false)

        releaseSave()
        await discarding
        await inner.clear()
        await vi.advanceTimersByTimeAsync(0)

        expect(useAssetsStore.getState().generations).toHaveLength(0)
        expect(useAssetsStore.getState().openAssetId).toBeNull()
        controller.stop()
      })

      it('edits made after the wipe autosave normally', async () => {
        const repository = createInMemoryDocumentRepository()
        const store = makeFakeStore()
        const controller = await startDocumentPersistence(makeDeps(repository, store.api, makeBinding(openAssetStorage)))
        await controller.discardPendingSaves()

        store.edit(50)
        await vi.advanceTimersByTimeAsync(800)

        expect(useAssetsStore.getState().generations).toHaveLength(1)
        controller.stop()
      })
    })
  })
})

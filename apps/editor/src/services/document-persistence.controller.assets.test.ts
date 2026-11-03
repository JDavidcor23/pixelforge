import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { DocumentPayload, DocumentRepository, StoredDocument } from '@/types/document'
import type { DocStatus, PixelBuffer, SaveStatus } from '@/types'
import { LOCAL_DRAFT_DOCUMENT_ID, OPEN_SPRITE_ASSET_STORAGE_KEY } from '@/constants/persistence'
import { SPRITE_EDITOR_CANVAS } from '@/constants'
import { useAssetsStore } from '@/stores/assets.store'
import { createInMemoryDocumentRepository } from './in-memory-document.repository.service'
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
    useAssetsStore.setState({ generations: [], animations: [], repository: null, openAssetId: null })
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
})

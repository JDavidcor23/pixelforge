import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { DocumentId, DocumentPayload, DocumentRepository, StoredDocument } from '@/types/document'
import {
  startDocumentPersistence,
  type DocumentPersistenceStoreApi,
} from './document-persistence.controller'
import { createInMemoryDocumentRepository } from './in-memory-document.repository.service'
import type { DocStatus } from '@/types'

// Task 2.9 — rewritten for the phase 2 dispatch seam: the autosave trigger is
// now `docRevision` (bumped by `dispatch` on every document-content change)
// instead of `layers`/`timeline` reference identity, and the payload
// producer/consumer is `exportDocument`/`importDocument` instead of
// `storeStateToPayload`/`payloadToStoreState` (removed). The controller
// itself stays framework-free — no React or jsdom needed.

function emptyPayload(): DocumentPayload {
  return {
    schemaVersion: 1,
    w: 1,
    h: 1,
    frameMs: [83],
    frames: [{ id: 'f1', activeLayerId: 'l1', layers: [{ id: 'l1', name: 'l1', visible: true, locked: false, opacity: 100, data: new Uint8Array(4) }] }],
  }
}

function makeFakeStore(initialDocRevision = 0) {
  let docStatus: DocStatus = 'loading'
  let docRevision = initialDocRevision
  let doc = emptyPayload()
  const listeners = new Set<(state: { docRevision: number }) => void>()

  const api: DocumentPersistenceStoreApi = {
    getState: () => ({ docStatus, docRevision }),
    setState: (patch) => {
      if (patch.docStatus !== undefined) docStatus = patch.docStatus
      // colors are irrelevant to this controller's own tests
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    exportDocument: () => doc,
    importDocument: (payload) => {
      doc = payload
    },
  }

  return {
    api,
    getDocStatus: () => docStatus,
    /** Simulates a dispatch-driven document change (bumps docRevision, notifies subscribers). */
    bumpRevision: () => {
      docRevision += 1
      listeners.forEach((l) => l({ docRevision }))
    },
  }
}

function makeFakeRepository(overrides: Partial<DocumentRepository> = {}): DocumentRepository {
  return {
    load: vi.fn(async (_id: DocumentId) => null),
    save: vi.fn(async (_doc: StoredDocument) => {}),
    remove: vi.fn(async (_id: DocumentId) => {}),
    ...overrides,
  }
}

const fakeStorage = { getItem: () => null, removeItem: () => {} }

describe('startDocumentPersistence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('never calls save() for a document change that happened before restore finished', async () => {
    const repository = makeFakeRepository()
    const fakeStore = makeFakeStore()

    let releaseResolve: () => void = () => {}
    const resolveRepository = () =>
      new Promise<{ repository: DocumentRepository; isPersistent: boolean }>((resolve) => {
        releaseResolve = () => resolve({ repository, isPersistent: true })
      })

    const startPromise = startDocumentPersistence({
      resolveRepository,
      storage: fakeStorage,
      store: fakeStore.api,
      debounceMs: 800,
      scheduleTimeout: (fn, ms) => setTimeout(fn, ms),
      clearScheduledTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
      onPersistentChange: () => {},
    })

    // Simulate a dispatch WHILE the repository is still resolving — the
    // controller hasn't subscribed yet, so this must never trigger a save.
    fakeStore.bumpRevision()
    expect(repository.save).not.toHaveBeenCalled()

    releaseResolve()
    await startPromise

    expect(repository.save).not.toHaveBeenCalled()
    expect(fakeStore.getDocStatus()).toBe('ready')
  })

  it('debounces multiple rapid document revisions into a single save()', async () => {
    const repository = makeFakeRepository()
    const fakeStore = makeFakeStore()

    const controller = await startDocumentPersistence({
      resolveRepository: async () => ({ repository, isPersistent: true }),
      storage: fakeStorage,
      store: fakeStore.api,
      debounceMs: 800,
      scheduleTimeout: (fn, ms) => setTimeout(fn, ms),
      clearScheduledTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
      onPersistentChange: () => {},
    })

    fakeStore.bumpRevision()
    vi.advanceTimersByTime(300)
    fakeStore.bumpRevision()
    vi.advanceTimersByTime(300)
    fakeStore.bumpRevision()

    expect(repository.save).not.toHaveBeenCalled() // still inside the debounce window

    vi.advanceTimersByTime(800)

    expect(repository.save).toHaveBeenCalledTimes(1)
    controller.stop()
  })

  it('flush() saves immediately and cancels the pending debounce timer', async () => {
    const repository = makeFakeRepository()
    const fakeStore = makeFakeStore()

    const controller = await startDocumentPersistence({
      resolveRepository: async () => ({ repository, isPersistent: true }),
      storage: fakeStorage,
      store: fakeStore.api,
      debounceMs: 800,
      scheduleTimeout: (fn, ms) => setTimeout(fn, ms),
      clearScheduledTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
      onPersistentChange: () => {},
    })

    fakeStore.bumpRevision()
    controller.flush() // e.g. visibilitychange -> hidden, before the debounce fires

    expect(repository.save).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(800)
    expect(repository.save).toHaveBeenCalledTimes(1) // the cancelled timer never fired a 2nd save

    controller.stop()
  })

  it('hydrates the store (importDocument) from a loaded draft before setting docStatus to ready', async () => {
    const storedPayload: DocumentPayload = {
      schemaVersion: 1,
      w: 1,
      h: 1,
      frameMs: [83],
      frames: [{ id: 'f1', activeLayerId: 'restored-layer', layers: [{ id: 'restored-layer', name: 'r', visible: true, locked: false, opacity: 100, data: new Uint8Array(4) }] }],
    }
    const repository = makeFakeRepository({
      load: vi.fn(async () => ({ id: 'local-draft', revision: 5, updatedAt: 0, payload: storedPayload })),
    })
    const fakeStore = makeFakeStore()

    await startDocumentPersistence({
      resolveRepository: async () => ({ repository, isPersistent: true }),
      storage: fakeStorage,
      store: fakeStore.api,
      debounceMs: 800,
      scheduleTimeout: (fn, ms) => setTimeout(fn, ms),
      clearScheduledTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
      onPersistentChange: () => {},
    })

    expect(fakeStore.api.exportDocument()).toEqual(storedPayload)
    expect(fakeStore.getDocStatus()).toBe('ready')
  })

  // Carry-over item B (phase 1 verify-report WARNING): `startDocumentPersistence`
  // must REJECT (not hang) when something in resolve/migrate/restore fails,
  // so `useDocumentPersistence.hook.ts`'s `.catch()` has something to react
  // to — otherwise `docStatus` never reaches `'ready'` and the UI is stuck
  // on "Restoring your draft…" forever.
  it('propagates (rejects) when resolveRepository() fails, instead of hanging', async () => {
    const fakeStore = makeFakeStore()
    const boom = new Error('IndexedDB open failed in a way resolveRepository could not recover from')

    await expect(
      startDocumentPersistence({
        resolveRepository: async () => {
          throw boom
        },
        storage: fakeStorage,
        store: fakeStore.api,
        debounceMs: 800,
        scheduleTimeout: (fn, ms) => setTimeout(fn, ms),
        clearScheduledTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
        onPersistentChange: () => {},
      })
    ).rejects.toThrow(boom)

    expect(fakeStore.getDocStatus()).toBe('loading') // never reached ready on its own
  })

  it('propagates (rejects) when the legacy migration save() fails mid-restore', async () => {
    const repository = makeFakeRepository({
      save: vi.fn(async () => {
        throw new Error('QuotaExceededError')
      }),
    })
    const fakeStore = makeFakeStore()
    const legacyStorage = {
      getItem: () => JSON.stringify({ state: { layers: [{}], timeline: { frames: [{}] } } }),
      removeItem: () => {},
    }

    await expect(
      startDocumentPersistence({
        resolveRepository: async () => ({ repository, isPersistent: true }),
        storage: legacyStorage,
        store: fakeStore.api,
        debounceMs: 800,
        scheduleTimeout: (fn, ms) => setTimeout(fn, ms),
        clearScheduledTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
        onPersistentChange: () => {},
      })
    ).rejects.toThrow()

    expect(fakeStore.getDocStatus()).toBe('loading')
  })

  // Item B's actual fix: the safe-mode fallback `useDocumentPersistence.hook.ts`
  // starts in its `.catch()` — a fresh in-memory repository with no-op
  // storage. Verifies this building block, on its own, reaches `'ready'`
  // without ever reading or writing real storage, and that saves land only
  // in the fresh in-memory repo (never touching whatever the real stored
  // draft was).
  it('safe-mode fallback: an in-memory repository + no-op storage reaches ready without touching real storage', async () => {
    const fakeStore = makeFakeStore()
    const safeModeRepository = createInMemoryDocumentRepository()
    const noopStorage = { getItem: () => null, removeItem: () => {} }

    const controller = await startDocumentPersistence({
      resolveRepository: async () => ({ repository: safeModeRepository, isPersistent: false }),
      storage: noopStorage,
      store: fakeStore.api,
      debounceMs: 800,
      scheduleTimeout: (fn, ms) => setTimeout(fn, ms),
      clearScheduledTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
      onPersistentChange: () => {},
    })

    expect(fakeStore.getDocStatus()).toBe('ready')

    fakeStore.bumpRevision()
    controller.flush()
    expect(await safeModeRepository.load('local-draft')).not.toBeNull()

    controller.stop()
  })

  // Judgment-day round 2, finding 8.
  describe('judgment-day round 2 / finding 8: cancelled-before-resolve double start, and flush() only when dirty', () => {
    it('a call cancelled before its resolveRepository() resolves never imports — the still-active concurrent call does, exactly once', async () => {
      const storedPayload: DocumentPayload = {
        schemaVersion: 1,
        w: 1,
        h: 1,
        frameMs: [83],
        frames: [{ id: 'f1', activeLayerId: 'restored', layers: [{ id: 'restored', name: 'r', visible: true, locked: false, opacity: 100, data: new Uint8Array(4) }] }],
      }
      const repository = makeFakeRepository({ load: vi.fn(async () => ({ id: 'local-draft', revision: 5, updatedAt: 0, payload: storedPayload })) })
      const fakeStore = makeFakeStore()

      // Mirrors React StrictMode's dev-only mount -> cleanup -> mount: the
      // FIRST call's effect is cleaned up (cancelled1 flips true)
      // SYNCHRONOUSLY, before its resolveRepository() promise ever settles.
      let cancelled1 = false
      let releaseResolve1: () => void = () => {}
      const call1 = startDocumentPersistence({
        resolveRepository: () =>
          new Promise((resolve) => {
            releaseResolve1 = () => resolve({ repository, isPersistent: true })
          }),
        storage: fakeStorage,
        store: fakeStore.api,
        debounceMs: 800,
        scheduleTimeout: (fn, ms) => setTimeout(fn, ms),
        clearScheduledTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
        onPersistentChange: () => {},
        isCancelled: () => cancelled1,
      })
      cancelled1 = true

      // The SECOND (genuinely active) call — same store, same repository.
      const call2 = startDocumentPersistence({
        resolveRepository: async () => ({ repository, isPersistent: true }),
        storage: fakeStorage,
        store: fakeStore.api,
        debounceMs: 800,
        scheduleTimeout: (fn, ms) => setTimeout(fn, ms),
        clearScheduledTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
        onPersistentChange: () => {},
        isCancelled: () => false,
      })

      releaseResolve1()
      const [c1, c2] = await Promise.all([call1, call2])

      // Exactly ONE of the two ever reads/imports the stored draft —
      // regardless of which call's resolveRepository() happened to settle
      // first — and the document ends up correctly hydrated either way.
      expect(repository.load).toHaveBeenCalledTimes(1)
      expect(fakeStore.getDocStatus()).toBe('ready')
      expect(fakeStore.api.exportDocument()).toEqual(storedPayload)

      c1.stop()
      c2.stop()
    })

    it('flush() with nothing pending/dirty is a no-op — does not call save()', async () => {
      const repository = makeFakeRepository()
      const fakeStore = makeFakeStore()

      const controller = await startDocumentPersistence({
        resolveRepository: async () => ({ repository, isPersistent: true }),
        storage: fakeStorage,
        store: fakeStore.api,
        debounceMs: 800,
        scheduleTimeout: (fn, ms) => setTimeout(fn, ms),
        clearScheduledTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
        onPersistentChange: () => {},
      })

      controller.flush() // nothing dirty since hydration — must be a no-op
      expect(repository.save).not.toHaveBeenCalled()

      fakeStore.bumpRevision()
      controller.flush()
      expect(repository.save).toHaveBeenCalledTimes(1)

      controller.flush() // already saved, nothing new since — still a no-op
      expect(repository.save).toHaveBeenCalledTimes(1)

      controller.stop()
    })
  })
})

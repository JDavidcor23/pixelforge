/**
 * Phase 7f CRITICAL #1 ("the flag is dead"): `startDocumentPersistence` must
 * await `waitForWasmModule()` during the `docStatus: 'loading'` gate when
 * `resolveCoreImpl() === 'wasm'`, BEFORE importing a restored draft and
 * BEFORE flipping `docStatus` to `'ready'` — otherwise `core.slice.ts`'s
 * lazy `ensureCore()` (triggered by either of those) always races ahead of
 * the background Wasm load and permanently falls back to `TsPixelCore`.
 *
 * This file tests ONLY the gate's ordering — `core.slice.ts`'s actual
 * `ensureCore()`/`resolveCore()` wiring has its own coverage
 * (`core-config.test.ts`, `wasm-pixel-core-resolver.test.ts`). The `'ts'`
 * default path (unaffected) already has coverage in
 * `document-persistence.controller.test.ts`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { DocumentId, DocumentPayload, DocumentRepository, StoredDocument } from '@/types/document'
import type { DocStatus } from '@/types'

const mockResolveCoreImpl = vi.fn<() => 'ts' | 'wasm'>(() => 'ts')
vi.mock('@/lib/core/core-config', () => ({
  resolveCoreImpl: () => mockResolveCoreImpl(),
}))

let waitResolve: (() => void) | null = null
const mockWaitForWasmModule = vi.fn(
  () =>
    new Promise<void>((resolve) => {
      waitResolve = resolve
    })
)
vi.mock('@/lib/core/wasm-pixel-core-resolver', () => ({
  waitForWasmModule: () => mockWaitForWasmModule(),
}))

function emptyPayload(): DocumentPayload {
  return {
    schemaVersion: 1,
    w: 1,
    h: 1,
    frameMs: [83],
    frames: [{ id: 'f1', activeLayerId: 'l1', layers: [{ id: 'l1', name: 'l1', visible: true, locked: false, opacity: 100, data: new Uint8Array(4) }] }],
  }
}

function makeFakeStore() {
  let docStatus: DocStatus = 'loading'
  let docRevision = 0
  const importDocumentCalls: DocumentPayload[] = []
  const listeners = new Set<(state: { docRevision: number }) => void>()

  return {
    api: {
      getState: () => ({ docStatus, docRevision }),
      setState: (patch: Partial<{ docStatus: DocStatus }>) => {
        if (patch.docStatus !== undefined) docStatus = patch.docStatus
      },
      subscribe: (listener: (state: { docRevision: number }) => void) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
      },
      exportDocument: () => emptyPayload(),
      importDocument: (payload: DocumentPayload) => {
        importDocumentCalls.push(payload)
      },
    },
    getDocStatus: () => docStatus,
    importDocumentCalls,
  }
}

function makeFakeRepository(stored: StoredDocument | null): DocumentRepository {
  return {
    load: vi.fn(async (_id: DocumentId) => stored),
    save: vi.fn(async (_doc: StoredDocument) => {}),
    remove: vi.fn(async (_id: DocumentId) => {}),
  }
}

const fakeStorage = { getItem: () => null, removeItem: () => {} }

describe('startDocumentPersistence — Wasm readiness gate (phase 7f CRITICAL #1)', () => {
  beforeEach(() => {
    mockResolveCoreImpl.mockReset()
    mockWaitForWasmModule.mockClear()
    waitResolve = null
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('"ts" (default): never calls waitForWasmModule at all', async () => {
    mockResolveCoreImpl.mockReturnValue('ts')
    const { startDocumentPersistence } = await import('./document-persistence.controller')
    const fakeStore = makeFakeStore()

    await startDocumentPersistence({
      resolveRepository: async () => ({ repository: makeFakeRepository(null), isPersistent: true }),
      storage: fakeStorage,
      store: fakeStore.api,
      debounceMs: 100,
      scheduleTimeout: (fn) => setTimeout(fn, 0),
      clearScheduledTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
      onPersistentChange: () => {},
    })

    expect(mockWaitForWasmModule).not.toHaveBeenCalled()
    expect(fakeStore.getDocStatus()).toBe('ready')
  })

  it('"wasm": docStatus does NOT reach \'ready\' until waitForWasmModule resolves', async () => {
    mockResolveCoreImpl.mockReturnValue('wasm')
    const { startDocumentPersistence } = await import('./document-persistence.controller')
    const fakeStore = makeFakeStore()

    const startPromise = startDocumentPersistence({
      resolveRepository: async () => ({ repository: makeFakeRepository(null), isPersistent: true }),
      storage: fakeStorage,
      store: fakeStore.api,
      debounceMs: 100,
      scheduleTimeout: (fn) => setTimeout(fn, 0),
      clearScheduledTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
      onPersistentChange: () => {},
    })

    // let the microtask queue drain up to the point the gate should be blocking.
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    expect(mockWaitForWasmModule).toHaveBeenCalledTimes(1)
    expect(fakeStore.getDocStatus()).toBe('loading') // still gated — the canvas must not be interactive yet

    waitResolve?.()
    await startPromise

    expect(fakeStore.getDocStatus()).toBe('ready')
  })

  it('"wasm": a stored draft is only imported AFTER the Wasm module has settled', async () => {
    mockResolveCoreImpl.mockReturnValue('wasm')
    const { startDocumentPersistence } = await import('./document-persistence.controller')
    const fakeStore = makeFakeStore()
    const stored: StoredDocument = { id: 'local-draft', revision: 1, updatedAt: 0, payload: emptyPayload() }

    const startPromise = startDocumentPersistence({
      resolveRepository: async () => ({ repository: makeFakeRepository(stored), isPersistent: true }),
      storage: fakeStorage,
      store: fakeStore.api,
      debounceMs: 100,
      scheduleTimeout: (fn) => setTimeout(fn, 0),
      clearScheduledTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
      onPersistentChange: () => {},
    })

    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    expect(fakeStore.importDocumentCalls).toHaveLength(0) // not imported yet — still waiting on the Wasm gate

    waitResolve?.()
    await startPromise

    expect(fakeStore.importDocumentCalls).toHaveLength(1)
    expect(fakeStore.getDocStatus()).toBe('ready')
  })
})

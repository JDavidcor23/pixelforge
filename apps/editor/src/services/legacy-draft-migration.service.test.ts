import { describe, it, expect, vi } from 'vitest'
import type { DocumentId, DocumentRepository, StoredDocument } from '@/types/document'
import { migrateLegacyDraft } from './legacy-draft-migration.service'
import { LEGACY_SPRITE_EDITOR_STORAGE_KEY, LOCAL_DRAFT_DOCUMENT_ID } from '@/constants/persistence'

// Task 1.25 — "Legacy localStorage draft is migrated once" (pixel-core spec
// scenario), plus the ordering gotcha from design.md's Migration/Rollout
// section: the legacy key is removed ONLY after `save()` resolves.

function makeFakeStorage(initial: Record<string, string> = {}): Pick<Storage, 'getItem' | 'removeItem'> & {
  data: Record<string, string>
} {
  const data = { ...initial }
  return {
    data,
    getItem: (key: string) => data[key] ?? null,
    removeItem: (key: string) => { delete data[key] },
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

const RED = { r: 255, g: 0, b: 0, a: 255 }
const GREEN = { r: 0, g: 255, b: 0, a: 255 }

function legacyLayer(id: string) {
  return { id, name: `Layer ${id}`, visible: true, locked: false, opacity: 100, pixels: [[{ ...RED }]] }
}

function legacyRaw() {
  return JSON.stringify({
    state: {
      canvasWidth: 1,
      canvasHeight: 1,
      layers: [legacyLayer('l1')],
      activeLayerId: 'l1',
      timeline: {
        frames: [{ id: 'f1', layers: [legacyLayer('l1')], activeLayerId: 'l1', durationMs: 83 }],
        currentFrameIndex: 0,
      },
      primaryColor: RED,
      secondaryColor: GREEN,
    },
    version: 0,
  })
}

describe('migrateLegacyDraft', () => {
  it('does nothing when there is no legacy entry', async () => {
    const repository = makeFakeRepository()
    const storage = makeFakeStorage()

    const result = await migrateLegacyDraft(repository, storage)

    expect(result).toEqual({ migrated: false, colors: null })
    expect(repository.save).not.toHaveBeenCalled()
  })

  it('removes the legacy key WITHOUT converting when an IndexedDB draft already exists', async () => {
    const existing: StoredDocument = {
      id: LOCAL_DRAFT_DOCUMENT_ID,
      revision: 3,
      updatedAt: 1,
      payload: { schemaVersion: 1, w: 1, h: 1, frameMs: [83], frames: [] },
    }
    const repository = makeFakeRepository({ load: vi.fn(async () => existing) })
    const storage = makeFakeStorage({ [LEGACY_SPRITE_EDITOR_STORAGE_KEY]: legacyRaw() })

    const result = await migrateLegacyDraft(repository, storage)

    expect(result).toEqual({ migrated: false, colors: null })
    expect(repository.save).not.toHaveBeenCalled()
    expect(storage.data[LEGACY_SPRITE_EDITOR_STORAGE_KEY]).toBeUndefined()
  })

  it('converts RgbaColor[][] to a flat-buffer StoredDocument and saves it once', async () => {
    const repository = makeFakeRepository()
    const storage = makeFakeStorage({ [LEGACY_SPRITE_EDITOR_STORAGE_KEY]: legacyRaw() })

    const result = await migrateLegacyDraft(repository, storage)

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = (repository.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as StoredDocument
    expect(saved.id).toBe(LOCAL_DRAFT_DOCUMENT_ID)
    expect(saved.revision).toBe(1)
    expect(saved.payload.frames[0].layers[0].data).toBeInstanceOf(Uint8Array)
    expect(Array.from(saved.payload.frames[0].layers[0].data)).toEqual([255, 0, 0, 255])

    expect(result.migrated).toBe(true)
    expect(result.colors).toEqual({ primaryColor: RED, secondaryColor: GREEN })
  })

  it('removes the legacy key ONLY AFTER save() resolves', async () => {
    const repository = makeFakeRepository()
    const storage = makeFakeStorage({ [LEGACY_SPRITE_EDITOR_STORAGE_KEY]: legacyRaw() })

    await migrateLegacyDraft(repository, storage)

    expect(storage.data[LEGACY_SPRITE_EDITOR_STORAGE_KEY]).toBeUndefined()
  })

  it('keeps the legacy key when save() fails, so the next load retries', async () => {
    const repository = makeFakeRepository({ save: vi.fn(async () => { throw new Error('quota exceeded') }) })
    const storage = makeFakeStorage({ [LEGACY_SPRITE_EDITOR_STORAGE_KEY]: legacyRaw() })

    await expect(migrateLegacyDraft(repository, storage)).rejects.toThrow('quota exceeded')

    expect(storage.data[LEGACY_SPRITE_EDITOR_STORAGE_KEY]).toBe(legacyRaw())
  })

  it('leaves an unparseable legacy entry untouched', async () => {
    const repository = makeFakeRepository()
    const storage = makeFakeStorage({ [LEGACY_SPRITE_EDITOR_STORAGE_KEY]: 'not json' })

    const result = await migrateLegacyDraft(repository, storage)

    expect(result).toEqual({ migrated: false, colors: null })
    expect(repository.save).not.toHaveBeenCalled()
    expect(storage.data[LEGACY_SPRITE_EDITOR_STORAGE_KEY]).toBe('not json')
  })

  it('leaves an entry with no layers/timeline untouched', async () => {
    const repository = makeFakeRepository()
    const storage = makeFakeStorage({
      [LEGACY_SPRITE_EDITOR_STORAGE_KEY]: JSON.stringify({ state: { primaryColor: RED }, version: 0 }),
    })

    const result = await migrateLegacyDraft(repository, storage)

    expect(result).toEqual({ migrated: false, colors: null })
    expect(repository.save).not.toHaveBeenCalled()
  })
})

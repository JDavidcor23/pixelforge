import { describe, it, expect, vi, afterEach } from 'vitest'
import type { DocumentRepository } from '@/types/document'
import { DRAFT_MIGRATION_ASSET_STORAGE_KEY, OPEN_SPRITE_ASSET_STORAGE_KEY } from '@/constants/persistence'
import { clearLocalSpriteData } from './clear-local-sprite-data.service'

const fakeRepository = (overrides: Partial<DocumentRepository> = {}): DocumentRepository => ({
  load: async () => null,
  save: async () => {},
  remove: vi.fn(async () => {}),
  clear: vi.fn(async () => {}),
  ...overrides,
})

const fakeStorage = (initial: Record<string, string>) => {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: vi.fn((key: string) => void map.delete(key)),
    has: (key: string) => map.has(key),
  }
}

describe('clearLocalSpriteData', () => {
  afterEach(() => vi.restoreAllMocks())

  it('clears every stored document and forgets the open asset and the migration marker', async () => {
    const repository = fakeRepository()
    const storage = fakeStorage({ [OPEN_SPRITE_ASSET_STORAGE_KEY]: 'a1', [DRAFT_MIGRATION_ASSET_STORAGE_KEY]: 'a1' })

    await clearLocalSpriteData({ resolveRepository: async () => ({ repository, isPersistent: true }), storage })

    expect(repository.clear).toHaveBeenCalledTimes(1)
    expect(repository.remove).not.toHaveBeenCalled()
    expect(storage.has(OPEN_SPRITE_ASSET_STORAGE_KEY)).toBe(false)
    expect(storage.has(DRAFT_MIGRATION_ASSET_STORAGE_KEY)).toBe(false)
  })

  it('a failing repository does not stop the localStorage keys from being removed', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const repository = fakeRepository({ clear: async () => { throw new Error('idb blocked') } })
    const storage = fakeStorage({ [OPEN_SPRITE_ASSET_STORAGE_KEY]: 'a1', [DRAFT_MIGRATION_ASSET_STORAGE_KEY]: 'a1' })

    await clearLocalSpriteData({ resolveRepository: async () => ({ repository, isPersistent: true }), storage })

    expect(errorSpy).toHaveBeenCalled()
    expect(storage.has(OPEN_SPRITE_ASSET_STORAGE_KEY)).toBe(false)
    expect(storage.has(DRAFT_MIGRATION_ASSET_STORAGE_KEY)).toBe(false)
  })

  it('a failing first key removal does not stop the second', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const storage = fakeStorage({ [DRAFT_MIGRATION_ASSET_STORAGE_KEY]: 'a1' })
    storage.removeItem.mockImplementationOnce(() => {
      throw new Error('denied')
    })

    await clearLocalSpriteData({ resolveRepository: async () => ({ repository: fakeRepository(), isPersistent: true }), storage })

    expect(errorSpy).toHaveBeenCalled()
    expect(storage.has(DRAFT_MIGRATION_ASSET_STORAGE_KEY)).toBe(false)
  })
})

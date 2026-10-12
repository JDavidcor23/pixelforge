import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAssetsStore } from './assets.store'
import { ANIMATION_HISTORY_STORAGE_KEY, GENERATION_HISTORY_STORAGE_KEY } from '@/constants'
import { ASSET_LIBRARY_LIMIT } from '@/constants/persistence'
import { createInMemoryAssetLibraryRepository } from '@/services/in-memory-asset-library.repository.service'
import type { AIGeneration } from '@/types'

/**
 * `vite.config.ts` runs this suite under `environment: 'node'` (no jsdom
 * dependency in this workspace) — `localStorage` isn't a real global here,
 * so it's stubbed in-memory for the duration of each test, same approach as
 * `animation-history.test.ts` / `generation-history.test.ts` use at the
 * lower level (mocked `Pick<Storage, 'removeItem' | 'setItem'>`).
 */
function createMemoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
    removeItem: (key: string) => {
      data.delete(key)
    },
    clear: () => data.clear(),
    key: () => null,
    get length() {
      return data.size
    },
  }
}

describe('useAssetsStore.clearLocalHistory', () => {
  const storage = createMemoryStorage()

  beforeEach(() => {
    storage.clear()
    vi.stubGlobal('localStorage', storage)
    useAssetsStore.setState({
      generations: [],
      animations: [],
      repository: null,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resets generations and animations', () => {
    useAssetsStore.getState().addGeneration({
      prompt: 'a cute dragon',
      base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      width: 1,
      height: 1,
    })

    useAssetsStore.getState().clearLocalHistory()

    const state = useAssetsStore.getState()
    expect(state.generations).toEqual([])
    expect(state.animations).toEqual([])
  })

  it('removes the persisted history keys from localStorage', () => {
    useAssetsStore.getState().addGeneration({
      prompt: 'a cute dragon',
      base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      width: 1,
      height: 1,
    })
    expect(storage.getItem(GENERATION_HISTORY_STORAGE_KEY)).not.toBeNull()

    useAssetsStore.getState().clearLocalHistory()

    expect(storage.getItem(GENERATION_HISTORY_STORAGE_KEY)).toBeNull()
    expect(storage.getItem(ANIMATION_HISTORY_STORAGE_KEY)).toBeNull()
  })
})

const PIXEL_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

const generation = (id: string, timestamp: number): AIGeneration => ({
  id,
  timestamp,
  prompt: `sprite ${id}`,
  base64: PIXEL_PNG,
  width: 1,
  height: 1,
})

describe('useAssetsStore.hydrate (IndexedDB library)', () => {
  const storage = createMemoryStorage()

  beforeEach(() => {
    storage.clear()
    vi.stubGlobal('localStorage', storage)
    useAssetsStore.setState({
      generations: [],
      animations: [],
      repository: null,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('migrates the legacy localStorage history into the repository and drops the legacy keys', async () => {
    const legacy = [generation('old-1', 2), generation('old-2', 1)]
    storage.setItem(GENERATION_HISTORY_STORAGE_KEY, JSON.stringify(legacy))
    useAssetsStore.setState({ generations: legacy })
    const repository = createInMemoryAssetLibraryRepository()

    await useAssetsStore.getState().hydrate(repository)

    expect((await repository.loadAll()).generations.map((g) => g.id)).toEqual(['old-1', 'old-2'])
    expect(storage.getItem(GENERATION_HISTORY_STORAGE_KEY)).toBeNull()
    expect(useAssetsStore.getState().generations.map((g) => g.id)).toEqual(['old-1', 'old-2'])
  })

  it('loads what the repository already holds, newest first', async () => {
    const repository = createInMemoryAssetLibraryRepository()
    await repository.putGenerations([generation('a', 1), generation('b', 3), generation('c', 2)])

    await useAssetsStore.getState().hydrate(repository)

    expect(useAssetsStore.getState().generations.map((g) => g.id)).toEqual(['b', 'c', 'a'])
  })

  it('saves new generations to the repository instead of localStorage once hydrated', async () => {
    const repository = createInMemoryAssetLibraryRepository()
    await useAssetsStore.getState().hydrate(repository)

    const added = useAssetsStore.getState().addGeneration({ prompt: 'a knight', base64: PIXEL_PNG, width: 1, height: 1 })
    await vi.waitFor(async () => {
      expect((await repository.loadAll()).generations.map((g) => g.id)).toEqual([added.id])
    })
    expect(storage.getItem(GENERATION_HISTORY_STORAGE_KEY)).toBeNull()
  })

  it(`keeps more than the legacy 10 entries, capped at ${ASSET_LIBRARY_LIMIT}`, async () => {
    const repository = createInMemoryAssetLibraryRepository()
    await repository.putGenerations(
      Array.from({ length: ASSET_LIBRARY_LIMIT + 5 }, (_, i) => generation(`g${i}`, i)),
    )

    await useAssetsStore.getState().hydrate(repository)

    expect(useAssetsStore.getState().generations).toHaveLength(ASSET_LIBRARY_LIMIT)
    expect((await repository.loadAll()).generations).toHaveLength(ASSET_LIBRARY_LIMIT)
    // The 5 oldest are the ones evicted.
    expect(useAssetsStore.getState().generations.at(-1)?.id).toBe('g5')
  })

  it('clearLocalHistory also empties the repository', async () => {
    const repository = createInMemoryAssetLibraryRepository()
    await repository.putGenerations([generation('a', 1)])
    await useAssetsStore.getState().hydrate(repository)

    useAssetsStore.getState().clearLocalHistory()

    await vi.waitFor(async () => {
      expect((await repository.loadAll()).generations).toEqual([])
    })
  })
})

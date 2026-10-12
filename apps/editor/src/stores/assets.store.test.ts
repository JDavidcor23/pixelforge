import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAssetsStore } from './assets.store'
import { ANIMATION_HISTORY_STORAGE_KEY, GENERATION_HISTORY_STORAGE_KEY } from '@/constants'

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
      sheetsAvailableForDownload: new Set(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resets generations, animations and the download-availability set', () => {
    useAssetsStore.getState().addGeneration({
      prompt: 'a cute dragon',
      base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      width: 1,
      height: 1,
    })
    useAssetsStore.getState().markSheetAvailable('some-animation-id')

    useAssetsStore.getState().clearLocalHistory()

    const state = useAssetsStore.getState()
    expect(state.generations).toEqual([])
    expect(state.animations).toEqual([])
    expect(state.sheetsAvailableForDownload.size).toBe(0)
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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAssetsStore } from './assets.store'
import { ANIMATION_HISTORY_STORAGE_KEY, GENERATION_HISTORY_STORAGE_KEY } from '@/constants'
import { ASSET_LIBRARY_LIMIT } from '@/constants/persistence'
import { createInMemoryAssetLibraryRepository } from '@/services/in-memory-asset-library.repository.service'
import type { AIAnimation, AIGeneration } from '@/types'

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

describe('useAssetsStore.addDrawing (ADR 0010, Phase 1 — File > Save As…)', () => {
  const storage = createMemoryStorage()

  beforeEach(() => {
    storage.clear()
    vi.stubGlobal('localStorage', storage)
    useAssetsStore.setState({ generations: [], animations: [], repository: null })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('adds a kind: "drawing" entry to the same generations slice as addGeneration', () => {
    const added = useAssetsStore.getState().addDrawing({
      prompt: 'my hand-drawn hero',
      base64: PIXEL_PNG,
      width: 16,
      height: 16,
      assetType: 'character',
    })

    expect(added.kind).toBe('drawing')
    expect(useAssetsStore.getState().generations.map((g) => g.id)).toEqual([added.id])
  })

  it('persists through the Assets repository, same as a generation (S2: survives reload)', async () => {
    const repository = createInMemoryAssetLibraryRepository()
    await useAssetsStore.getState().hydrate(repository)

    const added = useAssetsStore.getState().addDrawing({
      prompt: 'blank canvas sketch',
      base64: PIXEL_PNG,
      width: 8,
      height: 8,
      assetType: 'object',
    })

    await vi.waitFor(async () => {
      const stored = (await repository.loadAll()).generations
      expect(stored.map((g) => g.id)).toEqual([added.id])
      expect(stored[0]?.kind).toBe('drawing')
    })
  })

  it('does not touch the autosave draft or any animation state (S3)', () => {
    useAssetsStore.getState().addDrawing({
      prompt: 'untitled drawing',
      base64: PIXEL_PNG,
      width: 4,
      height: 4,
      assetType: 'effect',
    })

    expect(useAssetsStore.getState().animations).toEqual([])
  })

  it('leaves addGeneration/addAnimation producing plain, kind-less generations (S4 regression)', () => {
    const generated = useAssetsStore.getState().addGeneration({
      prompt: 'a cute dragon',
      base64: PIXEL_PNG,
      width: 1,
      height: 1,
    })

    expect(generated.kind).toBeUndefined()
    useAssetsStore.getState().addDrawing({ prompt: 'a sketch', base64: PIXEL_PNG, width: 1, height: 1, assetType: 'object' })

    const [drawing, generation] = useAssetsStore.getState().generations
    expect(generation.kind).toBeUndefined()
    expect(drawing.kind).toBe('drawing')
  })
})

describe('useAssetsStore.renameItem / setItemAssetType (ADR 0010, Phase 2)', () => {
  const storage = createMemoryStorage()

  beforeEach(() => {
    storage.clear()
    vi.stubGlobal('localStorage', storage)
    useAssetsStore.setState({ generations: [], animations: [], repository: null })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const makeAnimation = (id: string, overrides: Partial<AIAnimation> = {}): AIAnimation => ({
    pipelineVersion: 1,
    id,
    label: 'old anim',
    frames: [PIXEL_PNG],
    frameDurationMs: 100,
    timestamp: Date.now(),
    assetType: 'character',
    ...overrides,
  })

  it('renames a generation (S6, S8)', () => {
    const added = useAssetsStore.getState().addGeneration({ prompt: 'old name', base64: PIXEL_PNG, width: 1, height: 1 })

    useAssetsStore.getState().renameItem(added.id, 'generation', 'new name')

    expect(useAssetsStore.getState().generations.find((g) => g.id === added.id)?.prompt).toBe('new name')
  })

  it('renames a drawing (S6, S8)', () => {
    const added = useAssetsStore
      .getState()
      .addDrawing({ prompt: 'old sketch', base64: PIXEL_PNG, width: 1, height: 1, assetType: 'object' })

    useAssetsStore.getState().renameItem(added.id, 'drawing', 'new sketch')

    const renamed = useAssetsStore.getState().generations.find((g) => g.id === added.id)
    expect(renamed?.prompt).toBe('new sketch')
    expect(renamed?.kind).toBe('drawing')
  })

  it('renames an animation (S6, S8)', () => {
    useAssetsStore.getState().addAnimation(makeAnimation('anim-1'))

    useAssetsStore.getState().renameItem('anim-1', 'animation', 'new anim')

    expect(useAssetsStore.getState().animations.find((a) => a.id === 'anim-1')?.label).toBe('new anim')
  })

  it('ignores an empty/blank rename', () => {
    const added = useAssetsStore.getState().addGeneration({ prompt: 'keep me', base64: PIXEL_PNG, width: 1, height: 1 })

    useAssetsStore.getState().renameItem(added.id, 'generation', '   ')

    expect(useAssetsStore.getState().generations.find((g) => g.id === added.id)?.prompt).toBe('keep me')
  })

  it('does not rename other items (regression)', () => {
    const a = useAssetsStore.getState().addGeneration({ prompt: 'a', base64: PIXEL_PNG, width: 1, height: 1 })
    const b = useAssetsStore.getState().addGeneration({ prompt: 'b', base64: PIXEL_PNG, width: 1, height: 1 })

    useAssetsStore.getState().renameItem(a.id, 'generation', 'a renamed')

    expect(useAssetsStore.getState().generations.find((g) => g.id === a.id)?.prompt).toBe('a renamed')
    expect(useAssetsStore.getState().generations.find((g) => g.id === b.id)?.prompt).toBe('b')
  })

  it('moves a generation to a new asset type (S7, S8)', () => {
    const added = useAssetsStore
      .getState()
      .addGeneration({ prompt: 'a knight', base64: PIXEL_PNG, width: 1, height: 1, assetType: 'character' })

    useAssetsStore.getState().setItemAssetType(added.id, 'generation', 'object')

    expect(useAssetsStore.getState().generations.find((g) => g.id === added.id)?.assetType).toBe('object')
  })

  it('moves a drawing to a new asset type (S7, S8)', () => {
    const added = useAssetsStore
      .getState()
      .addDrawing({ prompt: 'a sketch', base64: PIXEL_PNG, width: 1, height: 1, assetType: 'character' })

    useAssetsStore.getState().setItemAssetType(added.id, 'drawing', 'weapon')

    const moved = useAssetsStore.getState().generations.find((g) => g.id === added.id)
    expect(moved?.assetType).toBe('weapon')
    expect(moved?.kind).toBe('drawing')
  })

  it('moves an animation to a new asset type (S7, S8)', () => {
    useAssetsStore.getState().addAnimation(makeAnimation('anim-2', { label: 'walk cycle' }))

    useAssetsStore.getState().setItemAssetType('anim-2', 'animation', 'costume')

    expect(useAssetsStore.getState().animations.find((a) => a.id === 'anim-2')?.assetType).toBe('costume')
  })

  it('does not move other items (regression)', () => {
    const a = useAssetsStore
      .getState()
      .addGeneration({ prompt: 'a', base64: PIXEL_PNG, width: 1, height: 1, assetType: 'character' })
    const b = useAssetsStore
      .getState()
      .addGeneration({ prompt: 'b', base64: PIXEL_PNG, width: 1, height: 1, assetType: 'character' })

    useAssetsStore.getState().setItemAssetType(a.id, 'generation', 'weapon')

    expect(useAssetsStore.getState().generations.find((g) => g.id === a.id)?.assetType).toBe('weapon')
    expect(useAssetsStore.getState().generations.find((g) => g.id === b.id)?.assetType).toBe('character')
  })

  it('is a no-op when the id does not exist', () => {
    useAssetsStore.getState().addGeneration({ prompt: 'untouched', base64: PIXEL_PNG, width: 1, height: 1 })

    useAssetsStore.getState().renameItem('missing-id', 'generation', 'nope')
    useAssetsStore.getState().setItemAssetType('missing-id', 'generation', 'object')

    expect(useAssetsStore.getState().generations).toHaveLength(1)
    expect(useAssetsStore.getState().generations[0]?.prompt).toBe('untouched')
  })

  it('persists a rename through the repository (survives reload)', async () => {
    const repository = createInMemoryAssetLibraryRepository()
    await useAssetsStore.getState().hydrate(repository)
    const added = useAssetsStore.getState().addGeneration({ prompt: 'old', base64: PIXEL_PNG, width: 1, height: 1 })

    useAssetsStore.getState().renameItem(added.id, 'generation', 'renamed')

    await vi.waitFor(async () => {
      const stored = (await repository.loadAll()).generations
      expect(stored.find((g) => g.id === added.id)?.prompt).toBe('renamed')
    })
  })

  it('persists a move through the repository (survives reload)', async () => {
    const repository = createInMemoryAssetLibraryRepository()
    await useAssetsStore.getState().hydrate(repository)
    const added = useAssetsStore
      .getState()
      .addGeneration({ prompt: 'a prop', base64: PIXEL_PNG, width: 1, height: 1, assetType: 'character' })

    useAssetsStore.getState().setItemAssetType(added.id, 'generation', 'effect')

    await vi.waitFor(async () => {
      const stored = (await repository.loadAll()).generations
      expect(stored.find((g) => g.id === added.id)?.assetType).toBe('effect')
    })
  })
})

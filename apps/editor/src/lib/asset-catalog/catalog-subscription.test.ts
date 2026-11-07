import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAssetCatalogStore } from '@/stores/asset-catalog.store'
import { useAssetsStore } from '@/stores/assets.store'
import { useSoundsStore } from '@/stores/sounds.store'
import type { AIGeneration } from '@/types'
import type { AudioAsset } from '@/types/audio'
import type { AssetCatalog, CatalogEntry } from '@/types/asset-catalog.types'
import { getCatalogEntry, subscribeToCatalogEntry } from './catalog-subscription'

const generation = (id: string): AIGeneration => ({
  id,
  prompt: id,
  base64: 'data:image/png;base64,AAAA',
  timestamp: 1,
  width: 8,
  height: 8,
})

const sound = (id: string): AudioAsset => ({
  id,
  name: id,
  tags: [],
  duration: 1,
  format: 'wav',
  fileSize: 1,
  associatedSpriteIds: [],
  createdAt: '2026-01-01',
})

const entry = (id: string, revision: number): CatalogEntry => ({
  id,
  kind: 'sprite',
  revision,
  levelId: undefined,
  chatTurnId: undefined,
  name: id,
  storage: { type: 'sprite-library', assetId: id },
})

const catalogOf = (...entries: CatalogEntry[]): AssetCatalog => ({
  byId: Object.fromEntries(entries.map((e) => [e.id, e])),
  allIds: entries.map((e) => e.id),
})

describe('subscribeToCatalogEntry', () => {
  beforeEach(() => {
    useAssetCatalogStore.setState(catalogOf(entry('a', 0), entry('b', 0)), true)
  })

  it('does not fire on subscribe and exposes the current value through getCatalogEntry', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToCatalogEntry('a', listener)
    expect(listener).not.toHaveBeenCalled()
    expect(getCatalogEntry('a')?.revision).toBe(0)
    expect(getCatalogEntry('missing')).toBeUndefined()
    unsubscribe()
  })

  it('fires once with the new entry when its revision is bumped', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToCatalogEntry('a', listener)
    useAssetCatalogStore.setState(catalogOf(entry('a', 1), useAssetCatalogStore.getState().byId.b), true)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ id: 'a', revision: 1 }))
    unsubscribe()
  })

  it('does not fire when another id changes', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToCatalogEntry('a', listener)
    useAssetCatalogStore.setState(catalogOf(useAssetCatalogStore.getState().byId.a, entry('b', 5)), true)
    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
  })

  it('does not fire when the same entry object is kept', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToCatalogEntry('a', listener)
    const { a, b } = useAssetCatalogStore.getState().byId
    useAssetCatalogStore.setState(catalogOf(a, b), true)
    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
  })

  it('fires with undefined when the entry is removed, and with the entry when it appears', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToCatalogEntry('a', listener)
    useAssetCatalogStore.setState(catalogOf(useAssetCatalogStore.getState().byId.b), true)
    expect(listener).toHaveBeenLastCalledWith(undefined)
    useAssetCatalogStore.setState(catalogOf(entry('a', 0)), true)
    expect(listener).toHaveBeenCalledTimes(2)
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'a' }))
    unsubscribe()
  })

  it('stops calling the listener after unsubscribe', () => {
    const listener = vi.fn()
    subscribeToCatalogEntry('a', listener)()
    useAssetCatalogStore.setState(catalogOf(entry('a', 9)), true)
    expect(listener).not.toHaveBeenCalled()
  })

  it('is reached by edits made through the real source stores', () => {
    useAssetsStore.setState({ generations: [generation('g')] })
    useSoundsStore.setState({ assets: [sound('s')] })
    const onSprite = vi.fn()
    const onSound = vi.fn()
    const offSprite = subscribeToCatalogEntry('g', onSprite)
    const offSound = subscribeToCatalogEntry('s', onSound)

    useAssetsStore
      .getState()
      .updateDrawingContent('g', { base64: 'data:image/png;base64,BBBB', width: 8, height: 8 })
    expect(onSprite).toHaveBeenCalledTimes(1)
    expect(onSprite).toHaveBeenCalledWith(expect.objectContaining({ id: 'g', revision: 1 }))
    expect(onSound).not.toHaveBeenCalled()

    useSoundsStore.getState().updateAsset('s', { name: 'renamed' })
    expect(onSound).toHaveBeenCalledTimes(1)
    expect(onSound).toHaveBeenCalledWith(expect.objectContaining({ id: 's', revision: 1 }))
    expect(onSprite).toHaveBeenCalledTimes(1)
    offSprite()
    offSound()
  })
})

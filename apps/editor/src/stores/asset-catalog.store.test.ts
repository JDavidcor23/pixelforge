import { describe, expect, it } from 'vitest'

import { selectCatalogEntry, selectCatalogIds, useAssetCatalogStore } from './asset-catalog.store'
import { useAssetsStore } from './assets.store'
import { useSoundsStore } from './sounds.store'
import type { AIGeneration } from '@/types'
import type { AudioAsset } from '@/types/audio'

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

describe('useAssetCatalogStore', () => {
  it('follows both source stores and changes only the edited entry', () => {
    useAssetsStore.setState({ generations: [generation('a'), generation('b')] })
    useSoundsStore.setState({ assets: [sound('s')] })

    const state = useAssetCatalogStore.getState()
    expect(selectCatalogIds(state)).toEqual(['a', 'b', 's'])
    const before = { a: selectCatalogEntry('a')(state), b: selectCatalogEntry('b')(state), s: selectCatalogEntry('s')(state) }

    useAssetsStore
      .getState()
      .updateDrawingContent('a', { base64: 'data:image/png;base64,BBBB', width: 8, height: 8 })

    const after = useAssetCatalogStore.getState()
    expect(selectCatalogEntry('a')(after)?.revision).toBe(1)
    expect(selectCatalogEntry('a')(after)).not.toBe(before.a)
    expect(selectCatalogEntry('b')(after)).toBe(before.b)
    expect(selectCatalogEntry('s')(after)).toBe(before.s)

    useSoundsStore.getState().updateAsset('s', { name: 'renamed' })
    const afterSound = useAssetCatalogStore.getState()
    expect(selectCatalogEntry('s')(afterSound)?.revision).toBe(1)
    expect(selectCatalogEntry('s')(afterSound)?.name).toBe('renamed')
    expect(selectCatalogEntry('a')(afterSound)).toBe(selectCatalogEntry('a')(after))
  })

  it('ignores unrelated source changes (no new state object)', () => {
    useAssetsStore.setState({ generations: [generation('a')] })
    const before = useAssetCatalogStore.getState()
    useAssetsStore.setState({ openAssetId: 'a' })
    expect(useAssetCatalogStore.getState()).toBe(before)
  })
})

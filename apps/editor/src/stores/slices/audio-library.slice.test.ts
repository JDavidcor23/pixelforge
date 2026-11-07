import { beforeEach, describe, expect, it } from 'vitest'

import { useSoundsStore } from '@/stores/sounds.store'
import type { AudioAsset } from '@/types/audio'

const asset: AudioAsset = {
  id: 'a1',
  name: 'Coin',
  tags: [],
  duration: 1,
  format: 'wav',
  fileSize: 1,
  associatedSpriteIds: [],
  createdAt: '2026-01-01',
}

const revisionOf = (id: string): number | undefined =>
  useSoundsStore.getState().assets.find((a) => a.id === id)?.revision

describe('audio library updateAsset revision (S3)', () => {
  beforeEach(() => {
    useSoundsStore.setState(useSoundsStore.getInitialState())
    useSoundsStore.getState().addAsset(asset)
    useSoundsStore.getState().addAsset({ ...asset, id: 'a2' })
  })

  it('starts without a revision and bumps by 1 per real change', () => {
    expect(revisionOf('a1')).toBeUndefined()
    useSoundsStore.getState().updateAsset('a1', { name: 'Coin 2' })
    expect(revisionOf('a1')).toBe(1)
    useSoundsStore.getState().updateAsset('a1', { name: 'Coin 3' })
    expect(revisionOf('a1')).toBe(2)
  })

  it('does not bump other assets', () => {
    useSoundsStore.getState().updateAsset('a1', { name: 'Coin 2' })
    expect(revisionOf('a2')).toBeUndefined()
  })

  it('does not bump when the update changes nothing', () => {
    const before = useSoundsStore.getState().assets
    useSoundsStore.getState().updateAsset('a1', { name: 'Coin' })
    expect(revisionOf('a1')).toBeUndefined()
    expect(useSoundsStore.getState().assets).toBe(before)
  })

  it('ignores an unknown id', () => {
    const before = useSoundsStore.getState().assets
    useSoundsStore.getState().updateAsset('nope', { name: 'x' })
    expect(useSoundsStore.getState().assets).toBe(before)
  })
})

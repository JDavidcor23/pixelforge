import { describe, expect, it } from 'vitest'

import type { AudioAsset } from '@/types/audio'
import { dropListedSounds } from './drop-listed-sounds'

const sound = (id: string, extra: Partial<AudioAsset> = {}): AudioAsset => ({
  id,
  name: id,
  tags: [],
  duration: 0,
  format: 'audio/wav',
  fileSize: 0,
  associatedSpriteIds: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  ...extra,
})

describe('dropListedSounds', () => {
  it('removes sounds marked as listed from a bucket and keeps session ones', () => {
    const session = sound('s')
    const out = dropListedSounds([session, sound('l', { fromBucketListing: true })])
    expect(out).toEqual([session])
  })

  it('returns the same array reference when nothing was listed', () => {
    const assets = [sound('a')]
    expect(dropListedSounds(assets)).toBe(assets)
  })
})

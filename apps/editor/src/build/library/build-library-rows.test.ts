import { describe, expect, it } from 'vitest'

import { buildLibraryRows } from './build-library-rows'
import { ASSET_DEEP_LINK_PARAM, EDITOR_ROUTES } from '@/constants/routes'
import { BUILD_SCREEN_COPY } from '@/constants/build-screen'
import type { AIGeneration } from '@/types'
import type { AudioAsset } from '@/types/audio'

const sprite = (id: string, prompt: string, kind?: AIGeneration['kind']): AIGeneration => ({
  id,
  prompt,
  base64: 'data:image/png;base64,AAAA',
  timestamp: 1,
  width: 16,
  height: 16,
  kind,
})

const sound = (id: string, name: string): AudioAsset => ({
  id,
  name,
  tags: [],
  duration: 1,
  format: 'wav',
  fileSize: 1,
  associatedSpriteIds: [],
  createdAt: '2026-01-01T00:00:00.000Z',
})

describe('buildLibraryRows', () => {
  it('lists sprites first, then sounds, each in store order', () => {
    const rows = buildLibraryRows([sprite('s1', 'Hero'), sprite('s2', 'Tree')], [sound('a1', 'Jump'), sound('a2', 'Coin')])
    expect(rows.map((row) => [row.kind, row.id])).toEqual([
      ['sprite', 's1'],
      ['sprite', 's2'],
      ['sound', 'a1'],
      ['sound', 'a2'],
    ])
  })

  it('builds the deep-link href with the param constant and an encoded id', () => {
    const [spriteRow, soundRow] = buildLibraryRows([sprite('a b/1', 'Hero')], [sound('x&y', 'Jump')])
    expect(spriteRow.href).toBe(`${EDITOR_ROUTES.SPRITES}?${ASSET_DEEP_LINK_PARAM}=a%20b%2F1`)
    expect(soundRow.href).toBe(`${EDITOR_ROUTES.SOUNDS}?${ASSET_DEEP_LINK_PARAM}=x%26y`)
  })

  it('uses the sprite prompt and the sound name, with a fallback for empty names', () => {
    const rows = buildLibraryRows([sprite('s1', 'Hero'), sprite('s2', '  ')], [sound('a1', 'Jump'), sound('a2', '')])
    expect(rows.map((row) => row.name)).toEqual([
      'Hero',
      BUILD_SCREEN_COPY.LIBRARY_UNNAMED,
      'Jump',
      BUILD_SCREEN_COPY.LIBRARY_UNNAMED,
    ])
  })

  it('includes drawings as sprites and returns nothing for empty stores', () => {
    expect(buildLibraryRows([sprite('d1', 'Doodle', 'drawing')], []).map((row) => row.kind)).toEqual(['sprite'])
    expect(buildLibraryRows([], [])).toEqual([])
  })
})

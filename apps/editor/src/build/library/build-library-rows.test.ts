import { describe, expect, it } from 'vitest'

import { toLibraryRow } from './build-library-rows'
import { ASSET_DEEP_LINK_PARAM, EDITOR_ROUTES } from '@/constants/routes'
import { BUILD_SCREEN_COPY } from '@/constants/build-screen'
import type { CatalogAssetKind, CatalogEntry } from '@/types/asset-catalog.types'

const entry = (id: string, kind: CatalogAssetKind, name: string): CatalogEntry => ({
  id,
  kind,
  name,
  revision: 0,
  levelId: undefined,
  chatTurnId: undefined,
  storage:
    kind === 'sprite'
      ? { type: 'sprite-library', assetId: id }
      : { type: 'sound-source', supabaseUrl: undefined, localObjectUrl: undefined },
})

describe('toLibraryRow', () => {
  it('builds the deep-link href with the param constant and an encoded id', () => {
    expect(toLibraryRow(entry('a b/1', 'sprite', 'Hero')).href).toBe(
      `${EDITOR_ROUTES.SPRITES}?${ASSET_DEEP_LINK_PARAM}=a%20b%2F1`,
    )
    expect(toLibraryRow(entry('x&y', 'sound', 'Jump')).href).toBe(
      `${EDITOR_ROUTES.SOUNDS}?${ASSET_DEEP_LINK_PARAM}=x%26y`,
    )
  })

  it('derives the kind label and edit aria label', () => {
    const sprite = toLibraryRow(entry('s1', 'sprite', 'Hero'))
    const sound = toLibraryRow(entry('a1', 'sound', 'Jump'))
    expect(sprite.kindLabel).toBe(BUILD_SCREEN_COPY.LIBRARY_KIND_SPRITE)
    expect(sound.kindLabel).toBe(BUILD_SCREEN_COPY.LIBRARY_KIND_SOUND)
    expect(sprite.editAriaLabel).toBe(`${BUILD_SCREEN_COPY.LIBRARY_EDIT_ARIA_PREFIX} Hero`)
  })

  it('keeps id, kind and name from the entry', () => {
    expect(toLibraryRow(entry('s1', 'sprite', 'Hero'))).toMatchObject({ id: 's1', kind: 'sprite', name: 'Hero' })
  })
})

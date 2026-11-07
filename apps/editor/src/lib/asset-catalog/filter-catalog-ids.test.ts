import { describe, expect, it } from 'vitest'

import { filterCatalogIds } from './filter-catalog-ids'
import { LIBRARY_FILTERS } from '@/constants/build-screen'
import type { AssetCatalog, CatalogAssetKind, CatalogEntry } from '@/types/asset-catalog.types'

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

const catalog = (entries: CatalogEntry[]): AssetCatalog => ({
  byId: Object.fromEntries(entries.map((item) => [item.id, item])),
  allIds: entries.map((item) => item.id),
})

const CATALOG = catalog([
  entry('s1', 'sprite', 'Hero Knight'),
  entry('a1', 'sound', 'Jump'),
  entry('s2', 'sprite', 'Green Tree'),
  entry('a2', 'sound', 'Hero Theme'),
])

describe('filterCatalogIds', () => {
  it('returns every id in catalog order for an empty query and the all filter', () => {
    expect(filterCatalogIds(CATALOG, '', LIBRARY_FILTERS.ALL)).toEqual(['s1', 'a1', 's2', 'a2'])
  })

  it('matches by name, case-insensitive and trimmed', () => {
    expect(filterCatalogIds(CATALOG, '  hERO ', LIBRARY_FILTERS.ALL)).toEqual(['s1', 'a2'])
  })

  it('treats a whitespace-only query as empty', () => {
    expect(filterCatalogIds(CATALOG, '   ', LIBRARY_FILTERS.ALL)).toEqual(['s1', 'a1', 's2', 'a2'])
  })

  it('filters sprites and audio by kind', () => {
    expect(filterCatalogIds(CATALOG, '', LIBRARY_FILTERS.SPRITES)).toEqual(['s1', 's2'])
    expect(filterCatalogIds(CATALOG, '', LIBRARY_FILTERS.AUDIO)).toEqual(['a1', 'a2'])
  })

  it('combines query and kind', () => {
    expect(filterCatalogIds(CATALOG, 'hero', LIBRARY_FILTERS.AUDIO)).toEqual(['a2'])
  })

  it('returns nothing for kinds the catalog does not hold (music, video)', () => {
    expect(filterCatalogIds(CATALOG, '', LIBRARY_FILTERS.MUSIC)).toEqual([])
    expect(filterCatalogIds(CATALOG, '', LIBRARY_FILTERS.VIDEO)).toEqual([])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterCatalogIds(CATALOG, 'zzz', LIBRARY_FILTERS.ALL)).toEqual([])
  })
})

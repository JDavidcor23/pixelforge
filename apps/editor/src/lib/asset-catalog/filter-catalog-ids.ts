import { LIBRARY_FILTERS } from '@/constants/build-screen'
import type { LibraryFilter } from '@/build/types'
import type { AssetCatalog, CatalogAssetKind } from '@/types/asset-catalog.types'

/** `null` = every kind; `'none'` = a filter whose kind the catalog does not hold yet (music, video). */
type FilterKind = CatalogAssetKind | null | 'none'

const FILTER_KIND: Readonly<Record<LibraryFilter, FilterKind>> = {
  [LIBRARY_FILTERS.ALL]: null,
  [LIBRARY_FILTERS.SPRITES]: 'sprite',
  [LIBRARY_FILTERS.AUDIO]: 'sound',
  [LIBRARY_FILTERS.MUSIC]: 'none',
  [LIBRARY_FILTERS.VIDEO]: 'none',
}

/** Ids of the entries matching the name query (case-insensitive, trimmed) and the kind filter, in catalog order. */
export function filterCatalogIds(
  catalog: AssetCatalog,
  query: string,
  filter: LibraryFilter,
): string[] {
  const kind = FILTER_KIND[filter]
  if (kind === 'none') return []
  const needle = query.trim().toLowerCase()

  return catalog.allIds.filter((id) => {
    const entry = catalog.byId[id]
    if (!entry) return false
    if (kind !== null && entry.kind !== kind) return false
    return needle === '' || entry.name.toLowerCase().includes(needle)
  })
}

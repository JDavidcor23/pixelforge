import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { filterCatalogIds } from '@/lib/asset-catalog/filter-catalog-ids'
import { useAssetCatalogStore } from '@/stores/asset-catalog.store'
import { LIBRARY_ACTIVE_FILTER } from '@/constants/build-screen'
import type { LibraryFilter, LibraryTabState } from '@/build/types'

export function useLibraryTab(): LibraryTabState {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<LibraryFilter>(LIBRARY_ACTIVE_FILTER)

  // The selector runs on every catalog change but returns a shallow-equal id
  // list, so the list re-renders only when the visible ids change; each row
  // reads its own entry by id.
  const visibleIds = useAssetCatalogStore(
    useShallow((catalog) => filterCatalogIds(catalog, query, filter)),
  )

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)

  return {
    query,
    filter,
    visibleIds,
    handleQueryChange,
    selectFilter: setFilter,
  }
}

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { toLibraryRow } from '@/build/library/build-library-rows'
import { selectCatalogEntry, useAssetCatalogStore } from '@/stores/asset-catalog.store'
import type { LibraryRow, LibraryRowState } from '@/build/types'

/** Reads one catalog entry by id; only this row re-renders when that entry changes. */
export function useLibraryRow(id: string): LibraryRowState {
  const navigate = useNavigate()
  const entry = useAssetCatalogStore(selectCatalogEntry(id))
  const row = useMemo<LibraryRow | null>(() => (entry ? toLibraryRow(entry) : null), [entry])

  const handleEdit = () => {
    if (row) navigate(row.href)
  }

  return { row, handleEdit }
}

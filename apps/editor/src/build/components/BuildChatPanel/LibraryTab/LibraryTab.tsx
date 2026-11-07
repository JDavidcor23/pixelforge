import { LayoutGrid, Search } from 'lucide-react'

import { BuildEmptyState } from '../../BuildEmptyState/BuildEmptyState'
import { LibraryRow } from './LibraryRow/LibraryRow'
import { useLibraryTab } from './useLibraryTab.hook'
import {
  BUILD_SCREEN_COPY,
  LIBRARY_ACTIVE_FILTER,
  LIBRARY_FILTER_ITEMS,
} from '@/constants/build-screen'

const CHIP = 'flex items-center rounded-full px-2.5 py-1 text-2xs'
const CHIP_ACTIVE = `${CHIP} bg-accent text-on-accent`
const CHIP_INACTIVE = `${CHIP} bg-hover text-muted`

/** Search and filter chips stay static (phase 4 wires the catalog); the list reads the sprite and sound stores. */
export function LibraryTab() {
  const { rows, hasRows } = useLibraryTab()

  return (
    <div role="tabpanel" className="flex min-h-0 flex-1 flex-col">
      <div className="p-3">
        <div className="flex h-8 items-center gap-2 rounded-lg bg-hover px-2.5">
          <Search className="size-3.5 text-subtle" aria-hidden />
          <input
            type="search"
            disabled
            placeholder={BUILD_SCREEN_COPY.LIBRARY_SEARCH_PLACEHOLDER}
            aria-label={BUILD_SCREEN_COPY.LIBRARY_SEARCH_PLACEHOLDER}
            className="w-full bg-transparent text-xs text-ink outline-none placeholder:text-subtle disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <ul className="flex gap-2 px-3 pb-3">
        {LIBRARY_FILTER_ITEMS.map((filter) => (
          <li
            key={filter.id}
            className={filter.id === LIBRARY_ACTIVE_FILTER ? CHIP_ACTIVE : CHIP_INACTIVE}
          >
            {filter.label}
          </li>
        ))}
      </ul>

      {hasRows ? (
        <ul
          aria-label={BUILD_SCREEN_COPY.LIBRARY_LIST_LABEL}
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-3"
        >
          {rows.map((row) => (
            <LibraryRow key={`${row.kind}-${row.id}`} row={row} />
          ))}
        </ul>
      ) : (
        <BuildEmptyState
          icon={LayoutGrid}
          title={BUILD_SCREEN_COPY.LIBRARY_EMPTY_TITLE}
          hint={BUILD_SCREEN_COPY.LIBRARY_EMPTY_HINT}
        />
      )}
    </div>
  )
}

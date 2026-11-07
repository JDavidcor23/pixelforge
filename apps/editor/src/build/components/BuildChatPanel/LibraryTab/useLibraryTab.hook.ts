import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { buildLibraryRows } from '@/build/library/build-library-rows'
import { useAssetsStore } from '@/stores/assets.store'
import { useSoundsStore } from '@/stores/sounds.store'
import { BUILD_SCREEN_COPY } from '@/constants/build-screen'
import type { LibraryListRow } from '@/build/types'

export function useLibraryTab() {
  const navigate = useNavigate()
  const generations = useAssetsStore((state) => state.generations)
  const sounds = useSoundsStore((state) => state.assets)

  const open = useCallback((href: string) => navigate(href), [navigate])

  const rows = useMemo<LibraryListRow[]>(
    () =>
      buildLibraryRows(generations, sounds).map((row) => ({
        ...row,
        kindLabel:
          row.kind === 'sprite' ? BUILD_SCREEN_COPY.LIBRARY_KIND_SPRITE : BUILD_SCREEN_COPY.LIBRARY_KIND_SOUND,
        editAriaLabel: `${BUILD_SCREEN_COPY.LIBRARY_EDIT_ARIA_PREFIX} ${row.name}`,
        edit: () => open(row.href),
      })),
    [generations, sounds, open],
  )

  return { rows, hasRows: rows.length > 0 }
}

import { useCallback } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'

export function useLibrarySearch() {
  const searchQuery = useSoundsStore((state) => state.searchQuery)
  const setSearchQuery = useSoundsStore((state) => state.setSearchQuery)

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(event.target.value),
    [setSearchQuery]
  )

  return { searchQuery, handleChange }
}

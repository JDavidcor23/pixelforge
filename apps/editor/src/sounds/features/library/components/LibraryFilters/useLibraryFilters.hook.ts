import { useSoundsStore } from '@/stores/sounds.store'
import { LIBRARY_FILTERS } from '@/constants/sound-library'

export function useLibraryFilters() {
  const filterTag = useSoundsStore((state) => state.filterTag)
  const setFilterTag = useSoundsStore((state) => state.setFilterTag)

  const filters = LIBRARY_FILTERS.map((filter) => ({
    ...filter,
    isSelected: filter.value === filterTag,
    onSelect: () => setFilterTag(filter.value),
  }))

  return { filters }
}

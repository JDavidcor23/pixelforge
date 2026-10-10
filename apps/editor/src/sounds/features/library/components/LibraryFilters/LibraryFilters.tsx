import { useLibraryFilters } from './useLibraryFilters.hook'
import { FOCUS_RING } from '@/constants/focus-ring'

export function LibraryFilters() {
  const { filters } = useLibraryFilters()

  return (
    <div role="group" aria-label="Filter sounds by kind" className="flex gap-1">
      {filters.map((filter) => (
        <button
          key={filter.label}
          type="button"
          aria-pressed={filter.isSelected}
          onClick={filter.onSelect}
          className={`rounded px-2.5 py-1.25 text-xs font-medium text-subtle hover:text-muted aria-pressed:bg-hover aria-pressed:text-ink ${FOCUS_RING.SURFACE}`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}

import { Search } from 'lucide-react'

import { useLibrarySearch } from './useLibrarySearch.hook'

export function LibrarySearch() {
  const { searchQuery, handleChange } = useLibrarySearch()

  return (
    <div className="flex h-8.5 items-center gap-2 rounded border border-line bg-base px-2.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
      <Search className="size-3.25 shrink-0 text-subtle" aria-hidden />
      <input
        type="search"
        value={searchQuery}
        onChange={handleChange}
        placeholder="Search sounds"
        aria-label="Search sounds"
        className="w-full bg-transparent text-xs text-ink outline-none placeholder:text-subtle"
      />
    </div>
  )
}

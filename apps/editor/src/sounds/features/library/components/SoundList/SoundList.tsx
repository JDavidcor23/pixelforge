import { LibraryEmptyState } from '../LibraryEmptyState/LibraryEmptyState'
import { PendingSoundRow } from '../PendingSoundRow/PendingSoundRow'
import { SoundListItem } from '../SoundListItem/SoundListItem'
import { useSoundList } from './useSoundList.hook'

export function SoundList() {
  const {
    listRef,
    items,
    pendingGenerations,
    listState,
    searchQuery,
    filterLabel,
    handleSelect,
    handleKeyDown,
    handleClearSearch,
    handleOpenNewSound,
  } = useSoundList()

  if (listState !== 'list') {
    return (
      <LibraryEmptyState
        variant={listState}
        query={searchQuery.trim()}
        filterLabel={filterLabel}
        onClearSearch={handleClearSearch}
        onNewSound={handleOpenNewSound}
      />
    )
  }

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label="Sounds"
      onKeyDown={handleKeyDown}
      className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-1"
    >
      {pendingGenerations.map((generation) => (
        <PendingSoundRow key={generation.id} prompt={generation.prompt} />
      ))}
      {items.map((item) => (
        <SoundListItem
          key={item.asset.id}
          asset={item.asset}
          isSelected={item.isSelected}
          isAI={item.isAI}
          tabIndex={item.tabIndex}
          onSelect={handleSelect}
        />
      ))}
    </div>
  )
}

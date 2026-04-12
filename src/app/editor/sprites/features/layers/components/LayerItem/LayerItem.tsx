import { Edit2, ArrowUp, ArrowDown, GripVertical, MoreVertical, Trash2 } from 'lucide-react'
import { useLayerItem } from './useLayerItem.hook'

interface LayerItemProps {
  readonly id: string
  readonly index: number
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly name: string
  readonly visible: boolean
  readonly locked: boolean
  readonly isActive: boolean
  readonly onToggleVisibility: (id: string) => void
  readonly onToggleLock: (id: string) => void
  readonly onSelect: (id: string) => void
  readonly onRename: (id: string, name: string) => void
  readonly onReorder: (from: number, to: number) => void
  readonly onRemove: (id: string) => void
  readonly canDelete: boolean
}

export const LayerItem = ({
  id,
  index,
  isFirst,
  isLast,
  name,
  visible,
  locked,
  isActive,
  onToggleVisibility,
  onToggleLock,
  onSelect,
  onRename,
  onReorder,
  onRemove,
  canDelete,
}: LayerItemProps) => {
  const {
    isEditing,
    newName,
    setNewName,
    isMenuOpen,
    setIsMenuOpen,
    isDragging,
    menuRef,
    inputRef,
    VisibilityIcon,
    LockIcon,
    handleRename,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    toggleMenu,
    startEditing,
    setIsEditing,
  } = useLayerItem({
    id,
    index,
    name,
    visible,
    locked,
    onRename,
    onReorder,
  })

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={!isEditing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => onSelect(id)}
      onKeyDown={(e) => {
        if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSelect(id)
        }
      }}
      className={`relative flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-all outline-none ${
        isActive
          ? 'border-l-2 border-[#00f5ff] bg-white/10 text-foreground'
          : 'border-l-2 border-transparent text-[#8888aa] hover:bg-white/5'
      } ${isDragging ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="cursor-grab text-[#444455] active:cursor-grabbing hover:text-[#8888aa]">
          <GripVertical size={14} />
        </div>
        
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') {
                setNewName(name)
                setIsEditing(false)
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-white/10 px-1 py-0.5 text-sm text-foreground outline-none ring-1 ring-[#00f5ff]/50 focus:ring-[#00f5ff]"
          />
        ) : (
          <span className="truncate">{name}</span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleVisibility(id)
          }}
          className="rounded p-1 text-[#8888aa] transition-colors hover:text-foreground hover:bg-white/10"
          title={visible ? 'Hide layer' : 'Show layer'}
        >
          <VisibilityIcon size={14} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleLock(id)
          }}
          className="rounded p-1 text-[#8888aa] transition-colors hover:text-foreground hover:bg-white/10"
          title={locked ? 'Unlock layer' : 'Lock layer'}
        >
          <LockIcon size={14} />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={toggleMenu}
            className={`rounded p-1 transition-colors hover:text-foreground hover:bg-white/10 ${
              isMenuOpen ? 'text-foreground bg-white/10' : 'text-[#8888aa]'
            }`}
          >
            <MoreVertical size={14} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-md border border-white/10 bg-[#1a1d23] py-1 shadow-xl ring-1 ring-black ring-opacity-10 backdrop-blur-md">
              <button
                type="button"
                onClick={startEditing}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[#ededed] hover:bg-white/5 transition-colors"
              >
                <Edit2 size={12} />
                Rename
              </button>
              
              <div className="my-1 border-t border-white/5" />
              
              <button
                type="button"
                disabled={isFirst}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isFirst) onReorder(index, index - 1)
                  setIsMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[#ededed] hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ArrowUp size={12} />
                Move Up
              </button>
              
              <button
                type="button"
                disabled={isLast}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isLast) onReorder(index, index + 1)
                  setIsMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[#ededed] hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ArrowDown size={12} />
                Move Down
              </button>

              <div className="my-1 border-t border-white/5" />
              
              <button
                type="button"
                disabled={!canDelete}
                onClick={(e) => {
                  e.stopPropagation()
                  if (canDelete) onRemove(id)
                  setIsMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[#ff4d4d] hover:bg-red-500/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <Trash2 size={12} />
                Delete Layer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { Edit2, ArrowUp, ArrowDown, GripVertical, MoreVertical, Trash2 } from 'lucide-react'
import { useLayerItem } from './useLayerItem.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

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
      className={`relative flex h-8 w-full shrink-0 cursor-pointer items-center justify-between gap-2 rounded px-2 text-left text-xs outline-none ${MOTION.COLORS} ${
        isActive ? 'bg-accent/10 text-ink' : 'text-muted hover:bg-hover'
      } ${isDragging ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div
          className={`cursor-grab active:cursor-grabbing ${
            isActive ? 'text-accent' : 'text-subtle hover:text-muted'
          }`}
        >
          <GripVertical size={14} aria-hidden />
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
            className={`w-full rounded bg-hover px-1 py-0.5 text-xs text-ink outline-none ring-1 ring-accent/50 focus:ring-accent ${FOCUS_RING.INPUT}`}
          />
        ) : (
          <span className="truncate" title={name}>
            {name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleVisibility(id)
          }}
          className={`rounded p-1 text-muted hover:bg-hover hover:text-ink ${MOTION.COLORS}`}
          title={visible ? 'Hide layer' : 'Show layer'}
        >
          <VisibilityIcon size={14} aria-hidden />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleLock(id)
          }}
          className={`rounded p-1 text-muted hover:bg-hover hover:text-ink ${MOTION.COLORS}`}
          title={locked ? 'Unlock layer' : 'Lock layer'}
        >
          <LockIcon size={14} aria-hidden />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={toggleMenu}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            className={`rounded p-1 hover:bg-hover hover:text-ink ${MOTION.COLORS} ${
              isMenuOpen ? 'bg-hover text-ink' : 'text-muted'
            }`}
          >
            <MoreVertical size={14} aria-hidden />
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              className={`absolute right-0 top-full z-50 mt-1 w-40 rounded border border-line-strong bg-raised py-1 shadow-popover ${MOTION.POPOVER_ENTER}`}
            >
              <button
                type="button"
                role="menuitem"
                onClick={startEditing}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-ink hover:bg-hover ${MOTION.COLORS}`}
              >
                <Edit2 size={12} aria-hidden />
                Rename
              </button>

              <div className="my-1 border-t border-line" />

              <button
                type="button"
                role="menuitem"
                disabled={isFirst}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isFirst) onReorder(index, index - 1)
                  setIsMenuOpen(false)
                }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-ink hover:bg-hover disabled:hover:bg-transparent ${MOTION.COLORS} disabled:pointer-events-none disabled:opacity-30`}
              >
                <ArrowUp size={12} aria-hidden />
                Move Up
              </button>

              <button
                type="button"
                role="menuitem"
                disabled={isLast}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isLast) onReorder(index, index + 1)
                  setIsMenuOpen(false)
                }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-ink hover:bg-hover disabled:hover:bg-transparent ${MOTION.COLORS} disabled:pointer-events-none disabled:opacity-30`}
              >
                <ArrowDown size={12} aria-hidden />
                Move Down
              </button>

              <div className="my-1 border-t border-line" />

              <button
                type="button"
                role="menuitem"
                disabled={!canDelete}
                onClick={(e) => {
                  e.stopPropagation()
                  if (canDelete) onRemove(id)
                  setIsMenuOpen(false)
                }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-danger hover:bg-danger/10 disabled:hover:bg-transparent ${MOTION.COLORS} disabled:pointer-events-none disabled:opacity-30`}
              >
                <Trash2 size={12} aria-hidden />
                Delete Layer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

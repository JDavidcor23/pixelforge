import { Eye, EyeOff, Lock, Unlock } from 'lucide-react'

interface LayerItemProps {
  readonly id: string
  readonly name: string
  readonly visible: boolean
  readonly locked: boolean
  readonly isActive: boolean
  readonly onToggleVisibility: (id: string) => void
  readonly onToggleLock: (id: string) => void
  readonly onSelect: (id: string) => void
}

export const LayerItem = ({
  id,
  name,
  visible,
  locked,
  isActive,
  onToggleVisibility,
  onToggleLock,
  onSelect,
}: LayerItemProps) => {
  const VisibilityIcon = visible ? Eye : EyeOff
  const LockIcon = locked ? Lock : Unlock

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(id)
        }
      }}
      className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors outline-none ${
        isActive
          ? 'border-l-2 border-accent bg-active-bg text-foreground'
          : 'border-l-2 border-transparent text-muted hover:bg-active-bg/50'
      }`}
    >
      <span className="truncate">{name}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleVisibility(id)
          }}
          className="rounded p-1 text-muted transition-colors hover:text-foreground"
        >
          <VisibilityIcon size={14} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleLock(id)
          }}
          className="rounded p-1 text-muted transition-colors hover:text-foreground"
        >
          <LockIcon size={14} />
        </button>
      </div>
    </div>
  )
}


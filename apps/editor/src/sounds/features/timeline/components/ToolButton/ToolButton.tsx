import type { LucideIcon } from 'lucide-react'

import { KeyChip } from '../KeyChip/KeyChip'
import { DISABLED_STATE, FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

interface ToolButtonProps {
  icon: LucideIcon
  label: string
  keyLabel: string
  keyShortcuts: string
  /** Toggles (Snap) pass a boolean; commands leave it undefined. */
  pressed?: boolean
  disabled?: boolean
  onClick: () => void
}

export function ToolButton({
  icon: Icon,
  label,
  keyLabel,
  keyShortcuts,
  pressed,
  disabled = false,
  onClick,
}: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      aria-keyshortcuts={keyShortcuts}
      className={`group flex items-center gap-1.5 rounded border border-transparent px-2.5 py-1.5 text-ui text-ink hover:bg-hover aria-pressed:border-accent/25 aria-pressed:bg-hover ${MOTION.PRESS} ${FOCUS_RING.BASE} ${DISABLED_STATE}`}
    >
      <Icon
        className="size-3.5 text-muted group-hover:text-ink group-aria-pressed:text-accent"
        aria-hidden
      />
      {label}
      <KeyChip label={keyLabel} />
    </button>
  )
}

import { Pencil, Eraser, PaintBucket, Pipette, Move, SquareDashed } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { ToolDefinition } from '@/app/editor/types'

interface ToolButtonProps {
  readonly tool: ToolDefinition
  readonly isActive: boolean
  readonly onSelect: (tool: ToolDefinition) => void
}

const ICON_MAP: Record<string, LucideIcon> = {
  Pencil,
  Eraser,
  PaintBucket,
  Pipette,
  Move,
  SquareDashed,
}

export const ToolButton = ({ tool, isActive, onSelect }: ToolButtonProps) => {
  const IconComponent = ICON_MAP[tool.iconName]

  return (
    <button
      type="button"
      onClick={() => onSelect(tool)}
      title={`${tool.label} (${tool.shortcut})`}
      className={`relative rounded p-2 transition-colors ${
        isActive ? 'bg-accent/20 text-accent' : 'text-muted hover:text-ink'
      }`}
    >
      {IconComponent && <IconComponent size={18} />}
      <span className="absolute -bottom-1 right-0 font-mono text-[8px] text-subtle">
        {tool.shortcut}
      </span>
    </button>
  )
}

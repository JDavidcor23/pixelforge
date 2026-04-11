import { Pencil, Eraser, PaintBucket, Pipette } from 'lucide-react'
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
}

export const ToolButton = ({ tool, isActive, onSelect }: ToolButtonProps) => {
  const IconComponent = ICON_MAP[tool.iconName]

  return (
    <button
      type="button"
      onClick={() => onSelect(tool)}
      title={`${tool.label} (${tool.shortcut})`}
      className={`relative rounded-lg p-2 transition-colors ${
        isActive
          ? 'bg-[#00f5ff]/20 text-[#00f5ff]'
          : 'text-[#8888aa] hover:text-white'
      }`}
    >
      {IconComponent && <IconComponent size={18} />}
      <span className="absolute -bottom-1 right-0 text-[8px] text-[#8888aa]">
        {tool.shortcut}
      </span>
    </button>
  )
}


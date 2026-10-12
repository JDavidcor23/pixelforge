import { Pencil, Upload, WandSparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { CREATE_METHODS } from '@/constants'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import type { CreateMethod } from '@/types'

const ICON_MAP: Record<string, LucideIcon> = { Pencil, WandSparkles, Upload }

interface CreateMethodToggleProps {
  readonly value: CreateMethod
  readonly onChange: (value: CreateMethod) => void
}

export const CreateMethodToggle = ({ value, onChange }: CreateMethodToggleProps) => {
  return (
    <div
      role="tablist"
      aria-label="Creation method"
      className="flex h-8 gap-0.5 rounded border border-line p-0.5"
    >
      {CREATE_METHODS.map((method) => {
        const Icon = ICON_MAP[method.iconName]
        const isActive = method.id === value
        const iconColor = isActive ? (method.id === 'generate' ? 'text-ai-ink' : 'text-accent') : 'text-subtle'

        return (
          <button
            key={method.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(method.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded text-xs font-medium ${MOTION.COLORS} ${FOCUS_RING.INSET} ${
              isActive ? 'bg-hover text-ink' : 'text-subtle hover:text-muted'
            }`}
          >
            {Icon && <Icon size={13} className={iconColor} aria-hidden />}
            {method.label}
          </button>
        )
      })}
    </div>
  )
}

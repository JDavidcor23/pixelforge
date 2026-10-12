import { Box, Shirt, Sparkles, Sword, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { useAssetTypeSelector } from './useAssetTypeSelector.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import type { AssetType } from '@/types'

const ICON_MAP: Record<string, LucideIcon> = { User, Box, Sword, Shirt, Sparkles }

interface AssetTypeSelectorProps {
  readonly value: AssetType
  readonly onChange: (value: AssetType) => void
  /** Smaller chips, icon-first — used where the full-size selector would crowd the panel (Animate tab). */
  readonly compact?: boolean
}

export const AssetTypeSelector = ({ value, onChange, compact = false }: AssetTypeSelectorProps) => {
  const { options, registerRef, handleKeyDown } = useAssetTypeSelector({ onChange })

  return (
    <div role="radiogroup" aria-label="Asset type" className="flex flex-wrap gap-1.5">
      {options.map((option, index) => {
        const Icon = ICON_MAP[option.iconName]
        const isSelected = option.id === value

        return (
          <button
            key={option.id}
            ref={registerRef(option.id)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(option.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`flex items-center gap-1.5 rounded border font-medium ${MOTION.COLORS} ${FOCUS_RING.SURFACE} ${
              compact ? 'px-2 py-1 text-2xs' : 'px-2.5 py-1.5 text-xs'
            } ${
              isSelected
                ? 'border-accent bg-accent/10 text-ink'
                : 'border-line-strong text-muted hover:text-ink'
            }`}
          >
            {Icon && (
              <Icon size={compact ? 11 : 13} className={isSelected ? 'text-accent' : 'text-subtle'} aria-hidden />
            )}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

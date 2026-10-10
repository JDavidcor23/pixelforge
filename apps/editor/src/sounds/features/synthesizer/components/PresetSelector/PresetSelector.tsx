'use client'

import { Zap, Bomb, ArrowUp, Coins, Sparkles } from 'lucide-react'
import type { PresetCategory } from '@/app/editor/types/audio'
import { usePresetSelector } from './usePresetSelector.hook'

const CATEGORY_ICONS: Record<PresetCategory, React.ComponentType<{ className?: string }>> = {
  laser: Zap,
  explosion: Bomb,
  jump: ArrowUp,
  coin: Coins,
  powerup: Sparkles,
}

export function PresetSelector() {
  const { presets, currentPresetId, handlePresetSelect } = usePresetSelector()

  return (
    <section className="flex flex-col gap-3 rounded-lg bg-gray-800 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
        Presets
      </h3>

      <div className="grid grid-cols-5 gap-2">
        {presets.map((preset) => {
          const Icon = CATEGORY_ICONS[preset.category]
          const isActive = currentPresetId === preset.id

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              aria-label={`Load preset: ${preset.name}`}
              aria-pressed={isActive}
              className={`flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 text-xs transition-colors ${
                isActive
                  ? 'border border-violet-500 bg-violet-600/20 text-violet-300'
                  : 'border border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600 hover:bg-gray-700'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{preset.name}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

'use client'

import { Music, Mic, Wand2 } from 'lucide-react'
import type { ElevenLabsMode } from '@/app/editor/types/audio'
import { useModelSelector } from './useModelSelector.hook'

interface ModelSelectorProps {
  selectedMode: ElevenLabsMode
  onModeChange: (mode: ElevenLabsMode) => void
}

const MODE_TABS: { mode: ElevenLabsMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'sfx', label: 'SFX', icon: <Wand2 className="h-4 w-4" /> },
  { mode: 'music', label: 'Music', icon: <Music className="h-4 w-4" /> },
  { mode: 'tts', label: 'TTS', icon: <Mic className="h-4 w-4" /> },
]

export function ModelSelector({ selectedMode, onModeChange }: ModelSelectorProps) {
  return (
    <div
      className="flex gap-1 rounded-lg bg-gray-800 p-1"
      role="tablist"
      aria-label="Generation mode selector"
    >
      {MODE_TABS.map(({ mode, label, icon }) => (
        <button
          key={mode}
          type="button"
          role="tab"
          aria-selected={selectedMode === mode}
          aria-label={`Select ${label} mode`}
          onClick={() => onModeChange(mode)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
            selectedMode === mode
              ? 'bg-violet-600 text-white'
              : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
          }`}
        >
          {icon}
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}

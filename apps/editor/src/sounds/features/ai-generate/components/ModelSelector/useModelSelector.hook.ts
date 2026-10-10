import { useCallback, useState } from 'react'
import type { ElevenLabsMode } from '@/types/audio'

export function useModelSelector(
  initialMode: ElevenLabsMode = 'sfx',
  onModeChange?: (mode: ElevenLabsMode) => void
) {
  const [selectedMode, setSelectedMode] = useState<ElevenLabsMode>(initialMode)

  const handleModeChange = useCallback(
    (mode: ElevenLabsMode) => {
      setSelectedMode(mode)
      onModeChange?.(mode)
    },
    [onModeChange]
  )

  return {
    selectedMode,
    handleModeChange,
  }
}

import { useCallback, useState } from 'react'

import { useTimelinePlayback } from '../../hooks/useTimelinePlayback.hook'
import { useTimelineShortcuts } from '../../hooks/useTimelineShortcuts.hook'

export function useTimelineEditor() {
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const playback = useTimelinePlayback()

  const handleOpenShortcuts = useCallback(() => setIsShortcutsOpen(true), [])
  const handleToggleShortcuts = useCallback(() => setIsShortcutsOpen((open) => !open), [])
  const handleCloseShortcuts = useCallback(() => setIsShortcutsOpen(false), [])

  useTimelineShortcuts({
    onTogglePlay: playback.handleTogglePlay,
    onShowShortcuts: handleOpenShortcuts,
  })

  return {
    playback,
    isShortcutsOpen,
    handleToggleShortcuts,
    handleCloseShortcuts,
  }
}

import { useState } from 'react'

export function useEditorLayout() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return {
    isSettingsOpen,
    openSettings: () => setIsSettingsOpen(true),
    closeSettings: () => setIsSettingsOpen(false),
  }
}

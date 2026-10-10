import { useLocation } from 'react-router-dom'

import { useEditorUIStore } from '@/stores/ui.store'
import { EDITOR_NAV_ITEMS } from '@/constants/routes'

export function useEditorLayout() {
  const { pathname } = useLocation()
  const isSettingsOpen = useEditorUIStore((state) => state.settingsOpen)
  const openSettings = useEditorUIStore((state) => state.openSettings)
  const closeSettings = useEditorUIStore((state) => state.closeSettings)

  const navItems = EDITOR_NAV_ITEMS.map((item) => ({
    ...item,
    isActive: pathname.startsWith(item.href),
  }))

  return {
    navItems,
    isSettingsOpen,
    openSettings,
    closeSettings,
  }
}

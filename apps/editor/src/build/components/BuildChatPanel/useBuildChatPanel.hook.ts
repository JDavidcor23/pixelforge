import { useState } from 'react'

import { BUILD_PANEL_TAB_ITEMS, BUILD_PANEL_TABS } from '@/constants/build-screen'
import type { BuildPanelTab } from '@/build/types'

/**
 * Tab state stays local to the panel: the game never pushes state into React,
 * so nothing here re-renders while the preview runs (ADR 0014, S7).
 */
export function useBuildChatPanel() {
  const [activeTab, setActiveTab] = useState<BuildPanelTab>(BUILD_PANEL_TABS.CHAT)

  const tabs = BUILD_PANEL_TAB_ITEMS.map((tab) => ({
    ...tab,
    isActive: tab.id === activeTab,
    select: () => setActiveTab(tab.id),
  }))

  return { tabs, isChatTab: activeTab === BUILD_PANEL_TABS.CHAT }
}

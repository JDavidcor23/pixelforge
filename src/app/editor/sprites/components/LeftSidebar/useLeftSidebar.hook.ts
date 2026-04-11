'use client'

import { useCallback } from 'react'

import type { LeftSidebarTab } from '@/app/editor/types'
import {
  useLeftSidebarTab,
  useSetLeftSidebarTab,
} from '../../hooks/useSpriteEditorStore.hook'

export const useLeftSidebar = () => {
  const activeTab = useLeftSidebarTab()
  const setLeftSidebarTab = useSetLeftSidebarTab()

  const handleTabChange = useCallback(
    (tab: LeftSidebarTab) => {
      setLeftSidebarTab(tab)
    },
    [setLeftSidebarTab]
  )

  return { activeTab, handleTabChange }
}


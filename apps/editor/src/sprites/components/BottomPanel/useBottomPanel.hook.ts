import { useCallback, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

import { BOTTOM_PANEL_TABS } from '@/constants'
import { useBottomPanelTab, useSetBottomPanelTab } from '@/sprites/hooks/useSpriteEditorStore.hook'
import type { BottomPanelTabId } from '@/types'

export const useBottomPanel = () => {
  const activeTab = useBottomPanelTab()
  const setActiveTab = useSetBottomPanelTab()

  const [search, setSearch] = useState('')
  const tabRefs = useRef<Partial<Record<BottomPanelTabId, HTMLButtonElement | null>>>({})

  const registerTabRef = useCallback(
    (id: BottomPanelTabId) => (el: HTMLButtonElement | null) => {
      tabRefs.current[id] = el
    },
    [],
  )

  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const isNext = event.key === 'ArrowRight'
      const isPrev = event.key === 'ArrowLeft'
      if (!isNext && !isPrev) return

      event.preventDefault()
      const nextIndex = isNext
        ? (index + 1) % BOTTOM_PANEL_TABS.length
        : (index - 1 + BOTTOM_PANEL_TABS.length) % BOTTOM_PANEL_TABS.length
      const nextTab = BOTTOM_PANEL_TABS[nextIndex].id
      setActiveTab(nextTab)
      tabRefs.current[nextTab]?.focus()
    },
    [setActiveTab],
  )

  const handleSearchChange = useCallback((value: string) => setSearch(value), [])

  return {
    tabs: BOTTOM_PANEL_TABS,
    activeTab,
    setActiveTab,
    registerTabRef,
    handleTabKeyDown,
    search,
    handleSearchChange,
  }
}

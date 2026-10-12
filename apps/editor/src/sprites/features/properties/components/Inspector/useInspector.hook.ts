import { useCallback, useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'

import { INSPECTOR_TABS } from '@/constants'
import { useFocusPromptRequest, useInspectorTab, useSetInspectorTab } from '@/sprites/hooks/useSpriteEditorStore.hook'
import type { InspectorTabId } from '@/types'

export const useInspector = () => {
  const activeTab = useInspectorTab()
  const setActiveTab = useSetInspectorTab()
  const focusPromptRequest = useFocusPromptRequest()

  const tabRefs = useRef<Partial<Record<InspectorTabId, HTMLButtonElement | null>>>({})
  const contentRef = useRef<HTMLDivElement>(null)
  const lastFocusPromptRequestRef = useRef(focusPromptRequest)

  // A tab panel is `hidden`, not unmounted, so its scroll position survives a
  // round trip to another tab. Switching INTO Create should always land on
  // step 1 — UNLESS the Assets tab's "New asset"/"Open Create" just bumped
  // `focusPromptRequest`, in which case GeneratePanel scrolls its own prompt
  // textarea into view and this effect must stay out of the way.
  useEffect(() => {
    const requestChanged = focusPromptRequest !== lastFocusPromptRequestRef.current
    lastFocusPromptRequestRef.current = focusPromptRequest
    if (requestChanged) return
    if (activeTab !== 'create') return
    contentRef.current?.scrollTo({ top: 0 })
  }, [activeTab, focusPromptRequest])

  const registerTabRef = useCallback(
    (id: InspectorTabId) => (el: HTMLButtonElement | null) => {
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
        ? (index + 1) % INSPECTOR_TABS.length
        : (index - 1 + INSPECTOR_TABS.length) % INSPECTOR_TABS.length
      const nextTab = INSPECTOR_TABS[nextIndex].id
      setActiveTab(nextTab)
      tabRefs.current[nextTab]?.focus()
    },
    [setActiveTab],
  )

  return {
    tabs: INSPECTOR_TABS,
    activeTab,
    setActiveTab,
    registerTabRef,
    handleTabKeyDown,
    contentRef,
  }
}

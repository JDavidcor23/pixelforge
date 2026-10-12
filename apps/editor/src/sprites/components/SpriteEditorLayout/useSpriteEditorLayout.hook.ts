import { useCallback, useEffect, useRef, useState } from 'react'

import {
  useBottomPanelHeight,
  useDocStatus,
  useLeftSidebarWidth,
  useRightSidebarWidth,
  useSetBottomPanelHeight,
  useSetLeftSidebarWidth,
  useSetRightSidebarWidth,
  useToggleLeftSidebar,
  useToggleRightSidebar,
  useToggleTimeline,
  useToggleToolbar,
  useUIState,
} from '../../hooks/useSpriteEditorStore.hook'
import { useDocumentPersistence } from '@/hooks/useDocumentPersistence.hook'
import { useAssetLibraryPersistence } from '@/hooks/useAssetLibraryPersistence.hook'
import { useAnimationJobRecovery } from '@/hooks/useAnimationJobRecovery.hook'
import { useServerAnimationSync } from '@/hooks/useServerAnimationSync.hook'
import { CANVAS_MIN_SIZE, RESIZABLE_PANELS, SPRITE_EDITOR_LAYOUT } from '@/constants'

/**
 * Shell layout orchestration (Sprite Studio v2, batch 2): rail/panel open
 * state plus their resizable pixel sizes, clamped so the canvas never drops
 * below `CANVAS_MIN_SIZE` regardless of how the other panels are sized.
 */
export const useSpriteEditorLayout = () => {
  const ui = useUIState()
  const toggleLeft = useToggleLeftSidebar()
  const toggleRight = useToggleRightSidebar()
  const toggleBottomPanel = useToggleTimeline()
  const toggleToolbar = useToggleToolbar()
  const docStatus = useDocStatus()
  const { isPersistent } = useDocumentPersistence()
  useAssetLibraryPersistence()
  useAnimationJobRecovery()
  useServerAnimationSync()

  const leftSidebarWidth = useLeftSidebarWidth()
  const rightSidebarWidth = useRightSidebarWidth()
  const bottomPanelHeight = useBottomPanelHeight()
  const setLeftSidebarWidth = useSetLeftSidebarWidth()
  const setRightSidebarWidth = useSetRightSidebarWidth()
  const setBottomPanelHeight = useSetBottomPanelHeight()

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      setContainerSize({
        width: Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height),
      })
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const leftWidthPx = ui.leftSidebarOpen ? leftSidebarWidth : 0
  const rightWidthPx = ui.rightSidebarOpen ? rightSidebarWidth : 0
  const bottomHeightPx = ui.timelineOpen ? bottomPanelHeight : 0

  // Each handle's own MAX from RESIZABLE_PANELS still applies — this only
  // tightens it further so growing one panel can't push the canvas under
  // CANVAS_MIN_SIZE. Recomputed against the OTHER panel's committed size, not
  // its live drag value, which is an intentional, conservative simplification.
  const leftMax = Math.max(
    RESIZABLE_PANELS.LEFT.MIN,
    Math.min(RESIZABLE_PANELS.LEFT.MAX, containerSize.width - rightWidthPx - CANVAS_MIN_SIZE.WIDTH),
  )
  const rightMax = Math.max(
    RESIZABLE_PANELS.RIGHT.MIN,
    Math.min(RESIZABLE_PANELS.RIGHT.MAX, containerSize.width - leftWidthPx - CANVAS_MIN_SIZE.WIDTH),
  )
  const bottomMax = Math.max(
    RESIZABLE_PANELS.BOTTOM.MIN,
    Math.min(
      RESIZABLE_PANELS.BOTTOM.MAX,
      containerSize.height - SPRITE_EDITOR_LAYOUT.TOP_BAR_HEIGHT - CANVAS_MIN_SIZE.HEIGHT,
    ),
  )

  const handleResizeStart = useCallback(() => setIsResizing(true), [])
  const handleResizeEnd = useCallback(() => setIsResizing(false), [])

  return {
    ui,
    toggleLeft,
    toggleRight,
    toggleBottomPanel,
    toggleToolbar,
    docStatus,
    isPersistent,
    containerRef,
    leftWidthPx,
    rightWidthPx,
    bottomHeightPx,
    leftSidebarWidth,
    rightSidebarWidth,
    bottomPanelHeight,
    leftMax,
    rightMax,
    bottomMax,
    setLeftSidebarWidth,
    setRightSidebarWidth,
    setBottomPanelHeight,
    isResizing,
    handleResizeStart,
    handleResizeEnd,
  }
}

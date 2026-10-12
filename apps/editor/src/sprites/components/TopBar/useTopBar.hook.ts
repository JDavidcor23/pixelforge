import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useExport } from '@/sprites/features/properties/hooks/useExport.hook'
import {
  useCanRedo,
  useCanUndo,
  useFrameCount,
  useRedo,
  useResetPanelSizes,
  useUIState,
  useUndo,
} from '@/sprites/hooks/useSpriteEditorStore.hook'
import { RESIZABLE_PANELS, SPRITE_DOCUMENT_DEFAULT_NAME } from '@/constants'

/**
 * TopBar shell logic — document name, frame count, undo/redo, layout reset
 * and the Export menu. The canvas-size popover and the save-status indicator
 * each own their own hook (`CanvasSizePopover/useCanvasSizePopover.hook.ts`,
 * `SaveIndicator/useSaveIndicator.hook.ts`) so this hook doesn't also carry
 * their open/pending state.
 */
export const useTopBar = () => {
  const ui = useUIState()
  const resetPanelSizes = useResetPanelSizes()
  const frameCount = useFrameCount()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const undo = useUndo()
  const redo = useRedo()
  const { handleExportFrame, handleExportSpriteSheet } = useExport()

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const exportTriggerRef = useRef<HTMLButtonElement>(null)

  const frameCountLabel = `${frameCount} ${frameCount === 1 ? 'FRAME' : 'FRAMES'}`

  // `returnFocus` is false for the outside-click/blur-equivalent paths (the
  // trigger isn't focused there anyway) and true for Escape, which should
  // hand focus straight back to the button that opened the menu.
  const closeExportMenu = useCallback((returnFocus = false) => {
    setIsExportMenuOpen(false)
    if (returnFocus) exportTriggerRef.current?.focus()
  }, [])
  const toggleExportMenu = useCallback(() => setIsExportMenuOpen((open) => !open), [])

  const handleExportFrameClick = useCallback(() => {
    handleExportFrame()
    closeExportMenu()
  }, [handleExportFrame, closeExportMenu])

  const handleExportSpriteSheetClick = useCallback(() => {
    handleExportSpriteSheet()
    closeExportMenu()
  }, [handleExportSpriteSheet, closeExportMenu])

  useEffect(() => {
    if (!isExportMenuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        closeExportMenu()
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeExportMenu(true)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isExportMenuOpen, closeExportMenu])

  // Enabled only when restoring defaults would actually change something —
  // otherwise it's a dead click the owner doesn't need to make.
  const isLayoutCustomized = useMemo(
    () =>
      !ui.leftSidebarOpen ||
      !ui.rightSidebarOpen ||
      !ui.timelineOpen ||
      ui.leftSidebarWidth !== RESIZABLE_PANELS.LEFT.DEFAULT ||
      ui.rightSidebarWidth !== RESIZABLE_PANELS.RIGHT.DEFAULT ||
      ui.bottomPanelHeight !== RESIZABLE_PANELS.BOTTOM.DEFAULT,
    [ui.leftSidebarOpen, ui.rightSidebarOpen, ui.timelineOpen, ui.leftSidebarWidth, ui.rightSidebarWidth, ui.bottomPanelHeight],
  )
  const handleResetLayout = useCallback(() => resetPanelSizes(), [resetPanelSizes])

  return {
    documentName: SPRITE_DOCUMENT_DEFAULT_NAME,
    frameCountLabel,
    canUndo,
    canRedo,
    undo,
    redo,
    isLayoutCustomized,
    handleResetLayout,
    isExportMenuOpen,
    exportMenuRef,
    exportTriggerRef,
    toggleExportMenu,
    handleExportFrameClick,
    handleExportSpriteSheetClick,
  }
}

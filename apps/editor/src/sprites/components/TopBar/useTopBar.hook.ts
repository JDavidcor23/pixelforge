import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useExport } from '@/sprites/features/properties/hooks/useExport.hook'
import { useImportSpriteSheet } from '@/sprites/hooks/useImportSpriteSheet.hook'
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
import {
  FILE_MENU_DISMISS_KEY,
  FILE_MENU_ENTRY_KIND,
  FILE_MENU_ITEM_IDS,
  FILE_MENU_LABELS,
} from '@/constants/file-menu'
import type { FileMenuActions, FileMenuEntry } from '@/types'

/** File menu rows, in menubar order. Every action closes the menu after it runs. */
export const buildFileMenuEntries = (actions: FileMenuActions): FileMenuEntry[] => {
  const runAndClose = (action: () => void) => () => {
    action()
    actions.closeMenu()
  }
  return [
    {
      kind: FILE_MENU_ENTRY_KIND.ITEM,
      id: FILE_MENU_ITEM_IDS.IMPORT_SPRITE_SHEET,
      label: FILE_MENU_LABELS.IMPORT_SPRITE_SHEET,
      onSelect: runAndClose(actions.openImportSpriteSheet),
    },
    { kind: FILE_MENU_ENTRY_KIND.SEPARATOR, id: FILE_MENU_ITEM_IDS.SEPARATOR_EXPORT },
    {
      kind: FILE_MENU_ENTRY_KIND.ITEM,
      id: FILE_MENU_ITEM_IDS.EXPORT_FRAME,
      label: FILE_MENU_LABELS.EXPORT_FRAME,
      onSelect: runAndClose(actions.exportFrame),
    },
    {
      kind: FILE_MENU_ENTRY_KIND.ITEM,
      id: FILE_MENU_ITEM_IDS.EXPORT_SPRITE_SHEET,
      label: FILE_MENU_LABELS.EXPORT_SPRITE_SHEET,
      onSelect: runAndClose(actions.exportSpriteSheet),
    },
  ]
}

export const isMenuDismissKey = (key: string): boolean => key === FILE_MENU_DISMISS_KEY

export const isOutsideMenu = (menu: Pick<Node, 'contains'> | null, target: Node | null): boolean =>
  menu !== null && !menu.contains(target)

/**
 * TopBar shell logic — document name, frame count, undo/redo, layout reset
 * and the File menu (import + export). The canvas-size popover and the save-status indicator
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

  const importSpriteSheet = useImportSpriteSheet()

  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false)
  const fileMenuRef = useRef<HTMLDivElement>(null)
  const fileTriggerRef = useRef<HTMLButtonElement>(null)

  const frameCountLabel = `${frameCount} ${frameCount === 1 ? 'FRAME' : 'FRAMES'}`

  // `returnFocus` is false for the outside-click/blur-equivalent paths (the
  // trigger isn't focused there anyway) and true for Escape, which should
  // hand focus straight back to the button that opened the menu.
  const closeFileMenu = useCallback((returnFocus = false) => {
    setIsFileMenuOpen(false)
    if (returnFocus) fileTriggerRef.current?.focus()
  }, [])
  const toggleFileMenu = useCallback(() => setIsFileMenuOpen((open) => !open), [])

  const { openFilePicker } = importSpriteSheet
  const fileMenuEntries = useMemo(
    () =>
      buildFileMenuEntries({
        openImportSpriteSheet: openFilePicker,
        exportFrame: handleExportFrame,
        exportSpriteSheet: handleExportSpriteSheet,
        closeMenu: () => closeFileMenu(),
      }),
    [openFilePicker, handleExportFrame, handleExportSpriteSheet, closeFileMenu],
  )

  useEffect(() => {
    if (!isFileMenuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (isOutsideMenu(fileMenuRef.current, event.target as Node)) closeFileMenu()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isMenuDismissKey(event.key)) closeFileMenu(true)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFileMenuOpen, closeFileMenu])

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
    isFileMenuOpen,
    fileMenuRef,
    fileTriggerRef,
    toggleFileMenu,
    fileMenuEntries,
    importFileInputRef: importSpriteSheet.fileInputRef,
    handleImportFileSelected: importSpriteSheet.handleFileSelected,
    importDialogProps: importSpriteSheet.dialogProps,
    importFileErrorProps: importSpriteSheet.fileErrorProps,
  }
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

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
import { useAssetsStore } from '@/stores/assets.store'
import { useSpriteEditorStore } from '@/stores'
import { layersToBase64 } from '@/lib'
import { DEFAULT_ASSET_TYPE, RESIZABLE_PANELS, SPRITE_DOCUMENT_DEFAULT_NAME } from '@/constants'
import {
  FILE_MENU_DISMISS_KEY,
  FILE_MENU_ENTRY_KIND,
  FILE_MENU_ITEM_IDS,
  FILE_MENU_LABELS,
  SAVE_AS_ERRORS,
} from '@/constants/file-menu'
import type { AssetType, FileMenuActions, FileMenuEntry, SaveAsDeps, SaveAsDialogProps, SaveAsRequest } from '@/types'

/** File menu rows, in menubar order. Every action closes the menu after it runs. */
export const buildFileMenuEntries = (actions: FileMenuActions): FileMenuEntry[] => {
  const runAndClose = (action: () => void) => () => {
    action()
    actions.closeMenu()
  }
  return [
    {
      kind: FILE_MENU_ENTRY_KIND.ITEM,
      id: FILE_MENU_ITEM_IDS.SAVE_AS,
      label: FILE_MENU_LABELS.SAVE_AS,
      onSelect: runAndClose(actions.openSaveAs),
    },
    { kind: FILE_MENU_ENTRY_KIND.SEPARATOR, id: FILE_MENU_ITEM_IDS.SEPARATOR_SAVE_AS },
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

/** First reason Save As can't confirm yet, or null when it's allowed. */
export const validateSaveAsName = (name: string): string | null =>
  name.trim() === '' ? SAVE_AS_ERRORS.NAME_REQUIRED : null

/**
 * File > Save As… (ADR 0010, Phase 1): snapshots whatever's on the canvas
 * right now and adds it to Assets as a new `kind: 'drawing'` item. Does NOT
 * touch the hidden autosave draft (S3) — `getCanvasState` is a one-off read,
 * never a subscription.
 */
export const runSaveAs = (request: SaveAsRequest, deps: SaveAsDeps): void => {
  const { canvasWidth, canvasHeight, layers } = deps.getCanvasState()
  const base64 = deps.exportCanvas(canvasWidth, canvasHeight, layers)
  deps.addDrawing({
    prompt: request.name.trim(),
    base64,
    width: canvasWidth,
    height: canvasHeight,
    assetType: request.assetType,
  })
}

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
  const addDrawing = useAssetsStore((state) => state.addDrawing)

  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false)
  const fileMenuRef = useRef<HTMLDivElement>(null)
  const fileTriggerRef = useRef<HTMLButtonElement>(null)

  // File > Save As… (ADR 0010, Phase 1). Modal mechanics live in
  // `SaveAsDialog/useSaveAsDialog.hook.ts`; this is just the open/name/type state.
  const [isSaveAsOpen, setIsSaveAsOpen] = useState(false)
  const [saveAsName, setSaveAsName] = useState('')
  const [saveAsAssetType, setSaveAsAssetType] = useState<AssetType>(DEFAULT_ASSET_TYPE)

  const handleOpenSaveAs = useCallback(() => {
    setSaveAsName('')
    setSaveAsAssetType(DEFAULT_ASSET_TYPE)
    setIsSaveAsOpen(true)
  }, [])
  const handleCancelSaveAs = useCallback(() => setIsSaveAsOpen(false), [])
  const handleSaveAsNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setSaveAsName(event.target.value),
    [],
  )
  const handleSaveAsAssetTypeChange = useCallback((assetType: AssetType) => setSaveAsAssetType(assetType), [])

  const saveAsErrorMessage = validateSaveAsName(saveAsName)
  const canSaveAs = saveAsErrorMessage === null

  const handleConfirmSaveAs = useCallback(() => {
    if (!canSaveAs) return
    runSaveAs(
      { name: saveAsName, assetType: saveAsAssetType },
      { getCanvasState: () => useSpriteEditorStore.getState(), exportCanvas: layersToBase64, addDrawing },
    )
    setIsSaveAsOpen(false)
  }, [canSaveAs, saveAsName, saveAsAssetType, addDrawing])

  const saveAsDialogProps = useMemo<SaveAsDialogProps | null>(
    () =>
      isSaveAsOpen
        ? {
            name: saveAsName,
            assetType: saveAsAssetType,
            errorMessage: saveAsErrorMessage,
            canSave: canSaveAs,
            onNameChange: handleSaveAsNameChange,
            onAssetTypeChange: handleSaveAsAssetTypeChange,
            onCancel: handleCancelSaveAs,
            onConfirm: handleConfirmSaveAs,
          }
        : null,
    [
      isSaveAsOpen,
      saveAsName,
      saveAsAssetType,
      saveAsErrorMessage,
      canSaveAs,
      handleSaveAsNameChange,
      handleSaveAsAssetTypeChange,
      handleCancelSaveAs,
      handleConfirmSaveAs,
    ],
  )

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
        openSaveAs: handleOpenSaveAs,
        openImportSpriteSheet: openFilePicker,
        exportFrame: handleExportFrame,
        exportSpriteSheet: handleExportSpriteSheet,
        closeMenu: () => closeFileMenu(),
      }),
    [handleOpenSaveAs, openFilePicker, handleExportFrame, handleExportSpriteSheet, closeFileMenu],
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
    saveAsDialogProps,
    importFileInputRef: importSpriteSheet.fileInputRef,
    handleImportFileSelected: importSpriteSheet.handleFileSelected,
    importDialogProps: importSpriteSheet.dialogProps,
    importFileErrorProps: importSpriteSheet.fileErrorProps,
  }
}

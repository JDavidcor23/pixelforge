'use client'

import { useEffect } from 'react'

import { SPRITE_EDITOR_KEYBOARD, SPRITE_EDITOR_CANVAS, SPRITE_EDITOR_VIEWPORT } from '@/app/editor/constants'
import {
  useSetActiveTool,
  useUndo,
  useRedo,
  useSetZoom,
  useViewport,
  useActiveTool,
  useSelection,
  useSetSelectionTransform,
  useSetViewportOffset,
  useCopySelection,
  useCutSelection,
  usePasteClipboard,
  useDeleteSelection,
   useToggleZenMode,
  useToggleOnionSkin,
} from './useSpriteEditorStore.hook'

const PAN_STEP = 20

export const useKeyboardShortcuts = () => {
  const setActiveTool = useSetActiveTool()
  const undo = useUndo()
  const redo = useRedo()
  const setZoom = useSetZoom()
  const viewport = useViewport()
  const activeTool = useActiveTool()
  const selection = useSelection()
  const setSelectionTransform = useSetSelectionTransform()
  const setViewportOffset = useSetViewportOffset()
  const copySelection = useCopySelection()
  const cutSelection = useCutSelection()
  const pasteClipboard = usePasteClipboard()
  const deleteSelection = useDeleteSelection()
  const toggleZenMode = useToggleZenMode()
  const toggleOnionSkin = useToggleOnionSkin()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcuts if the user is typing in an input field
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const key = e.key.toLowerCase()
      const isCtrl = e.ctrlKey || e.metaKey
      const isShift = e.shiftKey

      if (key === 'tab') {
        e.preventDefault()
        toggleZenMode()
        return
      }

      if (isCtrl && isShift && key === 'z') {
        e.preventDefault()
        redo()
        return
      }

      if (isCtrl && key === 'z') {
        e.preventDefault()
        undo()
        return
      }

      if (isCtrl && key === '=') {
        e.preventDefault()
        const newZoom = Math.min(SPRITE_EDITOR_CANVAS.MAX_ZOOM, viewport.zoom + SPRITE_EDITOR_VIEWPORT.ZOOM_STEP)
        setZoom(newZoom)
        return
      }

      if (isCtrl && key === '-') {
        e.preventDefault()
        const newZoom = Math.max(SPRITE_EDITOR_CANVAS.MIN_ZOOM, viewport.zoom - SPRITE_EDITOR_VIEWPORT.ZOOM_STEP)
        setZoom(newZoom)
        return
      }

      if (isCtrl && key === 'c') {
        e.preventDefault()
        copySelection()
        return
      }

      if (isCtrl && key === 'x') {
        e.preventDefault()
        cutSelection()
        return
      }

      if (isCtrl && key === 'v') {
        e.preventDefault()
        pasteClipboard()
        return
      }

      if (isCtrl || isShift) return

      // Handle Delete / Backspace
      if (key === 'delete' || key === 'backspace') {
        e.preventDefault()
        deleteSelection()
        return
      }

      // Handle Arrow Keys
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault()

        // 1. Nudge Selection if transforming
        if (activeTool === 'transform' && selection && selection.floatingPixels) {
          let dx = 0
          let dy = 0
          if (key === 'arrowup') dy = -1
          if (key === 'arrowdown') dy = 1
          if (key === 'arrowleft') dx = -1
          if (key === 'arrowright') dx = 1

          setSelectionTransform({
            x: selection.rect.x + dx,
            y: selection.rect.y + dy,
            rotation: selection.rotation,
            scaleX: selection.scaleX,
            scaleY: selection.scaleY,
          })
          return
        }

        // 2. Pan Viewport otherwise
        let dx = 0
        let dy = 0
        if (key === 'arrowup') dy = PAN_STEP
        if (key === 'arrowdown') dy = -PAN_STEP
        if (key === 'arrowleft') dx = PAN_STEP
        if (key === 'arrowright') dx = -PAN_STEP

        setViewportOffset(viewport.offsetX + dx, viewport.offsetY + dy)
        return
      }

      switch (key) {
        case SPRITE_EDITOR_KEYBOARD.PENCIL:
          setActiveTool('pencil')
          break
        case SPRITE_EDITOR_KEYBOARD.ERASER:
          setActiveTool('eraser')
          break
        case SPRITE_EDITOR_KEYBOARD.BUCKET:
          setActiveTool('bucket')
          break
        case SPRITE_EDITOR_KEYBOARD.EYEDROPPER:
          setActiveTool('eyedropper')
          break
        case SPRITE_EDITOR_KEYBOARD.SELECT:
          setActiveTool('select')
          break
        case SPRITE_EDITOR_KEYBOARD.TRANSFORM:
          setActiveTool('transform')
          break
        case 'o':
          e.preventDefault()
          toggleOnionSkin()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    setActiveTool,
    undo,
    redo,
    setZoom,
    viewport,
    setViewportOffset,
    activeTool,
    selection,
    setSelectionTransform,
    copySelection,
    cutSelection,
    pasteClipboard,
    deleteSelection,
    toggleZenMode,
  ])
}


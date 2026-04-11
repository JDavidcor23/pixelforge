'use client'

import { useEffect } from 'react'

import { SPRITE_EDITOR_KEYBOARD, SPRITE_EDITOR_CANVAS, SPRITE_EDITOR_VIEWPORT } from '@/app/editor/constants'
import {
  useSetActiveTool,
  useUndo,
  useRedo,
  useSetZoom,
  useViewport,
} from './useSpriteEditorStore.hook'

export const useKeyboardShortcuts = () => {
  const setActiveTool = useSetActiveTool()
  const undo = useUndo()
  const redo = useRedo()
  const setZoom = useSetZoom()
  const viewport = useViewport()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const isCtrl = e.ctrlKey || e.metaKey
      const isShift = e.shiftKey

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

      if (isCtrl || isShift) return

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
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setActiveTool, undo, redo, setZoom, viewport.zoom])
}


'use client'

import { useCallback, useState, useRef, useEffect } from 'react'

import type { ToolDefinition } from '@/app/editor/types'
import { SPRITE_EDITOR_TOOLS } from '@/app/editor/constants'
import {
  useActiveTool,
  usePrimaryColor,
  useSecondaryColor,
  useSetActiveTool,
  useShowGrid,
  useSetShowGrid,
  useToggleToolbar,
  useSetToolbarPosition,
  useOnionSkinEnabled,
  useToggleOnionSkin,
  useUIState,
} from '@/app/editor/sprites/hooks/useSpriteEditorStore.hook'

export const useBottomToolbar = () => {
  const activeTool = useActiveTool()
  const primaryColor = usePrimaryColor()
  const secondaryColor = useSecondaryColor()
  const setActiveTool = useSetActiveTool()
  const ui = useUIState()
  const setToolbarPosition = useSetToolbarPosition()

  const showGrid = useShowGrid()
  const setShowGrid = useSetShowGrid()

  const onionSkinEnabled = useOnionSkinEnabled()
  const toggleOnionSkin = useToggleOnionSkin()

  const tools = SPRITE_EDITOR_TOOLS

  const handleSelectTool = useCallback(
    (tool: ToolDefinition) => {
      setActiveTool(tool.type)
    },
    [setActiveTool]
  )

  const toggleGrid = useCallback(() => {
    setShowGrid(!showGrid)
  }, [showGrid, setShowGrid])

  const toggleToolbar = useToggleToolbar()

  // ── Drag Logic ───────────────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef<{ x: number; y: number } | null>(null)

  const handleDragStart = (e: React.MouseEvent) => {
    // We only want to drag if clicking the handle or the background, not buttons
    if ((e.target as HTMLElement).closest('button')) return

    setIsDragging(true)
    
    // Get current position or calculate default
    const currentX = ui.toolbarPosition?.x ?? window.innerWidth / 2
    const currentY = ui.toolbarPosition?.y ?? window.innerHeight - 60

    dragOffset.current = {
      x: e.clientX - currentX,
      y: e.clientY - currentY,
    }
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragOffset.current) return
      
      setToolbarPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, setToolbarPosition])

  return { 
    tools, 
    activeTool, 
    primaryColor, 
    secondaryColor, 
    handleSelectTool, 
    showGrid, 
    toggleGrid, 
    onionSkinEnabled,
    toggleOnionSkin,
    toggleToolbar,
    toolbarPosition: ui.toolbarPosition,
    isDragging,
    handleDragStart
  }
}

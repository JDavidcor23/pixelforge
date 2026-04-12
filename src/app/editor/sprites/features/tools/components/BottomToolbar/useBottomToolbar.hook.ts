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
  const toolbarRef = useRef<HTMLDivElement>(null)

  // ── Drag Logic ───────────────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef<{ x: number; y: number } | null>(null)

  const handleDragStart = (e: React.MouseEvent) => {
    // We only want to drag if clicking the handle or the background, not buttons
    if ((e.target as HTMLElement).closest('button')) return
    if (!toolbarRef.current) return

    const parent = toolbarRef.current.parentElement
    if (!parent) return

    setIsDragging(true)
    
    const parentRect = parent.getBoundingClientRect()
    
    // Get current position or calculate default
    const currentX = ui.toolbarPosition?.x ?? parentRect.width / 2
    const currentY = ui.toolbarPosition?.y ?? parentRect.height - 60

    dragOffset.current = {
      x: (e.clientX - parentRect.left) - currentX,
      y: (e.clientY - parentRect.top) - currentY,
    }
  }

  // Effect to handle dragging movement
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragOffset.current || !toolbarRef.current) return
      
      const parent = toolbarRef.current.parentElement
      if (!parent) return
      
      const parentRect = parent.getBoundingClientRect()
      const toolbarRect = toolbarRef.current.getBoundingClientRect()
      
      // Calculate new position relative to parent
      let newX = (e.clientX - parentRect.left) - dragOffset.current.x
      let newY = (e.clientY - parentRect.top) - dragOffset.current.y
      
      // Constraints: account for transform: translate(-50%, -50%)
      const halfWidth = toolbarRect.width / 2
      const halfHeight = toolbarRect.height / 2
      
      // Keep inside parent bounds
      newX = Math.max(halfWidth, Math.min(newX, parentRect.width - halfWidth))
      newY = Math.max(halfHeight, Math.min(newY, parentRect.height - halfHeight))
      
      setToolbarPosition({ x: newX, y: newY })
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

  // Effect to handle parent resize (keeping toolbar inside if sidebars toggle)
  useEffect(() => {
    if (!toolbarRef.current || !toolbarRef.current.parentElement) return
    const parent = toolbarRef.current.parentElement

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry || !ui.toolbarPosition) return

      const { width, height } = entry.contentRect
      const toolbarRect = toolbarRef.current!.getBoundingClientRect()
      const halfWidth = toolbarRect.width / 2
      const halfHeight = toolbarRect.height / 2

      let adjustedX = ui.toolbarPosition.x
      let adjustedY = ui.toolbarPosition.y
      let needsUpdate = false

      if (adjustedX + halfWidth > width) {
        adjustedX = width - halfWidth
        needsUpdate = true
      }
      if (adjustedX < halfWidth) {
        adjustedX = halfWidth
        needsUpdate = true
      }
      if (adjustedY + halfHeight > height) {
        adjustedY = height - halfHeight
        needsUpdate = true
      }
      if (adjustedY < halfHeight) {
        adjustedY = halfHeight
        needsUpdate = true
      }

      if (needsUpdate) {
        setToolbarPosition({ x: adjustedX, y: adjustedY })
      }
    })

    observer.observe(parent)
    return () => observer.disconnect()
  }, [ui.toolbarPosition, setToolbarPosition])

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
    handleDragStart,
    toolbarRef
  }
}

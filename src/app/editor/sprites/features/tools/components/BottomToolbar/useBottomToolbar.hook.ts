'use client'

import { useCallback } from 'react'

import type { ToolDefinition } from '@/app/editor/types'
import { SPRITE_EDITOR_TOOLS } from '@/app/editor/constants'
import {
  useActiveTool,
  usePrimaryColor,
  useSecondaryColor,
  useSetActiveTool,
  useShowGrid,
  useSetShowGrid,
} from '@/app/editor/sprites/hooks/useSpriteEditorStore.hook'

export const useBottomToolbar = () => {
  const activeTool = useActiveTool()
  const primaryColor = usePrimaryColor()
  const secondaryColor = useSecondaryColor()
  const setActiveTool = useSetActiveTool()

  const showGrid = useShowGrid()
  const setShowGrid = useSetShowGrid()

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

  return { tools, activeTool, primaryColor, secondaryColor, handleSelectTool, showGrid, toggleGrid }
}

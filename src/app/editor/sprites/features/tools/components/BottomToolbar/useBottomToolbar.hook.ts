'use client'

import { useCallback } from 'react'

import type { ToolDefinition } from '@/app/editor/types'
import { SPRITE_EDITOR_TOOLS } from '@/app/editor/constants'
import {
  useActiveTool,
  usePrimaryColor,
  useSecondaryColor,
  useSetActiveTool,
} from '@/app/editor/sprites/hooks/useSpriteEditorStore.hook'

export const useBottomToolbar = () => {
  const activeTool = useActiveTool()
  const primaryColor = usePrimaryColor()
  const secondaryColor = useSecondaryColor()
  const setActiveTool = useSetActiveTool()

  const tools = SPRITE_EDITOR_TOOLS

  const handleSelectTool = useCallback(
    (tool: ToolDefinition) => {
      setActiveTool(tool.type)
    },
    [setActiveTool]
  )

  return { tools, activeTool, primaryColor, secondaryColor, handleSelectTool }
}

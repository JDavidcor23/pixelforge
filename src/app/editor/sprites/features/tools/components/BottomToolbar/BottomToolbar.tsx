'use client'

import { ToolButton } from '../ToolButton/ToolButton'
import { ColorSwatch } from '../ColorSwatch/ColorSwatch'
import { useBottomToolbar } from '@/app/editor/sprites/features/tools/components/BottomToolbar/useBottomToolbar.hook'

export const BottomToolbar = () => {
  const { tools, activeTool, primaryColor, secondaryColor, handleSelectTool } =
    useBottomToolbar()

  return (
    <div className="absolute bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-[#1a1a2e]/90 px-4 py-2 backdrop-blur pointer-events-auto">
      {tools.map((tool) => (
        <ToolButton
          key={tool.type}
          tool={tool}
          isActive={activeTool === tool.type}
          onSelect={handleSelectTool}
        />
      ))}
      <div className="mx-2 h-6 w-px bg-white/10" />
      <ColorSwatch primaryColor={primaryColor} secondaryColor={secondaryColor} />
    </div>
  )
}

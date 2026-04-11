'use client'

import { Grid3x3 } from 'lucide-react'
import { ToolButton } from '../ToolButton/ToolButton'
import { ColorSwatch } from '../ColorSwatch/ColorSwatch'
import { useBottomToolbar } from '@/app/editor/sprites/features/tools/components/BottomToolbar/useBottomToolbar.hook'

export const BottomToolbar = () => {
  const { tools, activeTool, primaryColor, secondaryColor, handleSelectTool, showGrid, toggleGrid } =
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
      <button
        type="button"
        onClick={toggleGrid}
        title="Toggle Grid Overlay"
        className={`relative rounded-lg p-2 transition-colors ${
          showGrid
            ? 'bg-[#00f5ff]/20 text-[#00f5ff]'
            : 'text-[#8888aa] hover:text-white'
        }`}
      >
        <Grid3x3 size={18} />
      </button>
      <div className="mx-2 h-6 w-px bg-white/10" />
      <ColorSwatch primaryColor={primaryColor} secondaryColor={secondaryColor} />
    </div>
  )
}

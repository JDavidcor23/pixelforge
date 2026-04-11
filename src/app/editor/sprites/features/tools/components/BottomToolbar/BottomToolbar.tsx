'use client'

import { Grid3x3, ChevronDown, GripVertical, Layers } from 'lucide-react'
import { ToolButton } from '../ToolButton/ToolButton'
import { ColorSwatch } from '../ColorSwatch/ColorSwatch'
import { useBottomToolbar } from '@/app/editor/sprites/features/tools/components/BottomToolbar/useBottomToolbar.hook'

export const BottomToolbar = () => {
  const { 
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
    toolbarPosition,
    isDragging,
    handleDragStart
  } = useBottomToolbar()

  const positionStyle: React.CSSProperties = toolbarPosition 
    ? {
        position: 'fixed',
        left: `${toolbarPosition.x}px`,
        top: `${toolbarPosition.y}px`,
        transform: 'translate(-50%, -50%)',
        margin: 0,
        bottom: 'auto'
      }
    : {
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)'
      }

  return (
    <div 
      onMouseDown={handleDragStart}
      style={positionStyle}
      className={`absolute z-[100] flex items-center gap-1 rounded-full border border-white/10 bg-[#1a1a2e]/90 px-3 py-2 backdrop-blur pointer-events-auto select-none transition-shadow ${isDragging ? 'cursor-grabbing shadow-2xl ring-2 ring-[#00f5ff]/20' : 'cursor-grab hover:shadow-xl'}`}
    >
      <div className="mr-1 text-[#8888aa]/50">
        <GripVertical size={16} />
      </div>

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

      <button
        type="button"
        onClick={toggleOnionSkin}
        title={`Onion Skin: ${onionSkinEnabled ? 'ENABLED' : 'DISABLED'} (dim non-active layers)`}
        className={`relative rounded-lg p-2 transition-all ${
          onionSkinEnabled
            ? 'bg-[#00f5ff] text-[#1a1a2e] shadow-[0_0_10px_#00f5ff]'
            : 'text-[#8888aa] hover:text-white'
        }`}
      >
        <Layers size={18} />
      </button>
      <div className="mx-2 h-6 w-px bg-white/10" />
      <ColorSwatch primaryColor={primaryColor} secondaryColor={secondaryColor} />
      <div className="mx-2 h-6 w-px bg-white/10" />
      <button
        type="button"
        onClick={toggleToolbar}
        title="Hide Toolbar"
        className="rounded-lg p-2 text-[#8888aa] transition-colors hover:text-white"
      >
        <ChevronDown size={18} />
      </button>
    </div>
  )
}

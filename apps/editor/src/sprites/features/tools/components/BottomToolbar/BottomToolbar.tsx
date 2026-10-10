import { Grid3x3, ChevronDown, GripVertical, Layers } from 'lucide-react'
import { ToolButton } from '../ToolButton/ToolButton'
import { ColorSwatch } from '../ColorSwatch/ColorSwatch'
import { useBottomToolbar } from '@/sprites/features/tools/components/BottomToolbar/useBottomToolbar.hook'

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
    handleDragStart,
    toolbarRef
  } = useBottomToolbar()

  const positionStyle: React.CSSProperties = toolbarPosition 
    ? {
        position: 'absolute',
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
      ref={toolbarRef}
      onMouseDown={handleDragStart}
      style={positionStyle}
      className={`pointer-events-auto absolute z-40 flex select-none items-center gap-1 rounded-full border border-line-strong bg-hover/90 px-3 py-2 backdrop-blur transition-shadow ${isDragging ? 'cursor-grabbing shadow-2xl ring-2 ring-accent/20' : 'cursor-grab hover:shadow-xl'}`}
    >
      <div className="mr-1 text-subtle">
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
      <div className="mx-2 h-6 w-px bg-line-strong" />
      <button
        type="button"
        onClick={toggleGrid}
        title="Toggle Grid Overlay"
        className={`relative rounded p-2 transition-colors ${
          showGrid ? 'bg-accent/20 text-accent' : 'text-muted hover:text-ink'
        }`}
      >
        <Grid3x3 size={18} />
      </button>

      <button
        type="button"
        onClick={toggleOnionSkin}
        title={`Onion Skin: ${onionSkinEnabled ? 'ENABLED' : 'DISABLED'} (dim non-active layers)`}
        className={`relative rounded p-2 transition-all ${
          onionSkinEnabled
            ? 'glow-accent bg-accent text-base'
            : 'text-muted hover:text-ink'
        }`}
      >
        <Layers size={18} />
      </button>
      <div className="mx-2 h-6 w-px bg-line-strong" />
      <ColorSwatch primaryColor={primaryColor} secondaryColor={secondaryColor} />
      <div className="mx-2 h-6 w-px bg-line-strong" />
      <button
        type="button"
        onClick={toggleToolbar}
        title="Hide Toolbar"
        className="rounded p-2 text-muted transition-colors hover:text-ink"
      >
        <ChevronDown size={18} />
      </button>
    </div>
  )
}

'use client'

import { Plus } from 'lucide-react'

import { LayerItem } from '../LayerItem/LayerItem'
import { useLayerPanel } from './useLayerPanel.hook'

export const LayerPanel = () => {
  const {
    reversedLayers,
    activeLayerId,
    handleAddLayer,
    handleToggleVisibility,
    handleToggleLock,
    handleSelectLayer,
    handleUpdateLayerName,
    handleReorder,
  } = useLayerPanel()

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
        {reversedLayers.map((layer, index) => (
          <LayerItem
            key={layer.id}
            id={layer.id}
            index={index}
            isFirst={index === 0}
            isLast={index === reversedLayers.length - 1}
            name={layer.name}
            visible={layer.visible}
            locked={layer.locked}
            isActive={layer.id === activeLayerId}
            onToggleVisibility={handleToggleVisibility}
            onToggleLock={handleToggleLock}
            onSelect={handleSelectLayer}
            onRename={handleUpdateLayerName}
            onReorder={handleReorder}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={handleAddLayer}
        className="flex w-full items-center justify-center gap-2 border-t border-white/10 px-3 py-2 text-xs text-[#8888aa] transition-colors hover:text-[#00f5ff]"
      >
        <Plus size={14} />
        Add Layer
      </button>
    </div>
  )
}

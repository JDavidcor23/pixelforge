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
  } = useLayerPanel()

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        {reversedLayers.map((layer) => (
          <LayerItem
            key={layer.id}
            id={layer.id}
            name={layer.name}
            visible={layer.visible}
            locked={layer.locked}
            isActive={layer.id === activeLayerId}
            onToggleVisibility={handleToggleVisibility}
            onToggleLock={handleToggleLock}
            onSelect={handleSelectLayer}
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


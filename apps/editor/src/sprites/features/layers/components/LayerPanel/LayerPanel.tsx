import { Plus } from 'lucide-react'

import { LayerItem } from '../LayerItem/LayerItem'
import { useLayerPanel } from './useLayerPanel.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

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
    handleRemoveLayer,
  } = useLayerPanel()

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex flex-col gap-0.5">
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
              onRemove={handleRemoveLayer}
              canDelete={reversedLayers.length > 1}
            />
          ))}
        </div>
      </div>
      <div className="shrink-0 border-t border-line p-3">
        <button
          type="button"
          onClick={handleAddLayer}
          className={`flex h-8 w-full items-center justify-center gap-2 rounded border border-line-strong text-xs text-muted hover:bg-hover hover:text-ink ${MOTION.COLORS} ${FOCUS_RING.SURFACE}`}
        >
          <Plus size={14} aria-hidden />
          Add Layer
        </button>
      </div>
    </div>
  )
}

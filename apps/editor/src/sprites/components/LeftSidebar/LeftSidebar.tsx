import { Layers, Plus } from 'lucide-react'

import { LayerPanel } from '../../features/layers'
import { useLeftSidebar } from './useLeftSidebar.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

export const LeftSidebar = () => {
  const { handleAddLayer } = useLeftSidebar()

  return (
    <div className="flex h-full flex-col border-r border-line bg-surface">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-line px-4">
        <Layers size={13} className="text-accent" aria-hidden />
        <h3 className="font-mono text-3xs font-medium tracking-wider text-ink">LAYERS</h3>
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleAddLayer}
          aria-label="Add layer"
          title="Add layer"
          className={`flex size-5 items-center justify-center rounded text-muted hover:bg-hover hover:text-ink ${MOTION.COLORS} ${FOCUS_RING.SURFACE}`}
        >
          <Plus size={13} aria-hidden />
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <LayerPanel />
      </div>
    </div>
  )
}

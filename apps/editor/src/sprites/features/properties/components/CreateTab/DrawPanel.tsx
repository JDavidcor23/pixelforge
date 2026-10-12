import { useDrawPanel } from './useDrawPanel.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

export const DrawPanel = () => {
  const { handleAddBlankLayer } = useDrawPanel()

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">Draw directly on the canvas with the tools below.</p>
      <button
        type="button"
        onClick={handleAddBlankLayer}
        className={`flex h-8 items-center justify-center rounded border border-line-strong text-xs text-muted hover:bg-hover hover:text-ink ${MOTION.COLORS} ${FOCUS_RING.SURFACE}`}
      >
        Add a blank layer
      </button>
    </div>
  )
}

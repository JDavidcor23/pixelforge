import { ZoomIn, ZoomOut } from 'lucide-react'

import { TweakSlider } from '@/sounds/features/synthesizer'
import { useZoomControl } from './useZoomControl.hook'
import { DISABLED_STATE, FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

const ZOOM_BUTTON = `flex size-6 items-center justify-center rounded text-subtle hover:text-accent ${MOTION.PRESS} ${FOCUS_RING.BASE} ${DISABLED_STATE}`

export function ZoomControl() {
  const {
    pxPerSecond,
    min,
    max,
    step,
    canZoomIn,
    canZoomOut,
    valueText,
    handleZoomIn,
    handleZoomOut,
    handleZoomChange,
  } = useZoomControl()

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleZoomOut}
        disabled={!canZoomOut}
        aria-label="Zoom out"
        aria-keyshortcuts="-"
        className={ZOOM_BUTTON}
      >
        <ZoomOut className="size-3.5" aria-hidden />
      </button>
      <TweakSlider
        variant="compact"
        ariaLabel="Zoom"
        valueText={valueText}
        value={pxPerSecond}
        min={min}
        max={max}
        step={step}
        onChange={handleZoomChange}
      />
      <button
        type="button"
        onClick={handleZoomIn}
        disabled={!canZoomIn}
        aria-label="Zoom in"
        aria-keyshortcuts="+"
        className={ZOOM_BUTTON}
      >
        <ZoomIn className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}

import { useSoundsStore } from '@/stores/sounds.store'
import { MAX_PX_PER_SECOND, MIN_PX_PER_SECOND } from '@/constants/timeline'
import { ZOOM_SLIDER_STEP_PX } from '@/constants/timeline-view'

export function useZoomControl() {
  const pxPerSecond = useSoundsStore((state) => state.pxPerSecond)
  const zoomIn = useSoundsStore((state) => state.zoomIn)
  const zoomOut = useSoundsStore((state) => state.zoomOut)
  const setZoom = useSoundsStore((state) => state.setZoom)

  return {
    pxPerSecond,
    min: MIN_PX_PER_SECOND,
    max: MAX_PX_PER_SECOND,
    step: ZOOM_SLIDER_STEP_PX,
    canZoomIn: pxPerSecond < MAX_PX_PER_SECOND,
    canZoomOut: pxPerSecond > MIN_PX_PER_SECOND,
    valueText: `${Math.round(pxPerSecond)} pixels per second`,
    handleZoomIn: zoomIn,
    handleZoomOut: zoomOut,
    handleZoomChange: setZoom,
  }
}

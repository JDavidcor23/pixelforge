'use client'

import { useCanvasOverlay } from './useCanvasOverlay.hook'

export const CanvasOverlay = () => {
  const { zoomPercentage, positionText } = useCanvasOverlay()

  return (
    <div className="absolute bottom-2 left-2 flex items-center gap-3 rounded bg-[#0f1115]/80 px-3 py-1 text-[10px] text-[#8888aa] backdrop-blur">
      <span>{zoomPercentage}</span>
      <span>{positionText}</span>
    </div>
  )
}


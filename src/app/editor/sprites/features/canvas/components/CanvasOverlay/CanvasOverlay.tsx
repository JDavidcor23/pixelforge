'use client'

import { useCanvasOverlay } from '@/app/editor/sprites/features/canvas/components/CanvasOverlay/useCanvasOverlay.hook'

export const CanvasOverlay = () => {
  const { zoomPercentage, positionText, centerViewLabel, isViewCentered, handleCenterView } =
    useCanvasOverlay()

  return (
    <div className="absolute bottom-2 left-2 z-50 flex items-center gap-2 rounded bg-surface/80 px-2 py-1 font-mono text-[10px] text-muted backdrop-blur">
      <button
        type="button"
        onClick={handleCenterView}
        aria-label={centerViewLabel}
        title={centerViewLabel}
        className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
          isViewCentered
            ? 'border-accent/40 text-accent'
            : 'border-line-strong text-muted hover:border-accent/40 hover:text-accent'
        }`}
      >
        Center
      </button>

      <span>{zoomPercentage}</span>
      <span>{positionText}</span>
    </div>
  )
}

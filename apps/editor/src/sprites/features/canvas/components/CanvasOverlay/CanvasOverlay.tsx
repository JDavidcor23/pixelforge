import { useCanvasOverlay } from '@/sprites/features/canvas/components/CanvasOverlay/useCanvasOverlay.hook'

export const CanvasOverlay = () => {
  const { zoomPercentage, positionText, centerViewLabel, isViewCentered, handleCenterView } =
    useCanvasOverlay()

  return (
    <div className="absolute bottom-2 left-2 z-50 flex items-center gap-2.5 rounded border border-line bg-surface px-2.5 py-1.5 font-mono text-3xs text-muted">
      <button
        type="button"
        onClick={handleCenterView}
        aria-label={centerViewLabel}
        title={centerViewLabel}
        className={`font-mono text-3xs font-semibold uppercase tracking-wider outline-none focus-visible:ring-1 focus-visible:ring-accent ${
          isViewCentered ? 'text-accent' : 'text-accent/70 hover:text-accent'
        }`}
      >
        Center
      </button>

      <span className="h-3 w-px bg-line-strong" aria-hidden />
      <span>{zoomPercentage}</span>
      <span className="h-3 w-px bg-line-strong" aria-hidden />
      <span>{positionText}</span>
    </div>
  )
}

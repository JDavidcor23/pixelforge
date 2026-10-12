import { useHueSlider } from './useHueSlider.hook'
import { FOCUS_RING } from '@/constants/focus-ring'

interface HueSliderProps {
  readonly hue: number
  readonly onChange: (hue: number) => void
}

/** Full-width rainbow track (`.hue-slider-track`, defined once in index.css) with a square handle. */
export const HueSlider = ({ hue, onChange }: HueSliderProps) => {
  const { trackRef, handlePointerDown, handlePointerMove, handlePointerUp, handleKeyDown } = useHueSlider({
    hue,
    onChange,
  })

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label="Hue"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(hue)}
      aria-valuetext={`Hue ${Math.round(hue)}°`}
      title="Drag to pick a color"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      className={`hue-slider-track relative h-3 w-full touch-none select-none rounded-sm outline-none ${FOCUS_RING.SURFACE}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-white ring-1 ring-ink/60"
        style={{ left: `${(hue / 360) * 100}%` }}
      />
    </div>
  )
}

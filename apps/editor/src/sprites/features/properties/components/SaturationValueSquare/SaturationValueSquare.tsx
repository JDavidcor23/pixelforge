import { useSaturationValueSquare } from './useSaturationValueSquare.hook'
import { FOCUS_RING } from '@/constants/focus-ring'

interface SaturationValueSquareProps {
  readonly hue: number
  readonly saturation: number
  readonly value: number
  readonly onChange: (saturation: number, value: number) => void
}

/**
 * Horizontal white → hue, vertical transparent → black square for the
 * current hue. Replaces the old hue×lightness rainbow area (ColorArea),
 * which mixed hue and shade into one axis and made precise shade picking
 * hard — hue now lives only in `HueSlider`.
 */
export const SaturationValueSquare = ({ hue, saturation, value, onChange }: SaturationValueSquareProps) => {
  const { containerRef, handlePointerDown, handlePointerMove, handlePointerUp, handleKeyDown } =
    useSaturationValueSquare({ saturation, value, onChange })

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={0}
      aria-label="Saturation and brightness"
      aria-valuetext={`Saturation ${Math.round(saturation)}%, brightness ${Math.round(value)}%`}
      title="Drag to pick a shade"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      className={`relative h-32 w-full touch-none select-none rounded-sm border border-line-strong outline-none ${FOCUS_RING.SURFACE}`}
      style={{
        backgroundColor: `hsl(${hue}, 100%, 50%)`,
        backgroundImage: 'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ring-1 ring-ink/60"
        style={{ left: `${saturation}%`, top: `${100 - value}%` }}
      />
    </div>
  )
}

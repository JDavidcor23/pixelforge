import { useTweakSlider } from './useTweakSlider.hook'

interface TweakSliderProps {
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  /** Visible label; also the accessible name unless `ariaLabel` is given. */
  label?: string
  ariaLabel?: string
  valueText?: string
  lo?: string
  hi?: string
  disabled?: boolean
  variant?: 'default' | 'compact'
}

/**
 * Native range input (keyboard + screen readers for free) laid invisibly over
 * a token-styled track. Fill width and thumb position are the only inline
 * styles — dynamic values, the documented exception.
 */
export function TweakSlider({
  value,
  min,
  max,
  step,
  onChange,
  label,
  ariaLabel,
  valueText,
  lo,
  hi,
  disabled = false,
  variant = 'default',
}: TweakSliderProps) {
  const { percent, handleChange } = useTweakSlider({ value, min, max, onChange })
  const isCompact = variant === 'compact'

  const track = (
    <div className={`group relative flex h-4 items-center ${isCompact ? 'w-25' : 'flex-1'}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        aria-label={ariaLabel ?? label}
        aria-valuetext={valueText}
        className="peer absolute inset-0 z-10 w-full cursor-pointer opacity-0 disabled:cursor-default"
      />
      <div className="pointer-events-none h-1 w-full rounded-full bg-hover" />
      <div
        className={`pointer-events-none absolute left-0 h-1 rounded-full ${isCompact ? 'bg-muted' : 'bg-accent'}`}
        style={{ width: percent }}
      />
      <div
        className={`pointer-events-none absolute size-3.5 -translate-x-1/2 rounded-full border-2 border-accent bg-ink transition-transform group-hover:scale-110 peer-active:scale-110 peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40 motion-reduce:transition-none ${isCompact ? 'opacity-0 group-hover:opacity-100 peer-focus-visible:opacity-100' : ''}`}
        style={{ left: percent }}
      />
    </div>
  )

  if (isCompact) return track

  return (
    <div className={`flex items-center gap-3.5 ${disabled ? 'pointer-events-none opacity-40' : ''}`}>
      <span className="w-14 shrink-0 text-ui font-medium text-ink" aria-hidden>
        {label}
      </span>
      <span className="w-15.5 shrink-0 text-right text-2xs text-subtle" aria-hidden>
        {lo}
      </span>
      {track}
      <span className="w-14.5 shrink-0 text-2xs text-subtle" aria-hidden>
        {hi}
      </span>
    </div>
  )
}

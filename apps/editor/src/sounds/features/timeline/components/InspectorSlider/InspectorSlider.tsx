import { TweakSlider } from '@/sounds/features/synthesizer'

interface InspectorSliderProps {
  label: string
  valueLabel: string
  lo: string
  hi: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  onPointerDown: () => void
}

export function InspectorSlider({
  label,
  valueLabel,
  lo,
  hi,
  value,
  min,
  max,
  step,
  onChange,
  onPointerDown,
}: InspectorSliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-ui font-medium text-ink" aria-hidden>
          {label}
        </span>
        <span className="font-mono text-xs text-muted tabular-nums" aria-hidden>
          {valueLabel}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="text-2xs text-muted" aria-hidden>
          {lo}
        </span>
        <TweakSlider
          variant="inline"
          ariaLabel={label}
          valueText={valueLabel}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={onChange}
          onPointerDown={onPointerDown}
        />
        <span className="text-2xs text-muted" aria-hidden>
          {hi}
        </span>
      </div>
    </div>
  )
}

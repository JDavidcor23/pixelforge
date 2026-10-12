interface OpacitySliderProps {
  readonly value: number
  readonly onChange: (value: number) => void
}

export const OpacitySlider = ({ value, onChange }: OpacitySliderProps) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">Opacity</span>
        <span className="font-mono text-xs text-ink">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-hover accent-accent"
      />
    </div>
  )
}

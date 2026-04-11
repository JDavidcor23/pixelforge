interface OpacitySliderProps {
  readonly value: number
  readonly onChange: (value: number) => void
}

export const OpacitySlider = ({ value, onChange }: OpacitySliderProps) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#8888aa]">Opacity</span>
        <span className="text-xs text-[#ededed]">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[#252540] accent-[#00f5ff]"
      />
    </div>
  )
}

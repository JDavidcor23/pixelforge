import type { FilterType } from '@/types/audio'
import { useFilterControls } from './useFilterControls.hook'
import { FOCUS_RING } from '@/constants/focus-ring'

const FILTER_LABELS: Record<FilterType, string> = {
  lowpass: 'Low Pass',
  highpass: 'High Pass',
  bandpass: 'Band Pass',
}

export function FilterControls() {
  const {
    filter,
    filterTypes,
    frequencyLimits,
    qLimits,
    frequencyStep,
    qStep,
    handleTypeChange,
    handleFrequencyChange,
    handleQChange,
    formatFrequency,
    formatQ,
  } = useFilterControls()

  return (
    <section className="flex flex-col gap-4 rounded border border-line bg-surface p-4">
      <h3 className="text-ui font-semibold text-ink">
        Filter
      </h3>

      {/* Filter Type Buttons */}
      <div className="flex gap-2">
        {filterTypes.map((type) => {
          return (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeChange(type)}
              aria-label={`Filter type: ${FILTER_LABELS[type]}`}
              aria-pressed={filter.type === type}
              className={`flex-1 rounded border border-line px-3 py-2 text-xs font-medium text-subtle hover:text-muted aria-pressed:bg-hover aria-pressed:text-accent ${FOCUS_RING.SURFACE}`}
            >
              {FILTER_LABELS[type]}
            </button>
          )
        })}
      </div>

      {/* Frequency Slider */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label htmlFor="filter-frequency" className="text-xs text-muted">
            Cutoff Frequency
          </label>
          <span className="font-mono text-xs text-accent tabular-nums">
            {formatFrequency(filter.frequency)}
          </span>
        </div>
        <input
          id="filter-frequency"
          type="range"
          min={frequencyLimits.min}
          max={frequencyLimits.max}
          step={frequencyStep}
          value={filter.frequency}
          onChange={(e) => handleFrequencyChange(Number(e.target.value))}
          aria-label="Filter cutoff frequency"
          className="h-1.5 w-full cursor-pointer accent-accent"
        />
      </div>

      {/* Q/Resonance Slider */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label htmlFor="filter-q" className="text-xs text-muted">
            Resonance (Q)
          </label>
          <span className="font-mono text-xs text-accent tabular-nums">
            {formatQ(filter.q)}
          </span>
        </div>
        <input
          id="filter-q"
          type="range"
          min={qLimits.min}
          max={qLimits.max}
          step={qStep}
          value={filter.q}
          onChange={(e) => handleQChange(Number(e.target.value))}
          aria-label="Filter resonance Q factor"
          className="h-1.5 w-full cursor-pointer accent-accent"
        />
      </div>
    </section>
  )
}

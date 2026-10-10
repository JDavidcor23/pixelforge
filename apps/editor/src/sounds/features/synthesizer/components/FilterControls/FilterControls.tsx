'use client'

import type { FilterType } from '@/app/editor/types/audio'
import { useFilterControls } from './useFilterControls.hook'

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
    handleTypeChange,
    handleFrequencyChange,
    handleQChange,
    formatFrequency,
    formatQ,
  } = useFilterControls()

  return (
    <section className="flex flex-col gap-4 rounded-lg bg-gray-800 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
        Filter
      </h3>

      {/* Filter Type Buttons */}
      <div className="flex gap-2">
        {filterTypes.map((type) => {
          const isActive = filter.type === type

          return (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeChange(type)}
              aria-label={`Filter type: ${FILTER_LABELS[type]}`}
              aria-pressed={isActive}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {FILTER_LABELS[type]}
            </button>
          )
        })}
      </div>

      {/* Frequency Slider */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label htmlFor="filter-frequency" className="text-xs text-gray-400">
            Cutoff Frequency
          </label>
          <span className="text-xs font-mono text-violet-400">
            {formatFrequency(filter.frequency)}
          </span>
        </div>
        <input
          id="filter-frequency"
          type="range"
          min={frequencyLimits.min}
          max={frequencyLimits.max}
          step={1}
          value={filter.frequency}
          onChange={(e) => handleFrequencyChange(Number(e.target.value))}
          aria-label="Filter cutoff frequency"
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-700 accent-violet-500"
        />
      </div>

      {/* Q/Resonance Slider */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label htmlFor="filter-q" className="text-xs text-gray-400">
            Resonance (Q)
          </label>
          <span className="text-xs font-mono text-violet-400">
            {formatQ(filter.q)}
          </span>
        </div>
        <input
          id="filter-q"
          type="range"
          min={qLimits.min}
          max={qLimits.max}
          step={0.1}
          value={filter.q}
          onChange={(e) => handleQChange(Number(e.target.value))}
          aria-label="Filter resonance Q factor"
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-700 accent-violet-500"
        />
      </div>
    </section>
  )
}

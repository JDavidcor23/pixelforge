'use client'

import { Waves, Square, Triangle, Activity, Radio } from 'lucide-react'
import type { OscillatorType } from '@/app/editor/types/audio'
import { useOscillatorControls } from './useOscillatorControls.hook'

const WAVEFORM_ICONS: Record<OscillatorType, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  sine: { icon: Waves, label: 'Sine' },
  square: { icon: Square, label: 'Square' },
  sawtooth: { icon: Activity, label: 'Sawtooth' },
  triangle: { icon: Triangle, label: 'Triangle' },
  'white-noise': { icon: Radio, label: 'Noise' },
}

export function OscillatorControls() {
  const {
    oscillator,
    oscillatorTypes,
    frequencyLimits,
    detuneLimits,
    handleTypeChange,
    handleFrequencyChange,
    handleFrequencyCommit,
    handleDetuneChange,
    handleDetuneCommit,
    formatFrequency,
  } = useOscillatorControls()

  return (
    <section className="flex flex-col gap-4 rounded-lg bg-gray-800 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
        Oscillator
      </h3>

      {/* Waveform Type Buttons */}
      <div className="flex gap-2">
        {oscillatorTypes.map((type) => {
          const { icon: Icon, label } = WAVEFORM_ICONS[type]
          const isActive = oscillator.type === type

          return (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeChange(type)}
              aria-label={`Waveform: ${label}`}
              aria-pressed={isActive}
              className={`flex flex-1 flex-col items-center gap-1 rounded-md px-2 py-2 text-xs transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          )
        })}
      </div>

      {/* Frequency Slider */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label htmlFor="osc-frequency" className="text-xs text-gray-400">
            Frequency
          </label>
          <span className="text-xs font-mono text-violet-400">
            {formatFrequency(oscillator.frequency)}
          </span>
        </div>
        <input
          id="osc-frequency"
          type="range"
          min={frequencyLimits.min}
          max={frequencyLimits.max}
          step={1}
          value={oscillator.frequency}
          onChange={(e) => handleFrequencyChange(Number(e.target.value))}
          onMouseUp={(e) => handleFrequencyCommit(Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => handleFrequencyCommit(Number((e.target as HTMLInputElement).value))}
          aria-label="Oscillator frequency"
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-700 accent-violet-500"
        />
      </div>

      {/* Detune Slider */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label htmlFor="osc-detune" className="text-xs text-gray-400">
            Detune
          </label>
          <span className="text-xs font-mono text-violet-400">
            {oscillator.detune > 0 ? '+' : ''}{oscillator.detune} cents
          </span>
        </div>
        <input
          id="osc-detune"
          type="range"
          min={detuneLimits.min}
          max={detuneLimits.max}
          step={1}
          value={oscillator.detune}
          onChange={(e) => handleDetuneChange(Number(e.target.value))}
          onMouseUp={(e) => handleDetuneCommit(Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => handleDetuneCommit(Number((e.target as HTMLInputElement).value))}
          aria-label="Oscillator detune in cents"
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-700 accent-violet-500"
        />
      </div>
    </section>
  )
}

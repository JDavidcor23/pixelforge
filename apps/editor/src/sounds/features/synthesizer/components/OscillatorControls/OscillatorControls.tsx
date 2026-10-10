import { Waves, Square, Triangle, Activity, Radio } from 'lucide-react'
import type { OscillatorType } from '@/types/audio'
import { useOscillatorControls } from './useOscillatorControls.hook'
import { FOCUS_RING } from '@/constants/focus-ring'

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
    frequencyStep,
    detuneStep,
    handleTypeChange,
    handleFrequencyChange,
    handleFrequencyCommit,
    handleDetuneChange,
    handleDetuneCommit,
    formatFrequency,
  } = useOscillatorControls()

  return (
    <section className="flex flex-col gap-4 rounded border border-line bg-surface p-4">
      <h3 className="text-ui font-semibold text-ink">
        Oscillator
      </h3>

      {/* Waveform Type Buttons */}
      <div className="flex gap-2">
        {oscillatorTypes.map((type) => {
          const { icon: Icon, label } = WAVEFORM_ICONS[type]
          return (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeChange(type)}
              aria-label={`Waveform: ${label}`}
              aria-pressed={oscillator.type === type}
              className={`flex flex-1 flex-col items-center gap-1 rounded border border-line px-2 py-2 text-xs text-subtle hover:text-muted aria-pressed:bg-hover aria-pressed:text-accent ${FOCUS_RING.SURFACE}`}
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
          <label htmlFor="osc-frequency" className="text-xs text-muted">
            Frequency
          </label>
          <span className="font-mono text-xs text-accent tabular-nums">
            {formatFrequency(oscillator.frequency)}
          </span>
        </div>
        <input
          id="osc-frequency"
          type="range"
          min={frequencyLimits.min}
          max={frequencyLimits.max}
          step={frequencyStep}
          value={oscillator.frequency}
          onChange={(e) => handleFrequencyChange(Number(e.target.value))}
          onMouseUp={(e) => handleFrequencyCommit(Number(e.currentTarget.value))}
          onTouchEnd={(e) => handleFrequencyCommit(Number(e.currentTarget.value))}
          aria-label="Oscillator frequency"
          className="h-1.5 w-full cursor-pointer accent-accent"
        />
      </div>

      {/* Detune Slider */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label htmlFor="osc-detune" className="text-xs text-muted">
            Detune
          </label>
          <span className="font-mono text-xs text-accent tabular-nums">
            {oscillator.detune > 0 ? '+' : ''}{oscillator.detune} cents
          </span>
        </div>
        <input
          id="osc-detune"
          type="range"
          min={detuneLimits.min}
          max={detuneLimits.max}
          step={detuneStep}
          value={oscillator.detune}
          onChange={(e) => handleDetuneChange(Number(e.target.value))}
          onMouseUp={(e) => handleDetuneCommit(Number(e.currentTarget.value))}
          onTouchEnd={(e) => handleDetuneCommit(Number(e.currentTarget.value))}
          aria-label="Oscillator detune in cents"
          className="h-1.5 w-full cursor-pointer accent-accent"
        />
      </div>
    </section>
  )
}

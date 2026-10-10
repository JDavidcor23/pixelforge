import type { EnvelopeParameters } from '@/types/audio'
import { useEnvelopeControls } from './useEnvelopeControls.hook'

const ENVELOPE_PARAMS: { key: keyof EnvelopeParameters; label: string }[] = [
  { key: 'attack', label: 'Attack' },
  { key: 'decay', label: 'Decay' },
  { key: 'sustain', label: 'Sustain' },
  { key: 'release', label: 'Release' },
]

export function EnvelopeControls() {
  const {
    envelope,
    limits,
    viewBox,
    baseline,
    getStep,
    handleParamChange,
    handleParamCommit,
    formatValue,
    generateAdsrPath,
  } = useEnvelopeControls()

  return (
    <section className="flex flex-col gap-4 rounded border border-line bg-surface p-4">
      <h3 className="text-ui font-semibold text-ink">
        Envelope (ADSR)
      </h3>

      {/* ADSR Visual Curve */}
      <div className="rounded bg-base p-2">
        <svg
          viewBox={viewBox}
          className="h-16 w-full"
          aria-label="ADSR envelope visualization"
        >
          <path
            d={generateAdsrPath(envelope)}
            fill="none"
            className="stroke-accent"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Baseline */}
          <line
            x1={baseline.x1}
            y1={baseline.y1}
            x2={baseline.x2}
            y2={baseline.y2}
            className="stroke-line-strong"
            strokeWidth="0.5"
            strokeDasharray="2 2"
          />
        </svg>
      </div>

      {/* ADSR Sliders */}
      <div className="grid grid-cols-2 gap-3">
        {ENVELOPE_PARAMS.map(({ key, label }) => {
          const paramLimits = limits[key]
          const value = envelope[key]

          return (
            <div key={key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor={`env-${key}`} className="text-xs text-muted">
                  {label}
                </label>
                <span className="font-mono text-xs text-accent tabular-nums">
                  {formatValue(key, value)}
                </span>
              </div>
              <input
                id={`env-${key}`}
                type="range"
                min={paramLimits.min}
                max={paramLimits.max}
                step={getStep(key)}
                value={value}
                onChange={(e) => handleParamChange(key, Number(e.target.value))}
                onMouseUp={(e) => handleParamCommit(key, Number(e.currentTarget.value))}
                onTouchEnd={(e) => handleParamCommit(key, Number(e.currentTarget.value))}
                aria-label={`${label} ${formatValue(key, value)}`}
                className="h-1.5 w-full cursor-pointer accent-accent"
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}

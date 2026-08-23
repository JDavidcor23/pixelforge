'use client'

import type { EnvelopeParameters } from '@/app/editor/types/audio'
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
    handleParamChange,
    handleParamCommit,
    formatValue,
    generateAdsrPath,
  } = useEnvelopeControls()

  return (
    <section className="flex flex-col gap-4 rounded-lg bg-gray-800 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
        Envelope (ADSR)
      </h3>

      {/* ADSR Visual Curve */}
      <div className="rounded-md bg-gray-900 p-2">
        <svg
          viewBox="0 0 200 60"
          className="h-16 w-full"
          aria-label="ADSR envelope visualization"
        >
          <path
            d={generateAdsrPath(envelope)}
            fill="none"
            stroke="rgb(139, 92, 246)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Baseline */}
          <line
            x1="4"
            y1="56"
            x2="196"
            y2="56"
            stroke="rgb(75, 85, 99)"
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
          const step = key === 'sustain' ? 0.01 : 1

          return (
            <div key={key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor={`env-${key}`} className="text-xs text-gray-400">
                  {label}
                </label>
                <span className="text-xs font-mono text-violet-400">
                  {formatValue(key, value)}
                </span>
              </div>
              <input
                id={`env-${key}`}
                type="range"
                min={paramLimits.min}
                max={paramLimits.max}
                step={step}
                value={value}
                onChange={(e) => handleParamChange(key, Number(e.target.value))}
                onMouseUp={(e) => handleParamCommit(key, Number((e.target as HTMLInputElement).value))}
                onTouchEnd={(e) => handleParamCommit(key, Number((e.target as HTMLInputElement).value))}
                aria-label={`${label} ${formatValue(key, value)}`}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-700 accent-violet-500"
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}

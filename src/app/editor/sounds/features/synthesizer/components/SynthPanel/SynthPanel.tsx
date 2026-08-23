'use client'

import { Loader2, Download } from 'lucide-react'
import { PresetSelector } from '../PresetSelector/PresetSelector'
import { OscillatorControls } from '../OscillatorControls/OscillatorControls'
import { EnvelopeControls } from '../EnvelopeControls/EnvelopeControls'
import { FilterControls } from '../FilterControls/FilterControls'
import { useSynthPanel } from './useSynthPanel.hook'

export function SynthPanel() {
  const {
    masterGain,
    isGenerating,
    handleMasterGainChange,
    handleGenerate,
  } = useSynthPanel()

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-gray-900 p-4">
      {/* Presets Section */}
      <PresetSelector />

      {/* Oscillator Section */}
      <OscillatorControls />

      {/* Envelope Section */}
      <EnvelopeControls />

      {/* Filter Section */}
      <FilterControls />

      {/* Master Gain */}
      <section className="flex flex-col gap-2 rounded-lg bg-gray-800 p-4">
        <div className="flex items-center justify-between">
          <label htmlFor="master-gain" className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            Master Gain
          </label>
          <span className="text-xs font-mono text-violet-400">
            {Math.round(masterGain * 100)}%
          </span>
        </div>
        <input
          id="master-gain"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={masterGain}
          onChange={(e) => handleMasterGainChange(Number(e.target.value))}
          aria-label={`Master gain: ${Math.round(masterGain * 100)}%`}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-700 accent-violet-500"
        />
      </section>

      {/* Generate Button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating}
        aria-label="Generate WAV audio file"
        className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span>Generate WAV</span>
          </>
        )}
      </button>
    </div>
  )
}

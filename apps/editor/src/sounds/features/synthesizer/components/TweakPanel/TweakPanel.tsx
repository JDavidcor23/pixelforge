import { ChevronDown } from 'lucide-react'

import { EnvelopeControls } from '../EnvelopeControls/EnvelopeControls'
import { FilterControls } from '../FilterControls/FilterControls'
import { OscillatorControls } from '../OscillatorControls/OscillatorControls'
import { TweakSlider } from '../TweakSlider/TweakSlider'
import { useTweakPanel } from './useTweakPanel.hook'
import { DISABLED_STATE, FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

interface TweakPanelProps {
  isSynth: boolean
}

export function TweakPanel({ isSynth }: TweakPanelProps) {
  const { advancedId, titleId, sliders, range, isAdvancedOpen, handleToggleAdvanced } = useTweakPanel(isSynth)

  return (
    <section aria-labelledby={titleId} className="flex min-w-0 flex-1 flex-col gap-4.5">
      <div className="flex items-center justify-between">
        <h2 id={titleId} className="text-sm font-semibold text-ink">
          Tweak
        </h2>
        <button
          type="button"
          onClick={handleToggleAdvanced}
          disabled={!isSynth}
          aria-expanded={isAdvancedOpen}
          aria-controls={advancedId}
          className={`group flex items-center gap-1 rounded text-xs text-subtle hover:text-muted aria-expanded:text-muted ${DISABLED_STATE} ${FOCUS_RING.SURFACE}`}
        >
          Advanced
          <ChevronDown
            className="size-3 transition-transform duration-200 ease-out-strong group-aria-expanded:rotate-180"
            aria-hidden
          />
        </button>
      </div>

      {!isSynth && (
        <p className="text-xs text-muted">
          Tweaks work on sounds built with the synth. Try Remake with AI to change this one.
        </p>
      )}

      {sliders.map((slider) => (
        <TweakSlider
          key={slider.key}
          label={slider.label}
          lo={slider.lo}
          hi={slider.hi}
          value={slider.value}
          valueText={slider.valueText}
          min={range.MIN}
          max={range.MAX}
          step={range.STEP}
          disabled={!isSynth}
          onChange={slider.onChange}
        />
      ))}

      {isAdvancedOpen && (
        <div id={advancedId} className={`flex flex-col gap-3 ${MOTION.ENTER}`}>
          <OscillatorControls />
          <EnvelopeControls />
          <FilterControls />
        </div>
      )}
    </section>
  )
}

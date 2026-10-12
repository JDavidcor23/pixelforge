import { QualitySamplePreview } from './QualitySamplePreview'
import { useQualitySelector } from './useQualitySelector.hook'
import { DISABLED_STATE, FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import type { AssetType, QualityTier } from '@/types'

const SECTION_LABEL = 'font-mono text-3xs uppercase tracking-wider text-subtle'

interface QualitySelectorProps {
  readonly assetType: AssetType
  readonly value: QualityTier
  readonly onChange: (id: QualityTier) => void
  readonly disabled: boolean
}

export const QualitySelector = ({ assetType, value, onChange, disabled }: QualitySelectorProps) => {
  const {
    tiers,
    registerRef,
    handleKeyDown,
    compareTriggerRef,
    isCompareOpen,
    handleOpenCompare,
    handleCloseCompare,
    recommendedTier,
    recommendationHint,
  } = useQualitySelector({ assetType, onChange })

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className={SECTION_LABEL}>Quality</span>
        <button
          ref={compareTriggerRef}
          type="button"
          onClick={handleOpenCompare}
          className={`text-2xs text-subtle underline-offset-2 hover:text-accent hover:underline ${MOTION.COLORS} ${FOCUS_RING.SURFACE}`}
        >
          Compare samples
        </button>
      </div>

      <div role="radiogroup" aria-label="Generation quality" className="mt-2 grid grid-cols-3 gap-1.5">
        {tiers.map((tier, index) => {
          const isSelected = tier.id === value
          return (
            <button
              key={tier.id}
              ref={registerRef(tier.id)}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(tier.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`relative flex flex-col items-center gap-1 rounded border px-1.5 pb-1.5 pt-2.5 ${MOTION.COLORS} ${FOCUS_RING.SURFACE} ${DISABLED_STATE} ${
                isSelected
                  ? 'border-ai-ink bg-ai/20'
                  : 'border-transparent bg-hover hover:border-line-strong'
              }`}
            >
              {tier.id === recommendedTier && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm border border-ai-ink bg-raised px-1 font-mono text-3xs uppercase tracking-wider text-ai-ink">
                  Recommended
                </span>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element -- Vite SPA, no next/image available */}
              <img
                src={tier.sampleSrc}
                alt={`${tier.label} quality sample`}
                className="checker-bg image-pixelated size-12 rounded-sm border border-line-strong"
              />
              <span className={`text-2xs font-medium ${isSelected ? 'text-ink' : 'text-muted'}`}>{tier.label}</span>
              <span className="font-mono text-3xs text-subtle">${tier.priceUsd.toFixed(2)}</span>
            </button>
          )
        })}
      </div>

      <p className="text-2xs text-subtle">{recommendationHint}</p>

      {isCompareOpen && <QualitySamplePreview tiers={tiers} onClose={handleCloseCompare} />}
    </div>
  )
}

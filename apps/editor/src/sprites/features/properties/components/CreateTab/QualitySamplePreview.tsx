import { Check, ChevronLeft, ChevronRight, Copy, X } from 'lucide-react'

import { ModalPortal } from '@/components/ModalPortal/ModalPortal'
import { useQualitySamplePreview } from './useQualitySamplePreview.hook'
import { AI_QUALITY_SAMPLE_PROMPT, AI_QUALITY_SAMPLE_SEED, GAME_TEMPLATES } from '@/constants'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import { Z_INDEX } from '@/constants/z-index'
import type { QualityTierConfig } from '@/types'

interface QualitySamplePreviewProps {
  readonly tiers: readonly QualityTierConfig[]
  readonly onClose: () => void
}

/**
 * Comparison-grid tile size — always an integer multiple of the sample's
 * native 64x64 (`AI_QUALITY_SAMPLE_NATIVE_SIZE`) so nothing is ever resampled
 * off-grid: 2x on phones, stepping up to 6x on very wide screens.
 */
const TILE_SIZE = 'size-32 sm:size-48 lg:size-64 xl:size-80 2xl:size-96'
/** Same reasoning as `TILE_SIZE`, shifted up a notch for the single enlarged sample. */
const ZOOM_SIZE = 'size-48 sm:size-64 md:size-80 lg:size-96 xl:size-128'
const NAV_BUTTON = `flex size-8 shrink-0 items-center justify-center rounded-full border border-line-strong text-subtle hover:text-ink ${MOTION.COLORS} ${FOCUS_RING.RAISED}`

/** "Compare samples" dialog — comparison grid by default, click a tile to zoom it full screen. */
export const QualitySamplePreview = ({ tiers, onClose }: QualitySamplePreviewProps) => {
  const {
    closeButtonRef,
    handleKeyDown,
    handleBackdropClick,
    zoomedTier,
    handleZoomTier,
    handleCycleZoom,
    handleHeaderButtonClick,
    isCopied,
    handleCopyPrompt,
  } = useQualitySamplePreview({ tiers, onClose })

  return (
    <ModalPortal>
      <div
        onClick={handleBackdropClick}
        className={`fixed inset-0 ${Z_INDEX.MODAL} flex items-center justify-center bg-sunken/80 p-4 ${MOTION.FADE_ENTER}`}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Compare generation quality"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className={`relative max-h-[90vh] w-[min(95vw,80rem)] overflow-y-auto rounded-sm border border-line-strong bg-raised p-4 outline-none sm:p-6 ${MOTION.ENTER}`}
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleHeaderButtonClick}
            aria-label={zoomedTier ? 'Back to comparison' : 'Close'}
            className={`absolute right-3 top-3 rounded p-1 text-subtle hover:text-ink ${MOTION.COLORS} ${FOCUS_RING.RAISED}`}
          >
            <X size={16} aria-hidden />
          </button>

          {zoomedTier ? (
            <div className="flex flex-col items-center gap-3 pt-6">
              <div className="flex w-full items-center justify-center gap-3 sm:gap-6">
                <button
                  type="button"
                  onClick={() => handleCycleZoom(-1)}
                  aria-label="Previous sample"
                  className={NAV_BUTTON}
                >
                  <ChevronLeft size={16} aria-hidden />
                </button>

                {/* eslint-disable-next-line @next/next/no-img-element -- Vite SPA, no next/image available */}
                <img
                  src={zoomedTier.sampleSrc}
                  alt={`${zoomedTier.label} quality sample, enlarged`}
                  className={`checker-bg image-pixelated shrink-0 rounded-sm border border-line-strong ${ZOOM_SIZE}`}
                />

                <button
                  type="button"
                  onClick={() => handleCycleZoom(1)}
                  aria-label="Next sample"
                  className={NAV_BUTTON}
                >
                  <ChevronRight size={16} aria-hidden />
                </button>
              </div>

              <span className="text-sm font-medium text-ink">{zoomedTier.label}</span>
              <span className="text-2xs text-subtle">{zoomedTier.styleLabel}</span>
              <span className="font-mono text-3xs text-subtle">${zoomedTier.priceUsd.toFixed(2)}</span>
            </div>
          ) : (
            <>
              <h2 className="pr-8 text-sm font-semibold text-ink">Compare generation quality</h2>
              <p className="mt-1 text-2xs text-subtle">
                Same prompt, same seed ({AI_QUALITY_SAMPLE_SEED}), {GAME_TEMPLATES.platformer.label} template on —
                only the quality tier changes. Click a sample to enlarge it.
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-4 sm:gap-6">
                {tiers.map((tier) => (
                  <div key={tier.id} className="flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleZoomTier(tier.id)}
                      aria-label={`Enlarge ${tier.label} sample`}
                      className={`rounded-sm ${FOCUS_RING.RAISED}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- Vite SPA, no next/image available */}
                      <img
                        src={tier.sampleSrc}
                        alt={`${tier.label} quality sample`}
                        className={`checker-bg image-pixelated rounded-sm border border-line-strong hover:border-accent ${MOTION.COLORS} ${TILE_SIZE}`}
                      />
                    </button>
                    <span className="text-xs font-medium text-ink">{tier.label}</span>
                    <span className="text-2xs text-subtle">{tier.styleLabel}</span>
                    <span className="font-mono text-3xs text-subtle">${tier.priceUsd.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-sm border border-line-strong bg-sunken p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-3xs uppercase tracking-wider text-subtle">Prompt used</span>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className={`flex items-center gap-1 rounded px-2 py-1 text-2xs text-muted hover:bg-hover hover:text-ink ${MOTION.COLORS} ${FOCUS_RING.SURFACE}`}
                  >
                    {isCopied ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
                    {isCopied ? 'Copied' : 'Copy prompt'}
                  </button>
                </div>
                <p className="mt-2 font-mono text-xs leading-relaxed text-ink">{AI_QUALITY_SAMPLE_PROMPT}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </ModalPortal>
  )
}

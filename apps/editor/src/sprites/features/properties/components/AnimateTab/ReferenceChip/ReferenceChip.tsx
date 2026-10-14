import { ImagePlus, RefreshCw } from 'lucide-react'

import { REFERENCE_CHIP } from '../animate-tab.classes'
import { ANIMATION_REFERENCE_CHIP_PREFIX, ANIMATION_REFERENCE_CHIP_PROMPT } from '@/constants/animation'
import { MOTION } from '@/constants/motion'
import type { AnimationReference } from '@/types'

interface ReferenceChipProps {
  /** The session's locked Animate reference, or null before the user has picked one. */
  readonly reference: AnimationReference | null
  /** Always reopens the picker — picking a new one replaces the locked reference (ADR 0011). */
  readonly onOpenPicker: () => void
}

/**
 * Persistent reminder of what every "Generate Animation" click reuses this
 * session (ADR 0011) — stays visible near the Generate button, not just once.
 * Unset state reads as an AI-surface prompt (it blocks Generate); set state is
 * neutral, informative chrome with a trailing "click to change" affordance.
 */
export const ReferenceChip = ({ reference, onOpenPicker }: ReferenceChipProps) => (
  <button type="button" onClick={onOpenPicker} className={REFERENCE_CHIP(!!reference)}>
    {reference ? (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element -- Vite SPA, no next/image available */}
        <img
          src={reference.imageBase64}
          alt=""
          className="checker-bg image-pixelated size-7 shrink-0 rounded-sm border border-line-strong"
        />
        <span
          className={`min-w-0 flex-1 truncate text-xs text-ink ${reference.source.kind === 'canvas' ? 'font-mono' : ''}`}
        >
          {ANIMATION_REFERENCE_CHIP_PREFIX}
          {reference.label}
        </span>
        <RefreshCw
          size={13}
          className={`shrink-0 text-subtle group-hover:text-ai-ink ${MOTION.COLORS}`}
          aria-hidden
        />
      </>
    ) : (
      <>
        <ImagePlus size={15} className="shrink-0 text-ai-ink" aria-hidden />
        <span className="text-xs text-ai-ink">{ANIMATION_REFERENCE_CHIP_PROMPT}</span>
      </>
    )}
  </button>
)

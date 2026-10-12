import { Check } from 'lucide-react'

import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

interface AiResultCardProps {
  readonly thumbnailSrc: string
  readonly label: string
  readonly caption: string
  readonly primaryLabel: string
  readonly onPrimary: () => void
  readonly secondaryLabel: string
  readonly onSecondary: () => void
  /** True once the result was applied without the user clicking the primary action (blank canvas). */
  readonly autoApplied: boolean
  readonly autoAppliedLabel: string
}

/**
 * Shown after a successful Create > Generate / Animate result. One shape
 * reused by both tabs — only the labels and the apply action differ (see
 * `useApplyAsset.hook.ts`, the single place that knows how to decode and
 * apply an AI result).
 */
export const AiResultCard = ({
  thumbnailSrc,
  label,
  caption,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  autoApplied,
  autoAppliedLabel,
}: AiResultCardProps) => (
  <div className="flex flex-col gap-3 rounded-sm border border-line-strong bg-raised p-3">
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- Vite SPA, no next/image available */}
      <img
        src={thumbnailSrc}
        alt={label}
        title={label}
        className="checker-bg image-pixelated size-24 shrink-0 rounded-sm border border-line-strong"
      />
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-xs text-ink" title={label}>
          {label}
        </span>
        <span className="text-2xs text-subtle">{caption}</span>
      </div>
    </div>

    <div className="flex items-center gap-2">
      {autoApplied ? (
        <span className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded bg-hover text-xs font-medium text-accent">
          <Check size={14} aria-hidden />
          {autoAppliedLabel}
        </span>
      ) : (
        <button
          type="button"
          onClick={onPrimary}
          className={`flex h-8 flex-1 items-center justify-center rounded bg-accent text-xs font-semibold text-on-accent hover:bg-accent-strong ${MOTION.PRESS} ${FOCUS_RING.RAISED}`}
        >
          {primaryLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onSecondary}
        className={`flex h-8 shrink-0 items-center justify-center rounded border border-line-strong px-3 text-xs text-muted hover:text-ink ${MOTION.PRESS} ${FOCUS_RING.SURFACE}`}
      >
        {secondaryLabel}
      </button>
    </div>
  </div>
)

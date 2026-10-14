import { REFERENCE_CHIP } from '../animate-tab.classes'
import { ANIMATION_REFERENCE_CHIP_PREFIX, ANIMATION_REFERENCE_CHIP_PROMPT } from '@/constants/animation'
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
 */
export const ReferenceChip = ({ reference, onOpenPicker }: ReferenceChipProps) => (
  <button type="button" onClick={onOpenPicker} className={REFERENCE_CHIP}>
    {reference ? (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element -- Vite SPA, no next/image available */}
        <img
          src={reference.imageBase64}
          alt=""
          className="checker-bg image-pixelated size-7 shrink-0 rounded-sm border border-line-strong"
        />
        <span className="truncate text-xs text-ink">
          {ANIMATION_REFERENCE_CHIP_PREFIX}
          {reference.label}
        </span>
      </>
    ) : (
      <span className="text-xs text-subtle">{ANIMATION_REFERENCE_CHIP_PROMPT}</span>
    )}
  </button>
)

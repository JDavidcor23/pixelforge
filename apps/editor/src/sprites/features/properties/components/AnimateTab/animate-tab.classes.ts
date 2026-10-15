import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

/** Class strings shared by the Animate tab and its sections. */
export const SECTION_LABEL = 'font-mono text-3xs uppercase tracking-wider text-subtle'
/** Same secondary button as AiResultCard. */
export const SECONDARY_BUTTON = `flex h-8 shrink-0 items-center justify-center rounded border border-line-strong px-3 text-xs text-muted hover:text-ink ${MOTION.PRESS} ${FOCUS_RING.SURFACE} disabled:pointer-events-none disabled:opacity-40`
/** Destructive action that stops a running, potentially billed job (`danger` tokens, no glow per DESIGN.md). */
export const DANGER_BUTTON = `flex h-8 shrink-0 items-center gap-1.5 rounded border border-danger/40 px-3 text-xs text-danger hover:bg-danger/10 ${MOTION.PRESS} ${FOCUS_RING.SURFACE} disabled:pointer-events-none disabled:opacity-40`
/**
 * The persistent reference chip (ADR 0011) — always visible near the Generate button, opens the picker.
 * Unset reads as an AI-surface call-to-action (`ai` tokens, same as the selected Frames chip below);
 * set is informative, neutral chrome with a "click to change" affordance.
 */
export const REFERENCE_CHIP = (hasReference: boolean) =>
  `group flex h-10 w-full items-center gap-2 rounded-sm border bg-sunken px-2 text-left ${MOTION.COLORS} ${FOCUS_RING.SURFACE} ${
    hasReference ? 'border-line-strong hover:border-accent/60' : 'border-ai/40 hover:border-ai/60'
  }`
/** One pickable tile in the reference picker's Canvas/Assets grid. */
export const REFERENCE_PICKER_TILE = `checker-bg relative size-16 shrink-0 overflow-hidden rounded-sm border border-line-strong hover:border-accent/60 ${MOTION.PRESS} ${FOCUS_RING.SURFACE}`
/** Caption strip overlaid on a reference picker tile, surfacing its `label` (canvas frame index or asset name). */
export const REFERENCE_PICKER_TILE_CAPTION =
  'absolute inset-x-0 bottom-0 truncate bg-sunken/80 px-1 py-0.5 text-center text-3xs text-ink'

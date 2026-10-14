import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

/** Class strings shared by the Animate tab and its sections. */
export const SECTION_LABEL = 'font-mono text-3xs uppercase tracking-wider text-subtle'
/** Same secondary button as AiResultCard. */
export const SECONDARY_BUTTON = `flex h-8 shrink-0 items-center justify-center rounded border border-line-strong px-3 text-xs text-muted hover:text-ink ${MOTION.PRESS} ${FOCUS_RING.SURFACE} disabled:pointer-events-none disabled:opacity-40`
/** The persistent reference chip (ADR 0011) — always visible near the Generate button, opens the picker. */
export const REFERENCE_CHIP = `flex h-10 w-full items-center gap-2 rounded-sm border border-line-strong bg-sunken px-2 text-left hover:border-accent/60 ${MOTION.COLORS} ${FOCUS_RING.SURFACE}`
/** One pickable tile in the reference picker's Canvas/Assets grid. */
export const REFERENCE_PICKER_TILE = `checker-bg relative size-16 shrink-0 overflow-hidden rounded-sm border border-line-strong hover:border-accent/60 ${MOTION.PRESS} ${FOCUS_RING.SURFACE}`

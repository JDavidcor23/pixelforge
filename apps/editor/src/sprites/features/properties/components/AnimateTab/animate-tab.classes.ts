import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

/** Class strings shared by the Animate tab and its sections. */
export const SECTION_LABEL = 'font-mono text-3xs uppercase tracking-wider text-subtle'
/** Same secondary button as AiResultCard. */
export const SECONDARY_BUTTON = `flex h-8 shrink-0 items-center justify-center rounded border border-line-strong px-3 text-xs text-muted hover:text-ink ${MOTION.PRESS} ${FOCUS_RING.SURFACE} disabled:pointer-events-none disabled:opacity-40`

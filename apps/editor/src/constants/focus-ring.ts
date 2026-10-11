/**
 * Shared keyboard focus rings (DESIGN: accent ring, offset matches the surface
 * the control sits on so the gap reads as "cut out" of that surface).
 */
export const FOCUS_RING = {
  SURFACE:
    'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
  RAISED:
    'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-raised',
  /** AI-primary buttons ring in violet ink instead of the accent. */
  RAISED_AI:
    'outline-none focus-visible:ring-2 focus-visible:ring-ai-ink focus-visible:ring-offset-2 focus-visible:ring-offset-raised',
  BASE:
    'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base',
  /** Ring sits inside the element — for full-bleed rows that touch an edge. */
  INSET: 'outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent',
  /** Outline-based ring for elements that already draw a box-shadow ring of their own (selected timeline clips). */
  OUTLINE:
    'outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-accent',
  INPUT: 'outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30',
} as const

export const DISABLED_STATE = 'disabled:pointer-events-none disabled:opacity-40'

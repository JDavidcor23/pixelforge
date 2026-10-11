/**
 * Shared motion recipes (Tailwind classes). Only transform/opacity/color move;
 * reduced-motion users keep the fades and colour changes but lose movement.
 */
export const MOTION = {
  /** Press feedback on deliberate buttons and tiles (not on list rows). */
  PRESS: 'transition duration-150 ease-out-strong motion-safe:active:scale-97',
  /** Mount entrance for content that would otherwise appear out of nowhere. */
  ENTER:
    'transition duration-200 ease-out-strong starting:-translate-y-1 starting:opacity-0 motion-reduce:starting:translate-y-0',
  /** Popover grows from its trigger (top-left anchor). */
  POPOVER_ENTER:
    'origin-top-left transition duration-200 ease-out-strong starting:-translate-y-1 starting:scale-97 starting:opacity-0 motion-reduce:starting:translate-y-0 motion-reduce:starting:scale-100',
  /** Opacity-only entrance (modal scrims) — no movement, so no reduced-motion variant. */
  FADE_ENTER: 'transition-opacity duration-200 ease-out-strong starting:opacity-0',
  /** State colour changes (e.g. hover tints). */
  COLORS: 'transition-colors duration-150 ease-out-strong',
  /** Hover/focus reveal of secondary row actions: opacity + colour, no movement. */
  REVEAL: 'transition-[opacity,color,background-color] duration-150 ease-out-strong',
} as const

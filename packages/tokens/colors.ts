/**
 * Literal mirror of the design token contract defined in `packages/tokens/tokens.css`.
 *
 * CSS custom properties are the source of truth. This file exists only because
 * canvas APIs (Konva, 2D context) cannot resolve `var(--pf-*)` — they need real
 * color strings. Any change here MUST be mirrored in `tokens.css`, and vice
 * versa (see `colors.test.ts` for the parity check).
 *
 * In React components, use the Tailwind utilities (`bg-surface`, `text-muted`,
 * `border-line`, ...) instead of importing from here.
 */
export const COLORS = {
  /** Four-step dark ladder. Blue-tinted neutral, never violet-tinted. */
  SURFACE: {
    BASE: '#0a0c10',
    SURFACE: '#0f1115',
    RAISED: '#121419',
    HOVER: '#171a21',
  },

  LINE: {
    DEFAULT: 'rgba(255,255,255,0.06)',
    STRONG: 'rgba(255,255,255,0.12)',
  },

  TEXT: {
    INK: '#ededed',
    MUTED: '#a1a1aa',
    SUBTLE: '#71717a',
  },

  ACCENT: {
    DEFAULT: '#00fbfb',
    STRONG: '#00d4db',
  },

  /** Violet is reserved for AI-assisted surfaces and nothing else. */
  AI: '#7c3aed',
  /** Light violet for AI marks/links on dark surfaces. */
  AI_INK: {
    DEFAULT: '#a78bfa',
    STRONG: '#c4b5fd',
  },
  /** Text and icons on solid accent fills. */
  ON_ACCENT: '#000000',
  SUCCESS: '#10b981',
  DANGER: '#ff4d4d',

  /** Chrome drawn onto the sprite canvas itself. */
  CANVAS: {
    GRID_LINE: '#171a21',
    CHECKER_A: '#1a1d24',
    CHECKER_B: '#14171d',
  },
} as const

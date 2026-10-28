import { COLORS } from '@pixelforge/tokens/colors'

/** Phaser preview on `/build` (ADR 0014). Logical resolution; the canvas scales to fit its container. */
export const BUILD_GAME = {
  WIDTH: 640,
  HEIGHT: 360,
  BACKGROUND: COLORS.SURFACE.BASE,
} as const

/**
 * Phase 1 placeholder scene: one bouncing block so pause, restart and FPS are
 * observable before the hand-made level of phase 2 replaces it.
 */
export const PREVIEW_SCENE = {
  KEY: 'preview',
  BLOCK_SIZE: 24,
  BLOCK_COLOR: COLORS.ACCENT.DEFAULT,
  /** Pixels per second on each axis. */
  BLOCK_SPEED: 180,
} as const

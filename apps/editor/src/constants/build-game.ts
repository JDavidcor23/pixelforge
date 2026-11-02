import { COLORS } from '@pixelforge/tokens/colors'

/** Phaser preview on `/build` (ADR 0014). Logical resolution; the canvas scales to fit its container. */
export const BUILD_GAME = {
  WIDTH: 640,
  HEIGHT: 360,
  BACKGROUND: COLORS.SURFACE.BASE,
} as const

/** Hand-made level files (`public/levels/*.json`), see `parseLevel`. */
export const LEVEL_FORMAT = {
  VERSION: 1,
  /** The level the build screen loads on open (phase 2: one hand-made level). */
  DEFAULT_URL: '/levels/level-1.json',
} as const

/** The level scene (phase 2). Sizes in px; colors from the design tokens. */
export const LEVEL_SCENE = {
  KEY: 'level',
  PLAYER_WIDTH: 14,
  PLAYER_HEIGHT: 22,
  PLAYER_COLOR: COLORS.ACCENT.DEFAULT,
  PLATFORM_COLOR: COLORS.TEXT.SUBTLE,
  HAZARD_COLOR: COLORS.DANGER,
  GOAL_COLOR: COLORS.SUCCESS,
  MESSAGE_COLOR: COLORS.TEXT.INK,
  MESSAGE_FONT: '16px Geist, sans-serif',
  COMPLETE_MESSAGE: 'Level complete',
  /** Pause between dying and respawning, so the death reads before the restart. */
  RESPAWN_DELAY_MS: 400,
  /** Downward pull in px/s²; the jump height is JUMP_VELOCITY² / (2 · GRAVITY) ≈ 74 px. */
  GRAVITY: 1200,
  MAX_FALL_SPEED: 600,
} as const

/** Run and jump feel (see `createPlatformerController`). */
export const PLATFORMER = {
  RUN_SPEED: 180,
  GROUND_ACCELERATION: 1800,
  AIR_ACCELERATION: 1100,
  JUMP_VELOCITY: 420,
  JUMP_CUT_FACTOR: 0.45,
  COYOTE_MS: 100,
  JUMP_BUFFER_MS: 120,
} as const

/** Keys the level scene reads. Not captured, so typing in the chat panel keeps working. */
export const LEVEL_KEYS = {
  LEFT: ['LEFT', 'A'],
  RIGHT: ['RIGHT', 'D'],
  JUMP: ['UP', 'W', 'SPACE'],
} as const

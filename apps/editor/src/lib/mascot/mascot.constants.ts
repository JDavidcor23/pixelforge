import { COLORS } from '@pixelforge/tokens/colors'

import type { MascotPose } from '@/types'

/**
 * Pixel-art palette for the login-page mascot scene (editor-auth change).
 * This is character/scene ILLUSTRATION art, not UI chrome — `DESIGN.md`'s
 * token contract covers app surfaces, not a hand-drawn cutscene. `BODY` and
 * `BLASTER` alias the real accent token (the mascot's jumpsuit and blaster
 * bolt ARE the brand color); the rest are one-off pixel-art hues reproduced
 * from the owner's original mascot reference code and intentionally kept few.
 */
export const MASCOT_COLORS = {
  HEAD: '#ececec',
  EYE: '#000000',
  EYE_BLINK: '#7a7a7a',
  BODY: COLORS.ACCENT.DEFAULT,
  ARM: '#d9d9d9',
  BLASTER: COLORS.ACCENT.DEFAULT,
  BLASTER_TIP: '#ececec',
  BOLT: COLORS.ACCENT.DEFAULT,
  MUZZLE_FLASH: '#ececec',
  HIT_FLASH: '#ececec',
  ENEMY_BODY: '#f74c00',
  /** The ground enemy's own bolt and its burst particles — same warm hue as its body. */
  ENEMY_BOLT: '#f74c00',
  /** Bright, reads against the warm body — same bright token used for hit flashes. */
  ENEMY_EYE: '#ececec',
  /** The flying drone reads as metal, not a warm creature — same family as the mascot's arms. */
  ENEMY_BODY_AIR: COLORS.TEXT.MUTED,
  /** Blinking threat-light under the drone. */
  ENEMY_EYE_AIR: COLORS.DANGER,
  ENEMY_OUTLINE: '#1a1006',
  PARTICLE: '#f74c00',
  /** `TEXT.SUBTLE`, not a `SURFACE` step — the platform needs to read against the dark background, not blend into it. */
  PLATFORM: COLORS.TEXT.SUBTLE,
  PLATFORM_EDGE: COLORS.ACCENT.DEFAULT,
  /** "PIXELFORGE" — cyan with a soft glow (see `drawGlyphText`'s shadow pass). */
  GLYPH: COLORS.ACCENT.DEFAULT,
  /** "AI" — plain ink, no cyan, so it reads as a quiet subtitle under the wordmark. */
  GLYPH_SUBTITLE: COLORS.TEXT.INK,
  /** Far city layer — barely above the background, a silhouette more than a building. */
  CITY_FAR: COLORS.SURFACE.SURFACE,
  /** Near city layer — one step brighter, for parallax depth. */
  CITY_NEAR: COLORS.SURFACE.HOVER,
  /** Dim cyan — `ACCENT.DEFAULT` at low alpha, baked in since `PixelWriter.fillRect` takes a flat color. */
  WINDOW_LIT_FAR: 'rgba(0,251,251,0.22)',
  WINDOW_LIT_NEAR: 'rgba(0,251,251,0.32)',
  PLANE_BODY: COLORS.TEXT.SUBTLE,
  PLANE_TRAIL: 'rgba(0,251,251,0.18)',
  PLANE_LIGHT: COLORS.DANGER,
  GEOMETRY: COLORS.LINE.STRONG,
} as const

/** The mascot is drawn on a 16x16 native grid, then upscaled. */
export const MASCOT_SPRITE_SIZE = 16

/**
 * Leg rects per pose: `[x, y, length]`, each drawn 2px wide — the owner's
 * reference run-cycle table, reproduced 1:1, plus a `crouch` pose (bent
 * knees, feet still on `y + length = 16`, so the ground anchor holds) for
 * dodging enemy bolts. `y + length` is each leg's feet bottom edge; the
 * tallest of the two is the pose's ground-contact point (see
 * `mascot-scene-state.test.ts`).
 */
export const MASCOT_LEGS: Readonly<Record<MascotPose, readonly (readonly [number, number, number])[]>> = {
  idle: [
    [6, 13, 3],
    [9, 13, 3],
  ],
  run0: [
    [5, 13, 3],
    [10, 13, 2],
  ],
  run1: [
    [6, 13, 3],
    [9, 13, 3],
  ],
  run2: [
    [5, 13, 2],
    [10, 13, 3],
  ],
  run3: [
    [6, 13, 3],
    [9, 13, 3],
  ],
  jump: [
    [5, 13, 2],
    [10, 13, 2],
  ],
  crouch: [
    [6, 14, 2],
    [9, 14, 2],
  ],
}

/** Arm vertical offsets `[left, right]` added to the pose's own arm base y (`crouch` sits 1px lower, see `mascot-sprite.ts`). The right arm (x=11) is the mascot's front/gun hand, since it always faces right in this scene. */
export const MASCOT_ARMS: Readonly<Record<MascotPose, readonly [number, number]>> = {
  idle: [0, 0],
  run0: [1, 0],
  run1: [0, 0],
  run2: [0, 1],
  run3: [0, 0],
  jump: [-2, -2],
  crouch: [1, 1],
}

/** Poses that get a 1px vertical bob, synced to the run cycle. */
export const MASCOT_RUN_BOB_POSES: readonly MascotPose[] = ['run1', 'run3']

/**
 * How much a `crouch` shrinks the mascot's hurtbox from the top — only the
 * lower body/legs (`MASCOT_SPRITE_SIZE - CROUCH_HURTBOX_TOP_OFFSET_PX` tall)
 * remain hittable. Enemy bolts are aimed at a fixed height chosen so they
 * clear this shrunken box by `DODGE_CLEARANCE_PX` — see
 * `computeMascotHurtbox` and `mascot-bolt-safety.test.ts`.
 */
export const CROUCH_HURTBOX_TOP_OFFSET_PX = 9
/** Minimum vertical gap an enemy bolt must keep from the mascot's (possibly dodging) hurtbox, enforced by `mascot-bolt-safety.test.ts`. */
export const DODGE_CLEARANCE_PX = 2

export const MASCOT_ANIMATION = {
  FPS: 12,
  FRAME_DURATION_MS: 1000 / 12,
  BLINK_INTERVAL_MS: 3500,
  BLINK_DURATION_MS: 120,
  RUN_CYCLE_MS: 400,
  RUN_BOB_PX: 1,
  /** Frames the hit enemy freezes (white flash) before bursting — the "hit-stop" that sells a kill. */
  HIT_STOP_FRAMES: 2,
} as const

/**
 * Native (pre-upscale) pixel-art canvas the whole scene is drawn on. Kept
 * small on purpose: `useMascotScene.hook.ts` upscales by an INTEGER factor
 * to fill most of the login page's mascot column, so the mascot reads as
 * the hero rather than a UI icon.
 */
export const MASCOT_SCENE_SIZE = { WIDTH: 128, HEIGHT: 64 } as const

/** Ground y — the mascot's feet and the ground enemy stand here. */
export const GROUND_Y = 52

/** The mascot's resting x while fighting the ground enemy. */
export const STOP_X = 36

/**
 * Raised platform the mascot jumps onto for the air fight — part of the
 * level from frame one of the loop, drawn for the whole run-in..run-out span
 * (see `MASCOT_TIMELINE`'s doc comment and `levelWipeY` in
 * `mascot-scene-state.ts`), not something that spawns in.
 */
export const PLATFORM = {
  X: 86,
  WIDTH: 30,
  HEIGHT: 4,
  /** How much higher than the ground the platform top sits. */
  RISE: 20,
} as const
export const PLATFORM_Y = GROUND_Y - PLATFORM.RISE
/** Where the mascot stands once it lands on the platform. */
export const PLATFORM_STOP_X = PLATFORM.X + 8
/** Where the mascot lands once it jumps back down, past the platform's right edge — never under it. */
export const JUMP_DOWN_LANDING_X = PLATFORM.X + PLATFORM.WIDTH + 4

/** Ground enemy's feet sit on the ground line, same as the mascot's. */
export const GROUND_ENEMY = { X: 72, WIDTH: 8, HEIGHT: 6, Y: GROUND_Y - 6 } as const

/** Flying drone — hovers well above the platform, so the mascot has to aim up at it. Idling there from the start of the loop, not spawning mid-scene. */
const AIR_ENEMY_HOVER_ABOVE_PLATFORM_PX = 20
export const AIR_ENEMY = {
  X: PLATFORM_STOP_X + 26,
  WIDTH: 8,
  HEIGHT: 6,
  Y: PLATFORM_Y - AIR_ENEMY_HOVER_ABOVE_PLATFORM_PX,
  BOB_PX: 1,
} as const

/** Both enemies get knocked back, away from the mascot, on the hit frame. */
export const ENEMY_KNOCKBACK_PX = 2

/** Fixed (deterministic, not random) particle burst template — angle/speed pairs reused for every enemy death so the scene stays pure and testable. */
export const PARTICLE_BURST: readonly (readonly [number, number])[] = [
  [-2, -3],
  [-1, -3],
  [0, -4],
  [1, -3],
  [2, -3],
  [-2, -1],
  [2, -1],
  [0, -2],
]
export const PARTICLE_BURST_DURATION_MS = 400
export const PARTICLE_GRAVITY = 10
/** Scales `PARTICLE_BURST`'s unit velocities into actual px travelled by the time `burstProgress` reaches 1. */
export const PARTICLE_SPREAD_PX = 3

/**
 * Timeline phase boundaries, in ms, for one loop of the cutscene — see
 * `mascot-scene-state.ts`. Both enemies fight back: each fires one bolt that
 * flies in a straight line, at a FIXED height, past the mascot's x and off
 * the scene edge (never stopping to "hit" it) — the mascot dodges by
 * crouching under the ground bolt or hopping over the platform bolt, with
 * `DODGE_CLEARANCE_PX` of guaranteed clearance (`mascot-bolt-safety.test.ts`
 * sweeps the whole loop to prove it), THEN shoots back and kills the enemy.
 */
export const MASCOT_TIMELINE = {
  RUN_IN_END_MS: 1800,

  GROUND_ENEMY_BOLT_SHOOT_MS: 2000,
  GROUND_ENEMY_BOLT_GONE_MS: 2400,
  GROUND_CROUCH_START_MS: 2000,
  GROUND_CROUCH_END_MS: 2280,
  GROUND_PLAYER_SHOOT_MS: 2450,
  GROUND_PLAYER_HIT_MS: 2600,
  GROUND_FIGHT_END_MS: 3350,

  JUMP_END_MS: 4350,

  AIR_ENEMY_BOLT_SHOOT_MS: 4900,
  AIR_ENEMY_BOLT_GONE_MS: 5300,
  AIR_DODGE_START_MS: 4800,
  AIR_DODGE_RISE_END_MS: 4900,
  AIR_DODGE_HOLD_END_MS: 5050,
  AIR_DODGE_END_MS: 5150,
  AIR_AIM_MS: 5300,
  AIR_PLAYER_SHOOT_MS: 5450,
  AIR_PLAYER_HIT_MS: 5600,
  AIR_FIGHT_END_MS: 6350,

  JUMP_DOWN_END_MS: 7350,
  RUN_OUT_END_MS: 8750,

  /** The whole level (platform, city, enemies-if-any) dissolves away over this window, before the title reveals. */
  DISSOLVE_END_MS: 9250,

  TITLE_HOLD_END_MS: 11850,
  TITLE_FADE_END_MS: 12450,
  /** The level scanline-wipes back in over this window, finishing right as the loop restarts. */
  LEVEL_FADE_IN_END_MS: 12950,
  LOOP_DURATION_MS: 13150,
} as const

/** Ground enemy bolt's fixed travel height — inside the mascot's STANDING hurtbox (chest/head band), but `DODGE_CLEARANCE_PX` clear of its CROUCHING one. */
export const GROUND_BOLT_Y_OFFSET = 4
/** Platform enemy bolt's fixed travel height — near the mascot's STANDING feet, but clear of it once hopped (`DODGE_HOP_HEIGHT_PX`). */
export const AIR_BOLT_Y_OFFSET = 15
/** How far past the mascot, off-screen, every enemy bolt keeps flying — it never stops "at" the mascot. */
export const ENEMY_BOLT_OFFSCREEN_X = -10
/** Dodge hop height during the platform bolt-dodge — held at full height through `AIR_DODGE_RISE_END_MS`-`AIR_DODGE_HOLD_END_MS` (a plateau, not just a sine peak), so clearance holds for the bolt's whole crossing window. */
export const DODGE_HOP_HEIGHT_PX = 5
/** Vertical arc height (above the straight-line lerp) the mascot gains mid-jump (up onto the platform, or back down). */
export const JUMP_ARC_HEIGHT_PX = 6
/** 1-frame dip into the ground/deck on a hard landing — the "squash" impact. */
export const SQUASH_OFFSET_PX = 1

/** Pixel glyph font: 5x7 bitmaps for the letters in "PIXELFORGE" and "AI", each row a 5-bit string (`'1'` = lit). */
export const GLYPH_FONT: Readonly<Record<string, readonly string[]>> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
} as const

export const GLYPH_SIZE = { WIDTH: 5, HEIGHT: 7 } as const
export const GLYPH_SPACING = 2
export const TITLE_TEXT = 'PIXELFORGE'
/** Drops in below "PIXELFORGE", after it has finished dropping in. */
export const SUBTITLE_TEXT = 'AI'
export const SUBTITLE_LINE_GAP_PX = 4
export const SUBTITLE_START_GAP_MS = 150
export const TITLE_LETTER_DROP_STAGGER_MS = 100
export const TITLE_LETTER_DROP_DURATION_MS = 260
/** How far above its resting baseline each letter starts its drop-in fall. */
export const TITLE_DROP_FROM_PX = 10
/** Roughly vertically centered in `MASCOT_SCENE_SIZE.HEIGHT`, with room below for the "AI" line. */
export const TITLE_BASELINE_Y = 24
export const SUBTITLE_BASELINE_Y = TITLE_BASELINE_Y + GLYPH_SIZE.HEIGHT + SUBTITLE_LINE_GAP_PX

/** Living background: a 2-layer parallax city, an occasional airplane, and a few drifting geometry shapes — kept low-contrast (`CITY_FAR`/`CITY_NEAR`/dim-cyan windows) so the fight stays the focus. */
export const CITY = {
  FAR_TILE: 40,
  FAR_SCROLL_PX_PER_SEC: 2,
  NEAR_TILE: 48,
  NEAR_SCROLL_PX_PER_SEC: 6,
  /** How often, per window, its lit/unlit state re-rolls (seeded, not time-based animation — see `isWindowLit`). */
  WINDOW_BLINK_BUCKET_MS: 900,
  /** One plane crosses per cycle, then the sky is empty for the rest of it — guarantees at most one on screen. */
  PLANE_CYCLE_MS: 9500,
  PLANE_CROSS_DURATION_MS: 4500,
  PLANE_BLINK_MS: 400,
} as const

/** `[xOffset, width, height]` within one repeating tile, feet resting on `GROUND_Y`. */
export const CITY_FAR_BUILDINGS: readonly (readonly [number, number, number])[] = [
  [0, 8, 12],
  [12, 6, 8],
  [22, 7, 15],
]
export const CITY_NEAR_BUILDINGS: readonly (readonly [number, number, number])[] = [
  [2, 10, 18],
  [16, 8, 13],
  [30, 12, 20],
]

/** `[xBase, yBase, seed]` — a handful of small shapes drifting (sine/cosine) and cycling through `GEOMETRY_SHAPES`' 3 "rotation" frames. */
export const CITY_GEOMETRY: readonly (readonly [number, number, number])[] = [
  [20, 10, 1],
  [64, 6, 2],
  [104, 14, 3],
]

import type { BlasterBoltState, EnemyState, MascotHurtbox, MascotPose, MascotScenePhase, MascotSceneState, TitleLetterState } from '@/types'
import { measureGlyphText } from './mascot-font'
import {
  AIR_BOLT_Y_OFFSET,
  AIR_ENEMY,
  CROUCH_HURTBOX_TOP_OFFSET_PX,
  DODGE_HOP_HEIGHT_PX,
  ENEMY_BOLT_OFFSCREEN_X,
  ENEMY_KNOCKBACK_PX,
  GLYPH_SIZE,
  GLYPH_SPACING,
  GROUND_BOLT_Y_OFFSET,
  GROUND_ENEMY,
  GROUND_Y,
  JUMP_ARC_HEIGHT_PX,
  JUMP_DOWN_LANDING_X,
  MASCOT_ANIMATION,
  MASCOT_RUN_BOB_POSES,
  MASCOT_SCENE_SIZE,
  MASCOT_SPRITE_SIZE,
  MASCOT_TIMELINE,
  PARTICLE_BURST_DURATION_MS,
  PLATFORM_STOP_X,
  PLATFORM_Y,
  STOP_X,
  SUBTITLE_START_GAP_MS,
  SUBTITLE_TEXT,
  TITLE_DROP_FROM_PX,
  TITLE_LETTER_DROP_DURATION_MS,
  TITLE_LETTER_DROP_STAGGER_MS,
  TITLE_TEXT,
} from './mascot.constants'

const { WIDTH: SCENE_WIDTH, HEIGHT: SCENE_HEIGHT } = MASCOT_SCENE_SIZE
const GROUND_STAND_Y = GROUND_Y - MASCOT_SPRITE_SIZE
const PLATFORM_STAND_Y = PLATFORM_Y - MASCOT_SPRITE_SIZE
const RUN_CYCLE_POSES: readonly MascotPose[] = ['run0', 'run1', 'run2', 'run3']
const OFFSCREEN_X = SCENE_WIDTH + 40

// Both enemy bolts travel in a dead-straight horizontal line, at a fixed height chosen to clear the mascot's
// (dodging) hurtbox, from the enemy's gun past the mascot's x and off the opposite edge — never stopping "at" the
// mascot. See `GROUND_BOLT_Y_OFFSET`/`AIR_BOLT_Y_OFFSET`'s doc comments and `mascot-bolt-safety.test.ts`.
const GROUND_BOLT_Y = GROUND_STAND_Y + GROUND_BOLT_Y_OFFSET
const GROUND_BOLT_FROM: readonly [number, number] = [GROUND_ENEMY.X, GROUND_BOLT_Y]
const GROUND_BOLT_TO: readonly [number, number] = [ENEMY_BOLT_OFFSCREEN_X, GROUND_BOLT_Y]

const AIR_BOLT_Y = PLATFORM_STAND_Y + AIR_BOLT_Y_OFFSET
const AIR_BOLT_FROM: readonly [number, number] = [AIR_ENEMY.X, AIR_BOLT_Y]
const AIR_BOLT_TO: readonly [number, number] = [ENEMY_BOLT_OFFSCREEN_X, AIR_BOLT_Y]

// The mascot's own return fire still aims at the enemy directly — it's the kill shot, not something to dodge.
const GROUND_MASCOT_GUN_TIP: readonly [number, number] = [STOP_X + MASCOT_SPRITE_SIZE, GROUND_STAND_Y + 9]
const GROUND_ENEMY_CENTER: readonly [number, number] = [GROUND_ENEMY.X + GROUND_ENEMY.WIDTH / 2, GROUND_ENEMY.Y + GROUND_ENEMY.HEIGHT / 2]
const AIR_MASCOT_GUN_TIP_UP: readonly [number, number] = [PLATFORM_STOP_X + 15, PLATFORM_STAND_Y + 6]
const AIR_ENEMY_CENTER: readonly [number, number] = [AIR_ENEMY.X + AIR_ENEMY.WIDTH / 2, AIR_ENEMY.Y + AIR_ENEMY.HEIGHT / 2]

const TITLE_START_X = Math.round((SCENE_WIDTH - measureGlyphText(TITLE_TEXT)) / 2)
const SUBTITLE_START_X = Math.round((SCENE_WIDTH - measureGlyphText(SUBTITLE_TEXT)) / 2)
const SUBTITLE_BASE_DELAY_MS = (TITLE_TEXT.length - 1) * TITLE_LETTER_DROP_STAGGER_MS + TITLE_LETTER_DROP_DURATION_MS + SUBTITLE_START_GAP_MS

const lerp = (from: number, to: number, t: number): number => from + (to - from) * t
const clamp01 = (t: number): number => Math.min(1, Math.max(0, t))

/** The mascot's hit-detection box for the enemy-bolt-dodge safety check — shrinks from the top when `crouch`ing (only legs stay hittable), otherwise the full 16x16 sprite, wherever it currently is (jump dodge moves it via `mascotY`). */
export function computeMascotHurtbox(pose: MascotPose, mascotX: number, mascotY: number): MascotHurtbox {
  if (pose === 'crouch') {
    return { x: mascotX, y: mascotY + CROUCH_HURTBOX_TOP_OFFSET_PX, w: MASCOT_SPRITE_SIZE, h: MASCOT_SPRITE_SIZE - CROUCH_HURTBOX_TOP_OFFSET_PX }
  }
  return { x: mascotX, y: mascotY, w: MASCOT_SPRITE_SIZE, h: MASCOT_SPRITE_SIZE }
}

/** Picks the run-cycle pose from elapsed time within a running phase (12fps-independent, loops every `RUN_CYCLE_MS`). */
function runPose(elapsedMs: number): MascotPose {
  const cyclePos = (elapsedMs % MASCOT_ANIMATION.RUN_CYCLE_MS) / MASCOT_ANIMATION.RUN_CYCLE_MS
  const index = Math.floor(cyclePos * RUN_CYCLE_POSES.length)
  return RUN_CYCLE_POSES[Math.min(index, RUN_CYCLE_POSES.length - 1)]
}

function runBob(pose: MascotPose): number {
  return MASCOT_RUN_BOB_POSES.includes(pose) ? -MASCOT_ANIMATION.RUN_BOB_PX : 0
}

/**
 * The platform bolt dodge is a trapezoid, not a sine peak: it rises to full
 * hop height, HOLDS there for a plateau, then falls — so clearance stays
 * maximal for the bolt's whole crossing window instead of just an instant.
 */
function computeAirDodgeOffset(elapsedMs: number): number {
  const { AIR_DODGE_START_MS, AIR_DODGE_RISE_END_MS, AIR_DODGE_HOLD_END_MS, AIR_DODGE_END_MS } = MASCOT_TIMELINE
  if (elapsedMs < AIR_DODGE_START_MS || elapsedMs >= AIR_DODGE_END_MS) return 0
  if (elapsedMs < AIR_DODGE_RISE_END_MS) {
    const t = (elapsedMs - AIR_DODGE_START_MS) / (AIR_DODGE_RISE_END_MS - AIR_DODGE_START_MS)
    return -DODGE_HOP_HEIGHT_PX * t
  }
  if (elapsedMs < AIR_DODGE_HOLD_END_MS) return -DODGE_HOP_HEIGHT_PX
  const t = (elapsedMs - AIR_DODGE_HOLD_END_MS) / (AIR_DODGE_END_MS - AIR_DODGE_HOLD_END_MS)
  return -DODGE_HOP_HEIGHT_PX * (1 - t)
}

/**
 * How much of the scene (measured from the top) is still drawn — the rest
 * is clipped, for a scanline-wipe dissolve/reveal. `SCENE_HEIGHT` = level
 * fully drawn; `0` = fully dissolved (just the title card, over the page's
 * own grid/glow). Sweeps closed right after `RUN_OUT_END_MS`, stays closed
 * through the title card, then sweeps back open before the loop restarts.
 */
function computeLevelWipeY(elapsedMs: number): number {
  const { RUN_OUT_END_MS, DISSOLVE_END_MS, TITLE_FADE_END_MS, LEVEL_FADE_IN_END_MS } = MASCOT_TIMELINE
  if (elapsedMs < RUN_OUT_END_MS) return SCENE_HEIGHT
  if (elapsedMs < DISSOLVE_END_MS) {
    const t = clamp01((elapsedMs - RUN_OUT_END_MS) / (DISSOLVE_END_MS - RUN_OUT_END_MS))
    return Math.round(SCENE_HEIGHT * (1 - t))
  }
  if (elapsedMs < TITLE_FADE_END_MS) return 0
  if (elapsedMs < LEVEL_FADE_IN_END_MS) {
    const t = clamp01((elapsedMs - TITLE_FADE_END_MS) / (LEVEL_FADE_IN_END_MS - TITLE_FADE_END_MS))
    return Math.round(SCENE_HEIGHT * t)
  }
  return SCENE_HEIGHT
}

/**
 * One enemy's hit -> burst -> gone lifecycle, relative to its own hit
 * timestamp. Both enemies are alive from `elapsedMs = 0` (the platform and
 * the drone waiting on it are level geometry, not something that spawns —
 * see `MASCOT_TIMELINE`'s doc comment), and stay `'gone'` for the rest of
 * the loop once killed.
 */
function computeEnemy(kind: EnemyState['kind'], x: number, y: number, hitMs: number, elapsedMs: number, knockbackPx: number): EnemyState {
  if (elapsedMs < hitMs) return { kind, x, y, lifecycle: 'alive', burstProgress: 0 }
  const burstStart = hitMs + MASCOT_ANIMATION.HIT_STOP_FRAMES * MASCOT_ANIMATION.FRAME_DURATION_MS
  if (elapsedMs < burstStart) return { kind, x: x + knockbackPx, y, lifecycle: 'hit', burstProgress: 0 }
  const burstEnd = burstStart + PARTICLE_BURST_DURATION_MS
  if (elapsedMs < burstEnd) {
    return { kind, x: x + knockbackPx, y, lifecycle: 'bursting', burstProgress: clamp01((elapsedMs - burstStart) / PARTICLE_BURST_DURATION_MS) }
  }
  return { kind, x, y, lifecycle: 'gone', burstProgress: 1 }
}

function computeBolt(
  shootMs: number,
  goneMs: number,
  elapsedMs: number,
  from: readonly [number, number],
  to: readonly [number, number],
): BlasterBoltState {
  if (elapsedMs < shootMs || elapsedMs >= goneMs) {
    return { visible: false, x: from[0], y: from[1], muzzleFlash: false }
  }
  const t = clamp01((elapsedMs - shootMs) / (goneMs - shootMs))
  return {
    visible: true,
    x: lerp(from[0], to[0], t),
    y: lerp(from[1], to[1], t),
    muzzleFlash: elapsedMs - shootMs < MASCOT_ANIMATION.FRAME_DURATION_MS,
  }
}

/** Ease-out-back: overshoots past 1 before settling — the title letters' drop-in bounce. */
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  const p = t - 1
  return 1 + c3 * p * p * p + c1 * p * p
}

/** One line of letters (used for both "PIXELFORGE" and "AI"): each drops in at `baseDelayMs + index * stagger`, then all of them hold and fade together at the shared `holdEndMs`/`fadeEndMs` boundaries. */
function computeTitleLine(text: string, startX: number, titleElapsedMs: number, baseDelayMs: number, holdEndMs: number, fadeEndMs: number): readonly TitleLetterState[] {
  return text.split('').map((char, index) => {
    const x = startX + index * (GLYPH_SIZE.WIDTH + GLYPH_SPACING)
    const revealElapsedMs = titleElapsedMs - (baseDelayMs + index * TITLE_LETTER_DROP_STAGGER_MS)

    if (revealElapsedMs < 0) return { char, x, yOffset: -TITLE_DROP_FROM_PX, opacity: 0 }

    if (revealElapsedMs < TITLE_LETTER_DROP_DURATION_MS) {
      const t = revealElapsedMs / TITLE_LETTER_DROP_DURATION_MS
      return { char, x, yOffset: Math.round(lerp(-TITLE_DROP_FROM_PX, 0, easeOutBack(t))), opacity: Math.min(1, t * 4) }
    }

    if (titleElapsedMs < holdEndMs) return { char, x, yOffset: 0, opacity: 1 }
    if (titleElapsedMs < fadeEndMs) {
      const t = (titleElapsedMs - holdEndMs) / (fadeEndMs - holdEndMs)
      return { char, x, yOffset: 0, opacity: 1 - t }
    }
    return { char, x, yOffset: 0, opacity: 0 }
  })
}

/**
 * Pure function: elapsed time (ms, since the scene mounted) -> one animation
 * tick of the looping "run and shoot" cutscene (`MASCOT_TIMELINE`). Kept
 * separate from drawing/canvas so the step logic is testable without a
 * `<canvas>`. `useMascotScene.hook.ts` accumulates `elapsedMs` and steps the
 * stepped (12 fps) pixel-art frame only when a frame boundary is crossed.
 */
export function computeMascotSceneState(elapsedMsRaw: number): MascotSceneState {
  const elapsedMs = elapsedMsRaw % MASCOT_TIMELINE.LOOP_DURATION_MS
  const frame = Math.floor(elapsedMsRaw / MASCOT_ANIMATION.FRAME_DURATION_MS)

  const blinkPhase = elapsedMs % MASCOT_ANIMATION.BLINK_INTERVAL_MS
  const blink = elapsedMs >= MASCOT_ANIMATION.BLINK_INTERVAL_MS && blinkPhase < MASCOT_ANIMATION.BLINK_DURATION_MS

  const levelWipeY = computeLevelWipeY(elapsedMs)

  // Both enemies and both fights' bolts are pure functions of the absolute loop time — neither depends on which
  // phase branch the mascot itself is in below, since the platform + drone are level geometry present throughout.
  const groundEnemy = computeEnemy('ground', GROUND_ENEMY.X, GROUND_ENEMY.Y, MASCOT_TIMELINE.GROUND_PLAYER_HIT_MS, elapsedMs, ENEMY_KNOCKBACK_PX)
  const airEnemyY = AIR_ENEMY.Y + (frame % 2 === 0 ? 0 : -AIR_ENEMY.BOB_PX)
  const airEnemy = computeEnemy('air', AIR_ENEMY.X, airEnemyY, MASCOT_TIMELINE.AIR_PLAYER_HIT_MS, elapsedMs, ENEMY_KNOCKBACK_PX)

  const groundEnemyBolt = computeBolt(MASCOT_TIMELINE.GROUND_ENEMY_BOLT_SHOOT_MS, MASCOT_TIMELINE.GROUND_ENEMY_BOLT_GONE_MS, elapsedMs, GROUND_BOLT_FROM, GROUND_BOLT_TO)
  const groundPlayerBolt = computeBolt(MASCOT_TIMELINE.GROUND_PLAYER_SHOOT_MS, MASCOT_TIMELINE.GROUND_PLAYER_HIT_MS, elapsedMs, GROUND_MASCOT_GUN_TIP, GROUND_ENEMY_CENTER)
  const airEnemyBolt = computeBolt(MASCOT_TIMELINE.AIR_ENEMY_BOLT_SHOOT_MS, MASCOT_TIMELINE.AIR_ENEMY_BOLT_GONE_MS, elapsedMs, AIR_BOLT_FROM, AIR_BOLT_TO)
  const airPlayerBolt = computeBolt(MASCOT_TIMELINE.AIR_PLAYER_SHOOT_MS, MASCOT_TIMELINE.AIR_PLAYER_HIT_MS, elapsedMs, AIR_MASCOT_GUN_TIP_UP, AIR_ENEMY_CENTER)
  const enemyBolt = groundEnemyBolt.visible ? groundEnemyBolt : airEnemyBolt
  const playerBolt = groundPlayerBolt.visible ? groundPlayerBolt : airPlayerBolt

  // Both title lines are pure functions of absolute loop time too — before the level has finished dissolving,
  // `titleElapsedMs` is negative for every letter, so `computeTitleLine` naturally returns them all transparent.
  const titleElapsedMs = elapsedMs - MASCOT_TIMELINE.DISSOLVE_END_MS
  const holdEndMs = MASCOT_TIMELINE.TITLE_HOLD_END_MS - MASCOT_TIMELINE.DISSOLVE_END_MS
  const fadeEndMs = MASCOT_TIMELINE.TITLE_FADE_END_MS - MASCOT_TIMELINE.DISSOLVE_END_MS
  const titleLetters = computeTitleLine(TITLE_TEXT, TITLE_START_X, titleElapsedMs, 0, holdEndMs, fadeEndMs)
  const subtitleLetters = computeTitleLine(SUBTITLE_TEXT, SUBTITLE_START_X, titleElapsedMs, SUBTITLE_BASE_DELAY_MS, holdEndMs, fadeEndMs)

  let phase: MascotScenePhase
  let mascotX: number
  let mascotY: number
  let pose: MascotPose
  let aim: 'forward' | 'up' | 'hidden' = 'forward'
  let squash = false

  if (elapsedMs < MASCOT_TIMELINE.RUN_IN_END_MS) {
    phase = 'run-in'
    const t = clamp01(elapsedMs / MASCOT_TIMELINE.RUN_IN_END_MS)
    mascotX = lerp(-MASCOT_SPRITE_SIZE, STOP_X, t)
    pose = runPose(elapsedMs)
    mascotY = GROUND_STAND_Y + runBob(pose)
  } else if (elapsedMs < MASCOT_TIMELINE.GROUND_FIGHT_END_MS) {
    phase = 'ground-fight'
    mascotX = STOP_X
    mascotY = GROUND_STAND_Y
    const crouching = elapsedMs >= MASCOT_TIMELINE.GROUND_CROUCH_START_MS && elapsedMs < MASCOT_TIMELINE.GROUND_CROUCH_END_MS
    pose = crouching ? 'crouch' : 'idle'
  } else if (elapsedMs < MASCOT_TIMELINE.JUMP_END_MS) {
    phase = 'jump'
    const phaseStart = MASCOT_TIMELINE.GROUND_FIGHT_END_MS
    const t = clamp01((elapsedMs - phaseStart) / (MASCOT_TIMELINE.JUMP_END_MS - phaseStart))
    const arc = Math.sin(t * Math.PI)
    mascotX = lerp(STOP_X, PLATFORM_STOP_X, t)
    mascotY = lerp(GROUND_STAND_Y, PLATFORM_STAND_Y, t) - arc * JUMP_ARC_HEIGHT_PX
    pose = 'jump'
    squash = t > 0.92
  } else if (elapsedMs < MASCOT_TIMELINE.AIR_FIGHT_END_MS) {
    phase = 'air-fight'
    mascotX = PLATFORM_STOP_X
    const dodgeOffset = computeAirDodgeOffset(elapsedMs)
    mascotY = PLATFORM_STAND_Y + dodgeOffset
    pose = dodgeOffset !== 0 ? 'jump' : 'idle'
    aim = elapsedMs < MASCOT_TIMELINE.AIR_AIM_MS ? 'forward' : 'up'
  } else if (elapsedMs < MASCOT_TIMELINE.JUMP_DOWN_END_MS) {
    phase = 'jump-down'
    const phaseStart = MASCOT_TIMELINE.AIR_FIGHT_END_MS
    const t = clamp01((elapsedMs - phaseStart) / (MASCOT_TIMELINE.JUMP_DOWN_END_MS - phaseStart))
    const arc = Math.sin(t * Math.PI)
    mascotX = lerp(PLATFORM_STOP_X, JUMP_DOWN_LANDING_X, t)
    mascotY = lerp(PLATFORM_STAND_Y, GROUND_STAND_Y, t) - arc * JUMP_ARC_HEIGHT_PX
    pose = 'jump'
    squash = t > 0.92
  } else if (elapsedMs < MASCOT_TIMELINE.RUN_OUT_END_MS) {
    phase = 'run-out'
    const phaseStart = MASCOT_TIMELINE.JUMP_DOWN_END_MS
    const t = clamp01((elapsedMs - phaseStart) / (MASCOT_TIMELINE.RUN_OUT_END_MS - phaseStart))
    mascotX = lerp(JUMP_DOWN_LANDING_X, OFFSCREEN_X, t)
    pose = runPose(elapsedMs)
    mascotY = GROUND_STAND_Y + runBob(pose)
  } else {
    phase = 'title'
    mascotX = OFFSCREEN_X
    mascotY = GROUND_STAND_Y
    pose = 'idle'
  }

  return {
    phase,
    elapsedMs,
    frame,
    blink,
    mascotX,
    mascotY,
    pose,
    aim,
    squash,
    platformVisible: true,
    levelWipeY,
    playerBolt,
    enemyBolt,
    enemies: [groundEnemy, airEnemy],
    titleLetters,
    subtitleLetters,
  }
}

/**
 * `prefers-reduced-motion` gets a single still frame instead of the looping
 * cutscene: the mascot shooting the drone, over the fully-visible city — no
 * dissolve, no logo (per the owner's spec: "mascot shooting the drone over
 * the city, no logo needed") — composed directly rather than sampled from
 * one instant of `computeMascotSceneState`.
 */
export function computeReducedMotionSceneState(): MascotSceneState {
  return {
    phase: 'air-fight',
    elapsedMs: 0,
    frame: 0,
    blink: false,
    mascotX: PLATFORM_STOP_X,
    mascotY: PLATFORM_STAND_Y,
    pose: 'idle',
    aim: 'up',
    squash: false,
    platformVisible: true,
    levelWipeY: SCENE_HEIGHT,
    playerBolt: { visible: true, x: AIR_MASCOT_GUN_TIP_UP[0] + 4, y: AIR_MASCOT_GUN_TIP_UP[1] - 4, muzzleFlash: false },
    enemyBolt: { visible: false, x: 0, y: 0, muzzleFlash: false },
    enemies: [
      { kind: 'ground', x: GROUND_ENEMY.X, y: GROUND_ENEMY.Y, lifecycle: 'gone', burstProgress: 1 },
      { kind: 'air', x: AIR_ENEMY.X, y: AIR_ENEMY.Y, lifecycle: 'alive', burstProgress: 0 },
    ],
    titleLetters: [],
    subtitleLetters: [],
  }
}

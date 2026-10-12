/**
 * Login-page mascot scene (editor-auth change): a looping "run and shoot"
 * cutscene where both sides fight back. `drawMascot`/`drawMascotScene`/
 * `drawGlyphText` in `@/lib/mascot` take a `PixelWriter` instead of a
 * `CanvasRenderingContext2D` directly so the drawing logic is testable with
 * a fake recorder, with no real `<canvas>`/jsdom involved (this app's
 * Vitest `environment` is `'node'` — see `vite.config.ts`).
 */
export interface PixelWriter {
  fillRect(x: number, y: number, w: number, h: number, color: string): void
}

/** Run-cycle + idle + jump + crouch poses, reproducing the owner's reference leg/arm tables 1:1 (`crouch` added for dodging enemy bolts). */
export type MascotPose = 'idle' | 'run0' | 'run1' | 'run2' | 'run3' | 'jump' | 'crouch'

export interface MascotDrawOptions {
  readonly pose?: MascotPose
  readonly blink?: boolean
  /** Blaster aim direction — `'forward'` at ground enemies, `'up'` at the flying drone. Omit to hide the blaster (e.g. mid-explosion). */
  readonly aim?: 'forward' | 'up' | 'hidden'
}

/** One enemy's lifecycle: alive and in place, then a hit-stop flash + knockback, then bursting into fading particles, then gone for the rest of the loop. */
export type EnemyLifecycle = 'alive' | 'hit' | 'bursting' | 'gone'

export interface EnemyState {
  readonly kind: 'ground' | 'air'
  readonly x: number
  readonly y: number
  readonly lifecycle: EnemyLifecycle
  /** 0-1 progress through the `bursting` lifecycle — drives particle spread/fade. */
  readonly burstProgress: number
}

export interface BlasterBoltState {
  readonly visible: boolean
  readonly x: number
  readonly y: number
  readonly muzzleFlash: boolean
}

/** The mascot's hit-detection box — shrinks (from the top) when `crouch`ing, moves with `mascotY` when hopping. Used only for the enemy-bolt-dodge safety check (`mascot-bolt-safety.test.ts`); drawing doesn't need it. */
export interface MascotHurtbox {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

/** One letter's drop-in/hold/fade-out state — used for both the "PIXELFORGE" and "AI" lines. */
export interface TitleLetterState {
  readonly char: string
  readonly x: number
  /** Vertical offset from its resting baseline — negative while overshooting on drop-in. */
  readonly yOffset: number
  readonly opacity: number
}

export type MascotScenePhase =
  | 'run-in'
  | 'ground-fight'
  | 'jump'
  | 'air-fight'
  | 'jump-down'
  | 'run-out'
  | 'title'

/** One tick of the shooter cutscene's animation state, recomputed from elapsed time (looped) by `useMascotScene`. */
export interface MascotSceneState {
  readonly phase: MascotScenePhase
  /** Elapsed time (ms) within the current loop — drives the living background's continuous scroll/drift (`drawCityBackground`). */
  readonly elapsedMs: number
  /** Stepped animation frame index (12 fps) — drives run-cycle poses, enemy idle/walk/rotor animation, and blink/muzzle timing. */
  readonly frame: number
  readonly blink: boolean
  /** Mascot's top-left origin in scene-native px. Off (negative or beyond scene width) while entering/exited. */
  readonly mascotX: number
  readonly mascotY: number
  readonly pose: MascotPose
  readonly aim: 'forward' | 'up' | 'hidden'
  readonly squash: boolean
  /** The raised platform is level geometry, drawn for the whole run-in..run-out span. */
  readonly platformVisible: boolean
  /** How much of the scene (bottom-up) the level — platform + city background — is wiped away by, for the title's dissolve/reveal transition. `MASCOT_SCENE_SIZE.HEIGHT` = fully drawn, `0` = fully dissolved. */
  readonly levelWipeY: number
  readonly playerBolt: BlasterBoltState
  readonly enemyBolt: BlasterBoltState
  readonly enemies: readonly EnemyState[]
  readonly titleLetters: readonly TitleLetterState[]
  readonly subtitleLetters: readonly TitleLetterState[]
}

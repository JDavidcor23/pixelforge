/** A point in level pixels (origin top-left, y grows down). */
export interface LevelPoint {
  x: number
  y: number
}

/** An axis-aligned box in level pixels; `x`/`y` is its top-left corner. */
export interface LevelRect extends LevelPoint {
  width: number
  height: number
}

/** A hand-made level (`public/levels/*.json`), validated by `parseLevel` before use. */
export interface Level {
  version: 1
  name: string
  width: number
  height: number
  spawn: LevelPoint
  platforms: LevelRect[]
  hazards: LevelRect[]
  goal: LevelRect
}

/** Feel knobs for run and jump; speeds in px/s, accelerations in px/s². */
export interface PlatformerTuning {
  RUN_SPEED: number
  GROUND_ACCELERATION: number
  AIR_ACCELERATION: number
  JUMP_VELOCITY: number
  /** Upward speed is multiplied by this when jump is released early (variable jump height). */
  JUMP_CUT_FACTOR: number
  /** A jump still counts this long after walking off a ledge. */
  COYOTE_MS: number
  /** A jump pressed this long before landing fires on landing. */
  JUMP_BUFFER_MS: number
}

/** One frame of input and body state handed to the controller (y grows down). */
export interface PlatformerFrame {
  deltaMs: number
  left: boolean
  right: boolean
  jumpHeld: boolean
  grounded: boolean
  velocityX: number
  velocityY: number
}

export interface PlatformerVelocity {
  velocityX: number
  velocityY: number
}

/** Where a level run stands; anything but `playing` is final until the scene restarts. */
export type LevelOutcome = 'playing' | 'died' | 'complete'

export type LevelResult = { ok: true; level: Level } | { ok: false; error: string }

/** Commands React sends to the running game (toolbar → Phaser). */
export interface GameCommandMap {
  pause: void
  resume: void
  restart: void
  fullscreen: void
}

/** Events the running game reports back (Phaser → React). */
export interface GameEventMap {
  'player-died': void
  'level-complete': void
}

export type GameCommand = keyof GameCommandMap
export type GameEvent = keyof GameEventMap

export type BusHandler<Payload> = (payload: Payload) => void
export type Unsubscribe = () => void

/** Minimal typed pub/sub. `void` payloads can be emitted with no argument. */
export interface TypedBus<Map> {
  on<Key extends keyof Map>(type: Key, handler: BusHandler<Map[Key]>): Unsubscribe
  emit<Key extends keyof Map>(
    type: Key,
    ...payload: Map[Key] extends void ? [] : [Map[Key]]
  ): void
  clear(): void
}

export interface GameBus {
  commands: TypedBus<GameCommandMap>
  events: TypedBus<GameEventMap>
}

/** The slice of `Phaser.Game` the command binding drives — kept narrow so it is testable without WebGL. */
export interface ControllableGame {
  pause(): void
  resume(): void
  restartActiveScene(): void
  toggleFullscreen(): void
}

/** Tabs of the build screen's left panel. */
export type BuildPanelTab = 'chat' | 'library'

export interface BuildPanelTabItem {
  id: BuildPanelTab
  label: string
}

/** Asset kinds the library can be filtered by (static in phase 1, no filtering yet). */
export type LibraryFilter = 'all' | 'sprites' | 'audio' | 'music' | 'video'

export interface LibraryFilterItem {
  id: LibraryFilter
  label: string
}

/** What `mountGame` needs from a created game: a way to destroy it and learn when it is gone. */
export interface MountedGame {
  destroy(): void
  onceDestroyed(callback: () => void): void
}

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

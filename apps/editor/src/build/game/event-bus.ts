import type { BusHandler, GameBus, GameCommandMap, GameEventMap, TypedBus } from '../types'

export function createTypedBus<Map>(): TypedBus<Map> {
  const handlers = new Map<keyof Map, Set<BusHandler<never>>>()

  return {
    on(type, handler) {
      const set = handlers.get(type) ?? new Set()
      set.add(handler as BusHandler<never>)
      handlers.set(type, set)
      return () => {
        set.delete(handler as BusHandler<never>)
      }
    },
    emit(type, ...payload) {
      handlers.get(type)?.forEach((handler) => (handler as BusHandler<unknown>)(payload[0]))
    },
    clear() {
      handlers.clear()
    },
  }
}

export function createGameBus(): GameBus {
  return {
    commands: createTypedBus<GameCommandMap>(),
    events: createTypedBus<GameEventMap>(),
  }
}

/**
 * The single bus between React and Phaser (ADR 0014, D-EventBus).
 * React never reads game state per frame; it only sends commands and listens to events.
 */
export const gameBus = createGameBus()

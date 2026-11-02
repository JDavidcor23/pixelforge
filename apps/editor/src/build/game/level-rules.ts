import type { GameEventMap, Level, LevelOutcome, LevelRect, TypedBus } from '../types'

/** Strict overlap: boxes that only share an edge (standing beside a hazard) do not touch. */
function overlaps(a: LevelRect, b: LevelRect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

/**
 * Win and lose rules for one run of a level, free of Phaser so they are testable.
 * The scene passes the player's box every frame; the first hazard, fall or goal
 * ends the run and emits its event exactly once.
 */
export function createLevelRules(level: Level, events: TypedBus<GameEventMap>) {
  let outcome: LevelOutcome = 'playing'

  function judge(player: LevelRect): LevelOutcome {
    if (player.y > level.height) return 'died'
    if (level.hazards.some((hazard) => overlaps(player, hazard))) return 'died'
    if (overlaps(player, level.goal)) return 'complete'
    return 'playing'
  }

  return {
    step(player: LevelRect): LevelOutcome {
      if (outcome !== 'playing') return outcome

      outcome = judge(player)
      if (outcome === 'died') events.emit('player-died')
      if (outcome === 'complete') events.emit('level-complete')
      return outcome
    },
  }
}

export type LevelRules = ReturnType<typeof createLevelRules>

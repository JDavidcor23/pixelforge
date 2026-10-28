import type { MountedGame, Unsubscribe } from '../types'

export type MountGame = <Game extends MountedGame>(
  create: () => Game,
  onMounted: (game: Game) => Unsubscribe,
) => Unsubscribe

/**
 * Mounts at most one game at a time. Phaser tears a game down on its next
 * frame, so a new mount waits for the previous game's DESTROY event. Under
 * React Strict Mode (mount → unmount → mount) the first mount is cancelled
 * before it creates anything, so only one game is ever built.
 */
export function createGameMounter(): MountGame {
  let previousTeardown: Promise<void> = Promise.resolve()

  return (create, onMounted) => {
    let isCancelled = false
    let mounted: { game: MountedGame; cleanup: Unsubscribe } | null = null

    const ready = previousTeardown.then(() => {
      if (isCancelled) return
      const game = create()
      mounted = { game, cleanup: onMounted(game) }
    })

    return () => {
      isCancelled = true
      previousTeardown = ready.then(() => {
        if (!mounted) return
        const { game, cleanup } = mounted
        cleanup()
        return new Promise<void>((resolve) => {
          game.onceDestroyed(resolve)
          game.destroy()
        })
      })
    }
  }
}

export const mountGame = createGameMounter()

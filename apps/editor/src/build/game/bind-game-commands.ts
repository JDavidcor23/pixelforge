import type { ControllableGame, GameCommandMap, TypedBus, Unsubscribe } from '../types'

/** Wires toolbar commands to the running game. Returns the unbind for unmount. */
export function bindGameCommands(
  game: ControllableGame,
  commands: TypedBus<GameCommandMap>,
): Unsubscribe {
  const unsubscribers = [
    commands.on('pause', () => game.pause()),
    commands.on('resume', () => game.resume()),
    commands.on('restart', () => {
      game.resume()
      game.restartActiveScene()
    }),
    // Runs inside the click handler, so the browser accepts the fullscreen request.
    commands.on('fullscreen', () => game.toggleFullscreen()),
  ]

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
}

import { useEffect, useRef } from 'react'

import { bindGameCommands } from './bind-game-commands'
import { createGame } from './create-game'
import { gameBus } from './event-bus'
import { mountGame } from './mount-game'

/**
 * Mounts the Phaser game once into the returned ref and destroys it on unmount.
 * The game never touches React state: the toolbar talks to it through `gameBus`.
 */
export function usePhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const parent = containerRef.current
    if (!parent) return

    return mountGame(
      () => createGame(parent),
      (game) => bindGameCommands(game, gameBus.commands),
    )
  }, [])

  return { containerRef }
}

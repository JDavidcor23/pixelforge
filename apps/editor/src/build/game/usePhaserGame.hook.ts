import { useEffect, useRef } from 'react'

import { LEVEL_FORMAT } from '@/constants/build-game'
import { loadLevel } from '../level/load-level'
import { bindGameCommands } from './bind-game-commands'
import { createGame } from './create-game'
import { gameBus } from './event-bus'
import { mountGame } from './mount-game'

/**
 * Mounts the Phaser game once into the returned ref and destroys it on unmount.
 * Once the game is bound, the level file is fetched, validated and sent with
 * `load-level`. The game never touches React state: the toolbar talks to it through `gameBus`.
 */
export function usePhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const parent = containerRef.current
    if (!parent) return

    return mountGame(
      () => createGame(parent),
      (game) => {
        const unbind = bindGameCommands(game, gameBus.commands)
        let isUnmounted = false

        loadLevel(LEVEL_FORMAT.DEFAULT_URL)
          .then((result) => {
            if (isUnmounted) return
            if (!result.ok) throw new Error(result.error)
            gameBus.commands.emit('load-level', result.level)
          })
          .catch((error: unknown) => console.error(error))

        return () => {
          isUnmounted = true
          unbind()
        }
      },
    )
  }, [])

  return { containerRef }
}

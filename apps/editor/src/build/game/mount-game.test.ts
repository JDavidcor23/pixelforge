import { describe, expect, it, vi } from 'vitest'

import { createGameMounter } from './mount-game'
import type { MountedGame } from '../types'

/** A fake game whose DESTROY only fires when the test says so, like Phaser's next-frame teardown. */
function createFakeGame() {
  let destroyedCallback: (() => void) | null = null
  const game: MountedGame & { finishDestroy(): void } = {
    destroy: vi.fn(),
    onceDestroyed: (callback) => {
      destroyedCallback = callback
    },
    finishDestroy: () => destroyedCallback?.(),
  }
  return game
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('mountGame', () => {
  it('creates the game and runs onMounted with it', async () => {
    const mountGame = createGameMounter()
    const game = createFakeGame()
    const onMounted = vi.fn(() => () => {})

    mountGame(() => game, onMounted)
    await flush()

    expect(onMounted).toHaveBeenCalledWith(game)
  })

  it('creates only one game under a Strict Mode mount → unmount → mount', async () => {
    const mountGame = createGameMounter()
    const create = vi.fn(createFakeGame)

    const disposeFirst = mountGame(create, () => () => {})
    disposeFirst()
    mountGame(create, () => () => {})
    await flush()

    expect(create).toHaveBeenCalledTimes(1)
  })

  it('waits for the previous game DESTROY before creating the next one', async () => {
    const mountGame = createGameMounter()
    const first = createFakeGame()
    const second = createFakeGame()
    const create = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second)

    const disposeFirst = mountGame(create, () => () => {})
    await flush()
    disposeFirst()
    mountGame(create, () => () => {})
    await flush()

    expect(first.destroy).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledTimes(1)

    first.finishDestroy()
    await flush()

    expect(create).toHaveBeenCalledTimes(2)
  })

  it('runs the onMounted cleanup before destroying the game', async () => {
    const mountGame = createGameMounter()
    const game = createFakeGame()
    const cleanup = vi.fn()

    const dispose = mountGame(() => game, () => cleanup)
    await flush()
    dispose()
    await flush()

    expect(cleanup).toHaveBeenCalledTimes(1)
    expect(game.destroy).toHaveBeenCalledTimes(1)
  })
})

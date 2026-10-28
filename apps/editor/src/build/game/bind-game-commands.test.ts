import { describe, expect, it, vi } from 'vitest'

import { bindGameCommands } from './bind-game-commands'
import { createTypedBus } from './event-bus'
import type { ControllableGame, GameCommandMap } from '../types'

function createFakeGame(): ControllableGame {
  return {
    pause: vi.fn(),
    resume: vi.fn(),
    restartActiveScene: vi.fn(),
    toggleFullscreen: vi.fn(),
  }
}

describe('bindGameCommands', () => {
  it.each([
    ['pause', 'pause'],
    ['resume', 'resume'],
    ['restart', 'restartActiveScene'],
    ['fullscreen', 'toggleFullscreen'],
  ] as const)('the %s command calls game.%s', (command, method) => {
    const commands = createTypedBus<GameCommandMap>()
    const game = createFakeGame()
    bindGameCommands(game, commands)

    commands.emit(command)

    expect(game[method]).toHaveBeenCalledTimes(1)
  })

  it('restart also resumes a paused game so the new run is visible', () => {
    const commands = createTypedBus<GameCommandMap>()
    const game = createFakeGame()
    bindGameCommands(game, commands)

    commands.emit('restart')

    expect(game.resume).toHaveBeenCalledTimes(1)
  })

  it('stops driving the game after unbind', () => {
    const commands = createTypedBus<GameCommandMap>()
    const game = createFakeGame()
    const unbind = bindGameCommands(game, commands)

    unbind()
    commands.emit('pause')

    expect(game.pause).not.toHaveBeenCalled()
  })
})

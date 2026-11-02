import { describe, expect, it, vi } from 'vitest'

import { bindGameCommands } from './bind-game-commands'
import { createTypedBus } from './event-bus'
import type { ControllableGame, GameCommandMap, Level } from '../types'

const LEVEL: Level = {
  version: 1,
  name: 'Test level',
  width: 640,
  height: 360,
  spawn: { x: 32, y: 300 },
  platforms: [{ x: 0, y: 340, width: 640, height: 20 }],
  hazards: [],
  goal: { x: 600, y: 300, width: 20, height: 40 },
}

function createFakeGame(): ControllableGame {
  return {
    loadLevel: vi.fn(),
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

  it('the load-level command starts that level in the game', () => {
    const commands = createTypedBus<GameCommandMap>()
    const game = createFakeGame()
    bindGameCommands(game, commands)

    commands.emit('load-level', LEVEL)

    expect(game.loadLevel).toHaveBeenCalledWith(LEVEL)
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

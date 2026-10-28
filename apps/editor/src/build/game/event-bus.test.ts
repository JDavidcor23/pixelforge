import { describe, expect, it, vi } from 'vitest'

import { createGameBus, createTypedBus } from './event-bus'
import type { GameCommandMap } from '../types'

describe('createTypedBus', () => {
  it('delivers an emitted message to every handler of that type only', () => {
    const bus = createTypedBus<GameCommandMap>()
    const onPause = vi.fn()
    const onResume = vi.fn()
    bus.on('pause', onPause)
    bus.on('resume', onResume)

    bus.emit('pause')

    expect(onPause).toHaveBeenCalledTimes(1)
    expect(onResume).not.toHaveBeenCalled()
  })

  it('stops delivering after the returned unsubscribe runs', () => {
    const bus = createTypedBus<GameCommandMap>()
    const onRestart = vi.fn()
    const unsubscribe = bus.on('restart', onRestart)

    unsubscribe()
    bus.emit('restart')

    expect(onRestart).not.toHaveBeenCalled()
  })

  it('clear removes every handler', () => {
    const bus = createTypedBus<GameCommandMap>()
    const onFullscreen = vi.fn()
    bus.on('fullscreen', onFullscreen)

    bus.clear()
    bus.emit('fullscreen')

    expect(onFullscreen).not.toHaveBeenCalled()
  })
})

describe('createGameBus', () => {
  it('keeps commands and events on separate channels', () => {
    const bus = createGameBus()
    const onPlayerDied = vi.fn()
    const onLevelComplete = vi.fn()
    bus.events.on('player-died', onPlayerDied)
    bus.events.on('level-complete', onLevelComplete)

    bus.events.emit('player-died')

    expect(onPlayerDied).toHaveBeenCalledTimes(1)
    expect(onLevelComplete).not.toHaveBeenCalled()
  })
})

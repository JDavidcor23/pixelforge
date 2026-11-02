import { describe, expect, it, vi } from 'vitest'

import { createTypedBus } from './event-bus'
import { createLevelRules } from './level-rules'
import type { GameEventMap, Level, LevelRect } from '../types'

const LEVEL: Level = {
  version: 1,
  name: 'Test level',
  width: 640,
  height: 360,
  spawn: { x: 32, y: 300 },
  platforms: [{ x: 0, y: 340, width: 640, height: 20 }],
  hazards: [{ x: 200, y: 330, width: 32, height: 10 }],
  goal: { x: 600, y: 300, width: 20, height: 40 },
}

const PLAYER_SIZE = { width: 14, height: 22 }

function playerAt(x: number, y: number): LevelRect {
  return { x, y, ...PLAYER_SIZE }
}

function setup() {
  const events = createTypedBus<GameEventMap>()
  const died = vi.fn()
  const complete = vi.fn()
  events.on('player-died', died)
  events.on('level-complete', complete)
  return { rules: createLevelRules(LEVEL, events), died, complete }
}

describe('createLevelRules', () => {
  it('emits nothing while the player is clear of hazards and the goal', () => {
    const { rules, died, complete } = setup()

    const outcome = rules.step(playerAt(32, 318))

    expect(outcome).toBe('playing')
    expect(died).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()
  })

  it('emits player-died when the player touches a hazard', () => {
    const { rules, died, complete } = setup()

    const outcome = rules.step(playerAt(210, 312))

    expect(outcome).toBe('died')
    expect(died).toHaveBeenCalledTimes(1)
    expect(complete).not.toHaveBeenCalled()
  })

  it('does not count a player standing exactly beside a hazard as touching it', () => {
    const { rules, died } = setup()

    rules.step(playerAt(200 - PLAYER_SIZE.width, 318))

    expect(died).not.toHaveBeenCalled()
  })

  it('emits player-died when the player falls below the level', () => {
    const { rules, died } = setup()

    const outcome = rules.step(playerAt(100, LEVEL.height + 1))

    expect(outcome).toBe('died')
    expect(died).toHaveBeenCalledTimes(1)
  })

  it('emits level-complete when the player reaches the goal', () => {
    const { rules, died, complete } = setup()

    const outcome = rules.step(playerAt(595, 318))

    expect(outcome).toBe('complete')
    expect(complete).toHaveBeenCalledTimes(1)
    expect(died).not.toHaveBeenCalled()
  })

  it('emits each outcome once and then ignores the player', () => {
    const { rules, died, complete } = setup()
    rules.step(playerAt(210, 312))

    const outcome = rules.step(playerAt(595, 318))
    rules.step(playerAt(210, 312))

    expect(outcome).toBe('died')
    expect(died).toHaveBeenCalledTimes(1)
    expect(complete).not.toHaveBeenCalled()
  })
})

import { describe, expect, it } from 'vitest'

import { createPlatformerController } from './platformer-controller'
import type { PlatformerFrame, PlatformerTuning } from '../types'

const TUNING: PlatformerTuning = {
  RUN_SPEED: 100,
  GROUND_ACCELERATION: 1000,
  AIR_ACCELERATION: 500,
  JUMP_VELOCITY: 400,
  JUMP_CUT_FACTOR: 0.5,
  COYOTE_MS: 100,
  JUMP_BUFFER_MS: 120,
}

const FRAME_MS = 16

function frame(overrides: Partial<PlatformerFrame> = {}): PlatformerFrame {
  return {
    deltaMs: FRAME_MS,
    left: false,
    right: false,
    jumpHeld: false,
    grounded: true,
    velocityX: 0,
    velocityY: 0,
    ...overrides,
  }
}

describe('createPlatformerController', () => {
  it('jumps when jump is pressed on the ground', () => {
    const controller = createPlatformerController(TUNING)

    const result = controller.step(frame({ jumpHeld: true }))

    expect(result.velocityY).toBe(-TUNING.JUMP_VELOCITY)
  })

  it('does not jump again while jump stays held', () => {
    const controller = createPlatformerController(TUNING)
    controller.step(frame({ jumpHeld: true }))

    const result = controller.step(frame({ jumpHeld: true, velocityY: 0 }))

    expect(result.velocityY).toBe(0)
  })

  it('still jumps inside the coyote time after walking off a ledge', () => {
    const controller = createPlatformerController(TUNING)
    controller.step(frame())
    controller.step(frame({ grounded: false, deltaMs: 80 }))

    const result = controller.step(frame({ grounded: false, jumpHeld: true, deltaMs: 16, velocityY: 50 }))

    expect(result.velocityY).toBe(-TUNING.JUMP_VELOCITY)
  })

  it('does not jump after the coyote time has passed', () => {
    const controller = createPlatformerController(TUNING)
    controller.step(frame())
    controller.step(frame({ grounded: false, deltaMs: 120 }))

    const result = controller.step(frame({ grounded: false, jumpHeld: true, velocityY: 50 }))

    expect(result.velocityY).toBe(50)
  })

  it('does not double jump with the coyote time after a real jump', () => {
    const controller = createPlatformerController(TUNING)
    controller.step(frame({ jumpHeld: true }))
    controller.step(frame({ grounded: false, jumpHeld: false, velocityY: -300 }))

    const result = controller.step(frame({ grounded: false, jumpHeld: true, velocityY: -280 }))

    expect(result.velocityY).toBe(-280)
  })

  it('buffers a jump pressed just before landing', () => {
    const controller = createPlatformerController(TUNING)
    controller.step(frame({ grounded: false, jumpHeld: true, velocityY: 200 }))
    controller.step(frame({ grounded: false, jumpHeld: true, velocityY: 200, deltaMs: 60 }))

    const result = controller.step(frame({ grounded: true, jumpHeld: true }))

    expect(result.velocityY).toBe(-TUNING.JUMP_VELOCITY)
  })

  it('drops a jump pressed too long before landing', () => {
    const controller = createPlatformerController(TUNING)
    controller.step(frame({ grounded: false, jumpHeld: true, velocityY: 200 }))
    controller.step(frame({ grounded: false, jumpHeld: false, velocityY: 200, deltaMs: 150 }))

    const result = controller.step(frame({ grounded: true }))

    expect(result.velocityY).toBe(0)
  })

  it('cuts the jump short when jump is released while rising', () => {
    const controller = createPlatformerController(TUNING)
    controller.step(frame({ jumpHeld: true }))

    const result = controller.step(frame({ grounded: false, jumpHeld: false, velocityY: -300 }))

    expect(result.velocityY).toBe(-300 * TUNING.JUMP_CUT_FACTOR)
  })

  it('keeps the full jump while jump stays held', () => {
    const controller = createPlatformerController(TUNING)
    controller.step(frame({ jumpHeld: true }))

    const result = controller.step(frame({ grounded: false, jumpHeld: true, velocityY: -300 }))

    expect(result.velocityY).toBe(-300)
  })

  it('cuts the jump only once', () => {
    const controller = createPlatformerController(TUNING)
    controller.step(frame({ jumpHeld: true }))
    controller.step(frame({ grounded: false, velocityY: -300 }))

    const result = controller.step(frame({ grounded: false, velocityY: -150 }))

    expect(result.velocityY).toBe(-150)
  })

  it('accelerates toward the run speed and caps there', () => {
    const controller = createPlatformerController(TUNING)

    const first = controller.step(frame({ right: true }))
    const capped = controller.step(frame({ right: true, velocityX: 95 }))

    expect(first.velocityX).toBeCloseTo(TUNING.GROUND_ACCELERATION * (FRAME_MS / 1000))
    expect(capped.velocityX).toBe(TUNING.RUN_SPEED)
  })

  it('accelerates slower in the air', () => {
    const controller = createPlatformerController(TUNING)

    const result = controller.step(frame({ grounded: false, left: true, velocityY: 10 }))

    expect(result.velocityX).toBeCloseTo(-TUNING.AIR_ACCELERATION * (FRAME_MS / 1000))
  })

  it('slows to a stop with no direction held', () => {
    const controller = createPlatformerController(TUNING)

    const result = controller.step(frame({ velocityX: 10 }))

    expect(result.velocityX).toBe(0)
  })
})

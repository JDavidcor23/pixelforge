import type { PlatformerFrame, PlatformerTuning, PlatformerVelocity } from '../types'

const MS_PER_SECOND = 1000

function approach(current: number, target: number, maxStep: number): number {
  if (current < target) return Math.min(current + maxStep, target)
  return Math.max(current - maxStep, target)
}

/**
 * Run and jump rules, free of Phaser so they are testable: the scene feeds one
 * frame of input and body state and applies the velocity it gets back.
 * Coyote time, jump buffer and variable jump height live here and nowhere else.
 */
export function createPlatformerController(tuning: PlatformerTuning) {
  let coyoteMs = 0
  let bufferMs = 0
  let wasJumpHeld = false
  /** True from a jump until landing; only a jump in progress can be cut short. */
  let isJumping = false

  return {
    step(frame: PlatformerFrame): PlatformerVelocity {
      const isJumpPressed = frame.jumpHeld && !wasJumpHeld
      wasJumpHeld = frame.jumpHeld

      coyoteMs = frame.grounded ? tuning.COYOTE_MS : Math.max(0, coyoteMs - frame.deltaMs)
      bufferMs = isJumpPressed ? tuning.JUMP_BUFFER_MS : Math.max(0, bufferMs - frame.deltaMs)
      if (frame.grounded && frame.velocityY >= 0) isJumping = false

      const direction = Number(frame.right) - Number(frame.left)
      const acceleration = frame.grounded ? tuning.GROUND_ACCELERATION : tuning.AIR_ACCELERATION
      const velocityX = approach(
        frame.velocityX,
        direction * tuning.RUN_SPEED,
        acceleration * (frame.deltaMs / MS_PER_SECOND),
      )

      let velocityY = frame.velocityY
      if (bufferMs > 0 && coyoteMs > 0) {
        velocityY = -tuning.JUMP_VELOCITY
        bufferMs = 0
        coyoteMs = 0
        isJumping = true
      } else if (isJumping && !frame.jumpHeld && velocityY < 0) {
        velocityY *= tuning.JUMP_CUT_FACTOR
        isJumping = false
      }

      return { velocityX, velocityY }
    },
  }
}

export type PlatformerController = ReturnType<typeof createPlatformerController>

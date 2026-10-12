import type { MascotDrawOptions, PixelWriter } from '@/types'
import { MASCOT_ARMS, MASCOT_COLORS, MASCOT_LEGS } from './mascot.constants'

/** Local sprite x where the blaster starts — just past the right (gun) arm, which spans x=11-12. */
const BLASTER_X = 13
/** Base y the head/body/arms sit at — `crouch` shifts everything down 1px and shortens the torso. */
const STAND_Y = 8
const CROUCH_Y = STAND_Y + 1

function drawBlaster(writer: PixelWriter, gunArmY: number, aim: 'forward' | 'up'): void {
  if (aim === 'up') {
    writer.fillRect(BLASTER_X, gunArmY, 1, 1, MASCOT_COLORS.BLASTER)
    writer.fillRect(BLASTER_X + 1, gunArmY - 1, 1, 1, MASCOT_COLORS.BLASTER)
    writer.fillRect(BLASTER_X + 2, gunArmY - 2, 1, 1, MASCOT_COLORS.BLASTER_TIP)
    return
  }
  writer.fillRect(BLASTER_X, gunArmY + 1, 3, 1, MASCOT_COLORS.BLASTER)
  writer.fillRect(BLASTER_X + 3, gunArmY + 1, 1, 1, MASCOT_COLORS.BLASTER_TIP)
}

/**
 * Draws the 16x16 mascot sprite — reproduces the owner's original reference
 * run-cycle tables 1:1: white head, cyan body, pose-driven arms/legs, and a
 * tiny blaster in its front (right) hand. `crouch` additionally shifts the
 * head/body down 1px and shortens the torso, so it reads as ducking rather
 * than just "legs bent" (its legs/arms already come from `MASCOT_LEGS.crouch`
 * / `MASCOT_ARMS.crouch`). Takes a `PixelWriter` instead of a
 * `CanvasRenderingContext2D` directly so this is unit-testable with a fake
 * recorder — no real `<canvas>` needed (see `mascot-sprite.test.ts`).
 */
export function drawMascot(writer: PixelWriter, options: MascotDrawOptions = {}): void {
  const { pose = 'idle', blink = false, aim = 'forward' } = options
  const eyeColor = blink ? MASCOT_COLORS.EYE_BLINK : MASCOT_COLORS.EYE
  const crouching = pose === 'crouch'

  // Head — ducks 1px on crouch.
  const headY = crouching ? 3 : 2
  writer.fillRect(5, headY, 6, 6, MASCOT_COLORS.HEAD)

  // Eyes — the mascot always faces right (direction of travel) in this scene.
  writer.fillRect(7, headY + 2, 1, 1, eyeColor)
  writer.fillRect(10, headY + 2, 1, 1, eyeColor)

  // Body — 1px shorter on crouch, so it reads as ducking rather than just bent legs.
  const bodyY = crouching ? CROUCH_Y : STAND_Y
  const bodyHeight = crouching ? 4 : 5
  writer.fillRect(5, bodyY, 6, bodyHeight, MASCOT_COLORS.BODY)

  // Arms — pose-driven run cycle, based off the same (possibly crouched) y. The right arm (x=11) is the gun hand.
  const [armLeft, armRight] = MASCOT_ARMS[pose]
  const armBaseY = crouching ? CROUCH_Y : STAND_Y
  writer.fillRect(3, armBaseY + armLeft, 2, 3, MASCOT_COLORS.ARM)
  writer.fillRect(11, armBaseY + armRight, 2, 3, MASCOT_COLORS.ARM)

  // Legs — pose-driven run cycle.
  for (const [x, y, length] of MASCOT_LEGS[pose]) {
    writer.fillRect(x, y, 2, length, MASCOT_COLORS.BODY)
  }

  if (aim !== 'hidden') drawBlaster(writer, armBaseY + armRight, aim)
}

/** Adapts a real 2D context to `PixelWriter` — `fillRect` needs `fillStyle` set first. */
export function createCanvas2DPixelWriter(ctx: CanvasRenderingContext2D): PixelWriter {
  return {
    fillRect(x, y, w, h, color) {
      ctx.fillStyle = color
      ctx.fillRect(x, y, w, h)
    },
  }
}

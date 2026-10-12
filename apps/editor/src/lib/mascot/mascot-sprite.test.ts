import { describe, expect, it } from 'vitest'

import type { PixelWriter } from '@/types'
import { drawMascot } from './mascot-sprite'
import { MASCOT_COLORS, MASCOT_SPRITE_SIZE } from './mascot.constants'

interface FillRectCall {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
  readonly color: string
}

/** Fake `PixelWriter` recorder — no real `<canvas>`/jsdom needed (Vitest `environment` is `'node'`, see `vite.config.ts`). */
function createRecorder(): PixelWriter & { calls: FillRectCall[] } {
  const calls: FillRectCall[] = []
  return {
    calls,
    fillRect(x, y, w, h, color) {
      calls.push({ x, y, w, h, color })
    },
  }
}

describe('drawMascot', () => {
  it('is drawn on a 16x16 native grid', () => {
    expect(MASCOT_SPRITE_SIZE).toBe(16)
  })

  it('draws the white head at (5,2), 6x6', () => {
    const recorder = createRecorder()
    drawMascot(recorder)
    expect(recorder.calls).toContainEqual({ x: 5, y: 2, w: 6, h: 6, color: MASCOT_COLORS.HEAD })
  })

  it('draws the cyan body at (5,8), 6x5', () => {
    const recorder = createRecorder()
    drawMascot(recorder)
    expect(recorder.calls).toContainEqual({ x: 5, y: 8, w: 6, h: 5, color: MASCOT_COLORS.BODY })
  })

  it('draws both eyes facing right (direction of travel), in black by default', () => {
    const recorder = createRecorder()
    drawMascot(recorder)
    expect(recorder.calls).toContainEqual({ x: 7, y: 4, w: 1, h: 1, color: MASCOT_COLORS.EYE })
    expect(recorder.calls).toContainEqual({ x: 10, y: 4, w: 1, h: 1, color: MASCOT_COLORS.EYE })
  })

  it('draws grey eyes while blinking', () => {
    const recorder = createRecorder()
    drawMascot(recorder, { blink: true })
    expect(recorder.calls).toContainEqual({ x: 7, y: 4, w: 1, h: 1, color: MASCOT_COLORS.EYE_BLINK })
    expect(recorder.calls).toContainEqual({ x: 10, y: 4, w: 1, h: 1, color: MASCOT_COLORS.EYE_BLINK })
  })

  it('draws the idle-pose legs in body color', () => {
    const recorder = createRecorder()
    drawMascot(recorder, { pose: 'idle' })
    expect(recorder.calls).toContainEqual({ x: 6, y: 13, w: 2, h: 3, color: MASCOT_COLORS.BODY })
    expect(recorder.calls).toContainEqual({ x: 9, y: 13, w: 2, h: 3, color: MASCOT_COLORS.BODY })
  })

  it('draws the run0-pose legs, asymmetric per the reference run cycle', () => {
    const recorder = createRecorder()
    drawMascot(recorder, { pose: 'run0' })
    expect(recorder.calls).toContainEqual({ x: 5, y: 13, w: 2, h: 3, color: MASCOT_COLORS.BODY })
    expect(recorder.calls).toContainEqual({ x: 10, y: 13, w: 2, h: 2, color: MASCOT_COLORS.BODY })
  })

  it('draws the jump-pose arms raised, per the reference table', () => {
    const recorder = createRecorder()
    drawMascot(recorder, { pose: 'jump' })
    expect(recorder.calls).toContainEqual({ x: 3, y: 6, w: 2, h: 3, color: MASCOT_COLORS.ARM })
    expect(recorder.calls).toContainEqual({ x: 11, y: 6, w: 2, h: 3, color: MASCOT_COLORS.ARM })
  })

  it('draws a forward-aimed blaster from the front (right) hand by default', () => {
    const recorder = createRecorder()
    drawMascot(recorder, { pose: 'idle' })
    expect(recorder.calls).toContainEqual({ x: 13, y: 9, w: 3, h: 1, color: MASCOT_COLORS.BLASTER })
    expect(recorder.calls).toContainEqual({ x: 16, y: 9, w: 1, h: 1, color: MASCOT_COLORS.BLASTER_TIP })
  })

  it('aims the blaster upward at the flying drone', () => {
    const recorder = createRecorder()
    drawMascot(recorder, { pose: 'idle', aim: 'up' })
    expect(recorder.calls).toContainEqual({ x: 15, y: 6, w: 1, h: 1, color: MASCOT_COLORS.BLASTER_TIP })
  })

  it('hides the blaster when aim is "hidden"', () => {
    const recorder = createRecorder()
    drawMascot(recorder, { pose: 'idle', aim: 'hidden' })
    expect(recorder.calls.some((call) => call.x >= 13)).toBe(false)
  })

  it('ducks the head and shortens the body 1px when crouching, feet staying planted', () => {
    const recorder = createRecorder()
    drawMascot(recorder, { pose: 'crouch' })
    expect(recorder.calls).toContainEqual({ x: 5, y: 3, w: 6, h: 6, color: MASCOT_COLORS.HEAD })
    expect(recorder.calls).toContainEqual({ x: 5, y: 9, w: 6, h: 4, color: MASCOT_COLORS.BODY })
    expect(recorder.calls).toContainEqual({ x: 6, y: 14, w: 2, h: 2, color: MASCOT_COLORS.BODY })
    expect(recorder.calls).toContainEqual({ x: 9, y: 14, w: 2, h: 2, color: MASCOT_COLORS.BODY })
  })
})

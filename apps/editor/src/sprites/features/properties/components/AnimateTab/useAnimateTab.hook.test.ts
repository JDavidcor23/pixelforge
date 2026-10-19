import { describe, expect, it } from 'vitest'

import { nextFrameCount, pickFrameCount } from './useAnimateTab.hook'

describe('pickFrameCount', () => {
  it('keeps the preferred count when the canvas size allows it', () => {
    expect(pickFrameCount(8, [4, 8, 12, 16])).toBe(8)
  })

  it('falls back to the largest allowed count at or below the preferred one', () => {
    expect(pickFrameCount(10, [4, 8, 12, 16])).toBe(8)
  })

  it('falls back to the first option when nothing fits below the preferred count', () => {
    expect(pickFrameCount(2, [4, 8, 12, 16])).toBe(4)
  })
})

describe('nextFrameCount', () => {
  it('snaps to the new motion default when the user never touched the field', () => {
    expect(nextFrameCount(12, false, 4, [4, 8, 12, 16])).toBe(4)
  })

  it("keeps the user's own frame count once they touched the field by hand", () => {
    expect(nextFrameCount(12, true, 4, [4, 8, 12, 16])).toBe(12)
  })

  it('still clamps a touched count that no longer fits the canvas size', () => {
    expect(nextFrameCount(16, true, 4, [4, 8, 12])).toBe(12)
  })
})

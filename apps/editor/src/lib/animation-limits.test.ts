import { describe, expect, it } from 'vitest'

import { allowedFrameCounts, getAnimationFrameCountError, getAnimationSizeError } from './animation-limits'
import {
  ANIMATION_FRAMES_INVALID_ERROR,
  ANIMATION_FRAMES_NOT_MULTIPLE_OF_4_ERROR,
  ANIMATION_FRAMES_OVER_BUDGET_ERROR,
  ANIMATION_NOT_SQUARE_ERROR,
  ANIMATION_TOO_LARGE_ERROR,
} from '@/constants/animation'

describe('animation limits (PixelLab animate-with-text-v3)', () => {
  it('accepts square canvases up to 256 and rejects the rest', () => {
    expect(getAnimationSizeError(128, 128)).toBeNull()
    expect(getAnimationSizeError(256, 256)).toBeNull()
    expect(getAnimationSizeError(128, 64)).toBe(ANIMATION_NOT_SQUARE_ERROR)
    expect(getAnimationSizeError(384, 384)).toBe(ANIMATION_TOO_LARGE_ERROR)
  })

  it('only allows even frame counts from 4 to 16', () => {
    expect(getAnimationFrameCountError(64, 8)).toBeNull()
    expect(getAnimationFrameCountError(64, 7)).toBe(ANIMATION_FRAMES_INVALID_ERROR)
    expect(getAnimationFrameCountError(64, 2)).toBe(ANIMATION_FRAMES_INVALID_ERROR)
    expect(getAnimationFrameCountError(64, 18)).toBe(ANIMATION_FRAMES_INVALID_ERROR)
  })

  it('enforces the w*h*frames <= 524288 pixel budget', () => {
    expect(getAnimationFrameCountError(256, 8)).toBeNull()
    expect(getAnimationFrameCountError(256, 12)).toBe(ANIMATION_FRAMES_OVER_BUDGET_ERROR)
    expect(allowedFrameCounts(256)).toEqual([4, 6, 8])
    expect(allowedFrameCounts(128)).toEqual([4, 6, 8, 12, 16])
  })

  it('keeps the v3 rules when the model is given explicitly', () => {
    expect(getAnimationFrameCountError(64, 6, 'text-v3')).toBeNull()
    expect(getAnimationFrameCountError(256, 12, 'text-v3')).toBe(ANIMATION_FRAMES_OVER_BUDGET_ERROR)
    expect(allowedFrameCounts(256, 'text-v3')).toEqual([4, 6, 8])
  })

  it('only allows multiples of 4 for pixminimax, with no pixel budget', () => {
    expect(getAnimationFrameCountError(128, 8, 'pixminimax')).toBeNull()
    expect(getAnimationFrameCountError(256, 16, 'pixminimax')).toBeNull()
    expect(getAnimationFrameCountError(128, 6, 'pixminimax')).toBe(ANIMATION_FRAMES_NOT_MULTIPLE_OF_4_ERROR)
    expect(getAnimationFrameCountError(128, 20, 'pixminimax')).toBe(ANIMATION_FRAMES_INVALID_ERROR)
    expect(allowedFrameCounts(256, 'pixminimax')).toEqual([4, 8, 12, 16])
  })
})

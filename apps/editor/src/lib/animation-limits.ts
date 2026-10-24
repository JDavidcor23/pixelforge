import {
  ANIMATION_FRAME_OPTIONS,
  ANIMATION_FRAMES_INVALID_ERROR,
  ANIMATION_FRAMES_NOT_MULTIPLE_OF_4_ERROR,
  ANIMATION_FRAMES_OVER_BUDGET_ERROR,
  ANIMATION_NOT_SQUARE_ERROR,
  ANIMATION_TOO_LARGE_ERROR,
  DEFAULT_ANIMATION_MODEL,
  PIXELLAB_MAX_FRAMES,
  PIXELLAB_MAX_SIZE,
  PIXELLAB_MIN_FRAMES,
  PIXELLAB_PIXEL_BUDGET,
  PIXMINIMAX_FRAME_STEP,
} from '../constants/animation'
import type { AnimationModel } from '../types/animation.types'

/*
 * Animation size/frame limits (PixelLab `animate-with-text-v3`, measured
 * 2026-10-12). Shared by the Animate tab (fail before paying) and the
 * `api/ai/pixellab/animate` function (never trust the client) — relative
 * imports only, the Vercel Functions do not resolve the `@/` alias.
 */

/** Null when a `width` x `height` frame can be animated, otherwise the user-facing reason. */
export function getAnimationSizeError(width: number, height: number): string | null {
  if (width !== height) return ANIMATION_NOT_SQUARE_ERROR
  if (width < 1 || width > PIXELLAB_MAX_SIZE) return ANIMATION_TOO_LARGE_ERROR
  return null
}

const isValidFrameCount = (frameCount: number): boolean =>
  Number.isInteger(frameCount) &&
  frameCount % 2 === 0 &&
  frameCount >= PIXELLAB_MIN_FRAMES &&
  frameCount <= PIXELLAB_MAX_FRAMES

const fitsPixelBudget = (size: number, frameCount: number): boolean => size * size * frameCount <= PIXELLAB_PIXEL_BUDGET

/** ADR 0013: pixminimax has no pixel budget but only takes multiples of 4. */
const fitsModel = (size: number, frameCount: number, model: AnimationModel): boolean =>
  model === 'pixminimax' ? frameCount % PIXMINIMAX_FRAME_STEP === 0 : fitsPixelBudget(size, frameCount)

/** Null when `frameCount` frames of `size` x `size` are accepted by `model`, otherwise the user-facing reason. */
export function getAnimationFrameCountError(
  size: number,
  frameCount: number,
  model: AnimationModel = DEFAULT_ANIMATION_MODEL,
): string | null {
  if (!isValidFrameCount(frameCount)) return ANIMATION_FRAMES_INVALID_ERROR
  if (fitsModel(size, frameCount, model)) return null
  return model === 'pixminimax' ? ANIMATION_FRAMES_NOT_MULTIPLE_OF_4_ERROR : ANIMATION_FRAMES_OVER_BUDGET_ERROR
}

/** Frame options `model` accepts at this size (v3 on a 256px canvas tops out at 8). */
export function allowedFrameCounts(size: number, model: AnimationModel = DEFAULT_ANIMATION_MODEL): readonly number[] {
  return ANIMATION_FRAME_OPTIONS.filter((frameCount) => fitsModel(size, frameCount, model))
}

import { ALPHA_TRANSPARENT_THRESHOLD } from '@/constants'
import type { AnimationFrame } from '@/types'

function isLayerDataBlank(data: Uint8ClampedArray): boolean {
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] >= ALPHA_TRANSPARENT_THRESHOLD) return false
  }
  return true
}

/**
 * True only when the sprite has a single frame and every layer in it is
 * fully transparent — i.e. the user hasn't drawn anything yet. Used to
 * decide whether an AI result (Create > Generate, Animate) is safe to apply
 * to the canvas automatically instead of asking the user to confirm.
 */
export function isCanvasBlank(frames: readonly AnimationFrame[]): boolean {
  if (frames.length !== 1) return false
  return frames[0].layers.every((layer) => isLayerDataBlank(layer.pixels.data))
}

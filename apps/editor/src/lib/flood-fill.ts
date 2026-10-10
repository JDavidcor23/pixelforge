import type { PixelBuffer, RgbaColor } from '@/types'
import { cloneBuffer, colorsEqual } from './pixel-buffer'

/**
 * BFS/stack-based 4-connected flood fill over the flat buffer. Traversal
 * order differs from the old row/col object-array version (index-stack
 * instead of coordinate-queue), but the FILLED SET is identical for any
 * 4-connected region — order never affects the final result. Mirrors the
 * Rust surface this will become in phase 5: one clone in, direct byte writes,
 * no per-pixel allocation.
 */
export function floodFill(
  buffer: PixelBuffer,
  startX: number,
  startY: number,
  fillColor: RgbaColor
): PixelBuffer {
  const { w, h, data } = buffer
  const startIdx = (startY * w + startX) * 4
  const targetColor: RgbaColor = {
    r: data[startIdx],
    g: data[startIdx + 1],
    b: data[startIdx + 2],
    a: data[startIdx + 3],
  }

  if (colorsEqual(targetColor, fillColor)) {
    return buffer
  }

  const next = cloneBuffer(buffer)
  const nextData = next.data
  const visited = new Uint8Array(w * h)
  const stack: number[] = [startY * w + startX]

  const matchesTarget = (i: number): boolean =>
    nextData[i] === targetColor.r &&
    nextData[i + 1] === targetColor.g &&
    nextData[i + 2] === targetColor.b &&
    nextData[i + 3] === targetColor.a

  while (stack.length > 0) {
    const pixelIdx = stack.pop()!
    if (pixelIdx < 0 || pixelIdx >= w * h || visited[pixelIdx]) continue

    const x = pixelIdx % w
    const y = (pixelIdx - x) / w
    const byteIdx = pixelIdx * 4

    if (!matchesTarget(byteIdx)) continue

    visited[pixelIdx] = 1
    nextData[byteIdx] = fillColor.r
    nextData[byteIdx + 1] = fillColor.g
    nextData[byteIdx + 2] = fillColor.b
    nextData[byteIdx + 3] = fillColor.a

    if (x + 1 < w) stack.push(pixelIdx + 1)
    if (x - 1 >= 0) stack.push(pixelIdx - 1)
    if (y + 1 < h) stack.push(pixelIdx + w)
    if (y - 1 >= 0) stack.push(pixelIdx - w)
  }

  return next
}

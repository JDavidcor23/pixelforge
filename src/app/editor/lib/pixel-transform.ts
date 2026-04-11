import type { PixelBuffer, RgbaColor } from '@/app/editor/types'
import { createEmptyBuffer } from './pixel-buffer'

/**
 * Applies affine transformation to a floating pixel buffer and bakes it into a new buffer.
 * It uses inverse mapping with Nearest Neighbor interpolation to avoid holes and maintain sharp pixel edges.
 */
export function transformPixels(
  sourcePixels: PixelBuffer,
  sourceRotation: number,
  sourceScaleX: number,
  sourceScaleY: number,
  destWidth: number,
  destHeight: number,
  destOffsetX: number,
  destOffsetY: number
): PixelBuffer {
  const result = createEmptyBuffer(destWidth, destHeight)
  const sourceH = sourcePixels.length
  const sourceW = sourcePixels[0].length

  // Konva rotates around the top-left of the group by default unless offset is changed.
  // Our SelectionOverlay doesn't change the offset, so pivot is (0,0) relative to the group bounds.
  
  const rad = (sourceRotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  for (let destY = 0; destY < destHeight; destY++) {
    for (let destX = 0; destX < destWidth; destX++) {
      // 1. Shift to center relative to the transformation origin
      const tx = destX - destOffsetX
      const ty = destY - destOffsetY

      // 2. Inverse Rotation
      const rx = tx * cos + ty * sin
      const ry = -tx * sin + ty * cos

      // 3. Inverse Scale
      const sx = Math.floor(rx / sourceScaleX)
      const sy = Math.floor(ry / sourceScaleY)

      // 4. Sample
      if (sy >= 0 && sy < sourceH && sx >= 0 && sx < sourceW) {
        const color = sourcePixels[sy][sx]
        if (color.a > 0) {
          result[destY][destX] = color
        }
      }
    }
  }

  return result
}

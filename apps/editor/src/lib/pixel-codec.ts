import type { PixelBuffer, RgbaColor } from '@/types'
import { createEmptyBuffer, putPixel } from './pixel-buffer'

/**
 * Converts a legacy `RgbaColor[][]` buffer (the pre-phase-1 localStorage
 * `sprite-editor-core` shape) into the flat `PixelBuffer`. One-time use: the
 * legacy draft migration. No base64 anywhere in this path (D13) — the result
 * is a native `Uint8ClampedArray`, ready to hand to a `DocumentRepository`.
 */
export function rowsToBuffer(rows: RgbaColor[][]): PixelBuffer {
  const h = rows.length
  const w = rows[0]?.length ?? 0
  const buffer = createEmptyBuffer(w, h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      putPixel(buffer, x, y, rows[y][x])
    }
  }
  return buffer
}

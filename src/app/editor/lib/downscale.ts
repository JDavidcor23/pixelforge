import type { PixelBuffer, RgbaColor } from '@/app/editor/types'

const ALPHA_OPAQUE = 255
const BUCKET_SHIFT = 3 // 5 bits per channel when grouping similar colors

interface BucketStats { count: number; r: number; g: number; b: number }

/**
 * Downscales a pixel buffer by majority vote: each target cell takes the
 * dominant color among all the source pixels it covers. AI-generated pixel
 * art draws "virtual pixels" spanning many real pixels with anti-aliased
 * borders; point-sampling (nearest neighbor) hits borders at random, while
 * majority vote keeps outlines and fills where they actually dominate.
 */
export const downscalePixels = (source: PixelBuffer, size: number): PixelBuffer => {
  const srcH = source.length
  const srcW = source[0]?.length ?? 0
  const out: PixelBuffer = []

  for (let ty = 0; ty < size; ty++) {
    const row: RgbaColor[] = []
    const y0 = Math.floor((ty * srcH) / size)
    const y1 = Math.max(y0 + 1, Math.floor(((ty + 1) * srcH) / size))
    for (let tx = 0; tx < size; tx++) {
      const x0 = Math.floor((tx * srcW) / size)
      const x1 = Math.max(x0 + 1, Math.floor(((tx + 1) * srcW) / size))
      row.push(dominantColor(source, x0, x1, y0, y1))
    }
    out.push(row)
  }
  return out
}

const dominantColor = (
  source: PixelBuffer,
  x0: number, x1: number, y0: number, y1: number,
): RgbaColor => {
  const buckets = new Map<number, BucketStats>()
  let opaque = 0
  let transparent = 0

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const p = source[y][x]
      if (p.a < ALPHA_OPAQUE / 2) { transparent++; continue }
      opaque++
      const key =
        ((p.r >> BUCKET_SHIFT) << 10) |
        ((p.g >> BUCKET_SHIFT) << 5) |
        (p.b >> BUCKET_SHIFT)
      const bucket = buckets.get(key)
      if (bucket) {
        bucket.count++; bucket.r += p.r; bucket.g += p.g; bucket.b += p.b
      } else {
        buckets.set(key, { count: 1, r: p.r, g: p.g, b: p.b })
      }
    }
  }

  if (transparent >= opaque) return { r: 0, g: 0, b: 0, a: 0 }

  let best: BucketStats | null = null
  for (const bucket of buckets.values()) {
    if (!best || bucket.count > best.count) best = bucket
  }
  if (!best) return { r: 0, g: 0, b: 0, a: 0 }
  return {
    r: Math.round(best.r / best.count),
    g: Math.round(best.g / best.count),
    b: Math.round(best.b / best.count),
    a: ALPHA_OPAQUE,
  }
}

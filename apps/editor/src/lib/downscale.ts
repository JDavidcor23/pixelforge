import type { PixelBuffer, RgbaColor } from '@/types'
import { createEmptyBuffer, getPixel, putPixel } from './pixel-buffer'

const ALPHA_OPAQUE = 255
const BUCKET_SHIFT = 3 // 5 bits per channel when grouping similar colors
// Pixels below this alpha are anti-aliased edge blends (the muddy halo AI art
// draws around a sprite), not solid content. Their colour is a mix of the
// subject and whatever sat behind it, so we never let them win a colour vote —
// and a cell made ONLY of them is halo, not sprite, so it keys out entirely.
const CORE_ALPHA_THRESHOLD = 200

const EMPTY_BUFFER: PixelBuffer = { w: 0, h: 0, data: new Uint8ClampedArray(0) }

interface BucketStats { count: number; r: number; g: number; b: number }

/**
 * Downscales a pixel buffer to an arbitrary target width/height by majority
 * vote: each target cell takes the dominant color among all the source
 * pixels it covers. AI-generated pixel art draws "virtual pixels" spanning
 * many real pixels with anti-aliased borders; point-sampling (nearest
 * neighbor) hits borders at random, while majority vote keeps outlines and
 * fills where they actually dominate.
 */
export const downscaleTo = (source: PixelBuffer, targetW: number, targetH: number): PixelBuffer => {
  const srcH = source.h
  const srcW = source.w
  if (srcH === 0 || srcW === 0 || targetW <= 0 || targetH <= 0) return EMPTY_BUFFER

  // Defringe only makes sense when the image actually has solid content: if the
  // whole subject were semi-transparent (no pixel >= CORE_ALPHA_THRESHOLD), the
  // core-only vote would key EVERY cell out. Detect that once and, in that case,
  // fall back to trusting every opaque pixel so the sprite never vanishes.
  const coreAlpha = hasSolidCore(source) ? CORE_ALPHA_THRESHOLD : ALPHA_OPAQUE / 2

  const out = createEmptyBuffer(targetW, targetH)

  for (let ty = 0; ty < targetH; ty++) {
    const y0 = Math.floor((ty * srcH) / targetH)
    const y1 = Math.max(y0 + 1, Math.floor(((ty + 1) * srcH) / targetH))
    for (let tx = 0; tx < targetW; tx++) {
      const x0 = Math.floor((tx * srcW) / targetW)
      const x1 = Math.max(x0 + 1, Math.floor(((tx + 1) * srcW) / targetW))
      putPixel(out, tx, ty, dominantColor(source, x0, x1, y0, y1, coreAlpha))
    }
  }
  return out
}

/** Square-shaped convenience wrapper around {@link downscaleTo}. */
export const downscalePixels = (source: PixelBuffer, size: number): PixelBuffer =>
  downscaleTo(source, size, size)

/**
 * Resizes pixel art with nearest-neighbour sampling. Unlike majority voting it
 * never averages or replaces source colours, so small facial/costume details
 * survive when a generated sheet is normalized to the editor grid.
 */
export const resizeNearest = (source: PixelBuffer, targetW: number, targetH: number): PixelBuffer => {
  const srcH = source.h
  const srcW = source.w
  if (srcH === 0 || srcW === 0 || targetW <= 0 || targetH <= 0) return EMPTY_BUFFER

  const out = createEmptyBuffer(targetW, targetH)
  for (let targetY = 0; targetY < targetH; targetY++) {
    const sourceY = Math.min(srcH - 1, Math.floor(((targetY + 0.5) * srcH) / targetH))
    for (let targetX = 0; targetX < targetW; targetX++) {
      const sourceX = Math.min(srcW - 1, Math.floor(((targetX + 0.5) * srcW) / targetW))
      putPixel(out, targetX, targetY, getPixel(source, sourceX, sourceY))
    }
  }
  return out
}

/** True when at least one pixel is solid enough to trust as sprite core. */
const hasSolidCore = (source: PixelBuffer): boolean => {
  const { data } = source
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] >= CORE_ALPHA_THRESHOLD) return true
  }
  return false
}

const dominantColor = (
  source: PixelBuffer,
  x0: number, x1: number, y0: number, y1: number,
  coreAlpha: number,
): RgbaColor => {
  const { w, data } = source
  const buckets = new Map<number, BucketStats>()
  let opaque = 0
  let transparent = 0
  let core = 0

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4
      const a = data[i + 3]
      if (a < ALPHA_OPAQUE / 2) { transparent++; continue }
      opaque++
      // Only solid-core pixels vote on colour; anti-aliased blends are counted
      // for coverage (opaque) but excluded from the palette so the halo colour
      // can never dominate a cell that also contains real sprite pixels.
      if (a < coreAlpha) continue
      core++
      const r = data[i]; const g = data[i + 1]; const b = data[i + 2]
      const key = ((r >> BUCKET_SHIFT) << 10) | ((g >> BUCKET_SHIFT) << 5) | (b >> BUCKET_SHIFT)
      const bucket = buckets.get(key)
      if (bucket) {
        bucket.count++; bucket.r += r; bucket.g += g; bucket.b += b
      } else {
        buckets.set(key, { count: 1, r, g, b })
      }
    }
  }

  // Majority-transparent cells key out (silhouette edge), and so do cells that
  // are opaque but made purely of soft anti-alias — those are the halo ring.
  if (transparent >= opaque || core === 0) return { r: 0, g: 0, b: 0, a: 0 }

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

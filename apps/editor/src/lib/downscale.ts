import type { PixelBuffer, RgbaColor } from '@/app/editor/types'

const ALPHA_OPAQUE = 255
const BUCKET_SHIFT = 3 // 5 bits per channel when grouping similar colors
// Pixels below this alpha are anti-aliased edge blends (the muddy halo AI art
// draws around a sprite), not solid content. Their colour is a mix of the
// subject and whatever sat behind it, so we never let them win a colour vote —
// and a cell made ONLY of them is halo, not sprite, so it keys out entirely.
const CORE_ALPHA_THRESHOLD = 200

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
  const srcH = source.length
  const srcW = source[0]?.length ?? 0
  if (srcH === 0 || srcW === 0 || targetW <= 0 || targetH <= 0) return []

  // Defringe only makes sense when the image actually has solid content: if the
  // whole subject were semi-transparent (no pixel >= CORE_ALPHA_THRESHOLD), the
  // core-only vote would key EVERY cell out. Detect that once and, in that case,
  // fall back to trusting every opaque pixel so the sprite never vanishes.
  const coreAlpha = hasSolidCore(source, srcW, srcH) ? CORE_ALPHA_THRESHOLD : ALPHA_OPAQUE / 2

  const out: PixelBuffer = []

  for (let ty = 0; ty < targetH; ty++) {
    const row: RgbaColor[] = []
    const y0 = Math.floor((ty * srcH) / targetH)
    const y1 = Math.max(y0 + 1, Math.floor(((ty + 1) * srcH) / targetH))
    for (let tx = 0; tx < targetW; tx++) {
      const x0 = Math.floor((tx * srcW) / targetW)
      const x1 = Math.max(x0 + 1, Math.floor(((tx + 1) * srcW) / targetW))
      row.push(dominantColor(source, x0, x1, y0, y1, coreAlpha))
    }
    out.push(row)
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
  const srcH = source.length
  const srcW = source[0]?.length ?? 0
  if (srcH === 0 || srcW === 0 || targetW <= 0 || targetH <= 0) return []

  return Array.from({ length: targetH }, (_, targetY) => {
    const sourceY = Math.min(srcH - 1, Math.floor(((targetY + 0.5) * srcH) / targetH))
    return Array.from({ length: targetW }, (_, targetX) => {
      const sourceX = Math.min(srcW - 1, Math.floor(((targetX + 0.5) * srcW) / targetW))
      return { ...source[sourceY][sourceX] }
    })
  })
}

/** True when at least one pixel is solid enough to trust as sprite core. */
const hasSolidCore = (source: PixelBuffer, width: number, height: number): boolean => {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (source[y][x].a >= CORE_ALPHA_THRESHOLD) return true
    }
  }
  return false
}

const dominantColor = (
  source: PixelBuffer,
  x0: number, x1: number, y0: number, y1: number,
  coreAlpha: number,
): RgbaColor => {
  const buckets = new Map<number, BucketStats>()
  let opaque = 0
  let transparent = 0
  let core = 0

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const p = source[y][x]
      if (p.a < ALPHA_OPAQUE / 2) { transparent++; continue }
      opaque++
      // Only solid-core pixels vote on colour; anti-aliased blends are counted
      // for coverage (opaque) but excluded from the palette so the halo colour
      // can never dominate a cell that also contains real sprite pixels.
      if (p.a < coreAlpha) continue
      core++
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

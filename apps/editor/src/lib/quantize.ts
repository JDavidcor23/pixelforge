import type { PixelBuffer, QuantizeOptions } from '@/types'
import { QUANTIZE_DEFAULTS } from '@/constants'
import { cloneBuffer } from './pixel-buffer'

interface Centroid { r: number; g: number; b: number }
interface WeightedPoint extends Centroid { w: number }

const saturation = (r: number, g: number, b: number): number => {
  const mx = Math.max(r, g, b); const mn = Math.min(r, g, b)
  return mx === 0 ? 0 : (mx - mn) / mx
}
const dist2 = (a: Centroid, b: Centroid): number =>
  (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2
const nearest = (palette: Centroid[], p: Centroid): Centroid => {
  let best = palette[0]; let bestD = Infinity
  for (const c of palette) { const d = dist2(c, p); if (d < bestD) { bestD = d; best = c } }
  return best
}
const buildPalette = (points: WeightedPoint[], k: number, iterations: number): Centroid[] => {
  if (points.length === 0) return []
  const centroids: Centroid[] = []
  let first = points[0]
  for (const p of points) if (p.w > first.w) first = p
  centroids.push({ r: first.r, g: first.g, b: first.b })
  while (centroids.length < k) {
    let best: WeightedPoint | null = null; let bestScore = -1
    for (const p of points) {
      let dmin = Infinity
      for (const c of centroids) { const d = dist2(c, p); if (d < dmin) dmin = d }
      const score = dmin * p.w
      if (score > bestScore) { bestScore = score; best = p }
    }
    if (!best) break
    centroids.push({ r: best.r, g: best.g, b: best.b })
  }
  for (let it = 0; it < iterations; it++) {
    const sums = centroids.map(() => ({ r: 0, g: 0, b: 0, w: 0 }))
    for (const p of points) {
      let bi = 0; let bd = Infinity
      for (let i = 0; i < centroids.length; i++) { const d = dist2(centroids[i], p); if (d < bd) { bd = d; bi = i } }
      const s = sums[bi]; s.r += p.r * p.w; s.g += p.g * p.w; s.b += p.b * p.w; s.w += p.w
    }
    for (let i = 0; i < centroids.length; i++) {
      if (sums[i].w > 0) centroids[i] = {
        r: Math.round(sums[i].r / sums[i].w),
        g: Math.round(sums[i].g / sums[i].w),
        b: Math.round(sums[i].b / sums[i].w),
      }
    }
  }
  return centroids
}

export const quantizePixels = (buffer: PixelBuffer, opts: QuantizeOptions): PixelBuffer => {
  const { colors, weightBySaturation, iterations, alphaThreshold } = opts
  const k = QUANTIZE_DEFAULTS.SATURATION_WEIGHT
  const { data } = buffer
  const points: WeightedPoint[] = []

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < alphaThreshold) continue
    const r = data[i]; const g = data[i + 1]; const b = data[i + 2]
    const w = weightBySaturation ? 1 + k * saturation(r, g, b) : 1
    points.push({ r, g, b, w })
  }

  const palette = buildPalette(points, colors, iterations)
  const out = cloneBuffer(buffer)
  const outData = out.data

  for (let i = 0; i < outData.length; i += 4) {
    const a = outData[i + 3]
    if (a < alphaThreshold) continue
    const c = nearest(palette, { r: outData[i], g: outData[i + 1], b: outData[i + 2] })
    outData[i] = c.r
    outData[i + 1] = c.g
    outData[i + 2] = c.b
  }

  return out
}

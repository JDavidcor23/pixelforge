import type { PixelBuffer, RgbaColor, CodexGenerationResult } from '@/app/editor/types'
import {
  CODEX_GENERATE_ROUTE,
  QUANTIZE_DEFAULTS,
  ALPHA_TRANSPARENT_THRESHOLD,
  ANIMATION_DEFAULT_CONTENT_RATIO,
  ANIMATION_MAX_CONTENT_RATIO,
  ANIMATION_MIN_CONTENT_RATIO,
  FRAME_RUN_SPLIT_FACTOR,
  FRAME_SPLIT_SEARCH_RATIO,
  GAP_CONTENT_RATIO,
  MIN_FRAME_WIDTH,
} from '@/app/editor/constants'
import { base64ToNativePixels } from './pixellab-utils'
import { downscaleTo, resizeNearest } from './downscale'
import { quantizePixels } from './quantize'
import { removeBackground } from './chroma-key'

const TRANSPARENT_PIXEL: RgbaColor = { r: 0, g: 0, b: 0, a: 0 }
type FrameSpan = readonly [x0: number, x1: number] // both inclusive, native-resolution columns

export async function generateSpriteWithCodex(
  prompt: string,
  referenceBase64?: string,
  prependBase = true,
): Promise<CodexGenerationResult> {
  const res = await fetch(CODEX_GENERATE_ROUTE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, referenceBase64, prependBase }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Codex generation failed')
  }
  return res.json()
}

/** Bounding box (inclusive) of pixels above the transparency threshold, or null if empty. */
const contentBox = (pixels: PixelBuffer): [x0: number, y0: number, x1: number, y1: number] | null => {
  const height = pixels.length
  const width = pixels[0]?.length ?? 0
  let x0 = width
  let y0 = height
  let x1 = -1
  let y1 = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[y][x].a < ALPHA_TRANSPARENT_THRESHOLD) continue
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  return x1 < x0 ? null : [x0, y0, x1, y1]
}

/**
 * Fits a keyed sprite into a transparent size x size buffer WITHOUT distorting
 * its aspect ratio: crop to content, scale so the longer side fills `size`, then
 * center. Codex (and user uploads) frame sprites at arbitrary aspect ratios; the
 * old `downscalePixels(keyed, size)` forced a square and squashed anything tall or
 * wide. This mirrors what the animation sheet path already does per frame.
 */
const fitSpriteCentered = (keyed: PixelBuffer, size: number): PixelBuffer => {
  const box = contentBox(keyed)
  if (!box) return composeCentered([], size)
  const [x0, y0, x1, y1] = box
  const boxW = x1 - x0 + 1
  const boxH = y1 - y0 + 1
  const scale = size / Math.max(boxW, boxH)
  const targetW = Math.max(1, Math.min(size, Math.round(boxW * scale)))
  const targetH = Math.max(1, Math.min(size, Math.round(boxH * scale)))
  const cropped = cropRegion(keyed, x0, x1, y0, y1)
  const scaled = downscaleTo(cropped, targetW, targetH)
  return composeCentered(scaled, size)
}

/** Decode to the selected grid size (aspect-preserving fit) with optional palette cleanup. */
export async function decodeToPixels(base64: string, size: number, quantize: boolean): Promise<PixelBuffer> {
  const native = await base64ToNativePixels(base64)
  const keyed = removeBackground(native)
  const pixels = fitSpriteCentered(keyed, size)
  return quantizeIfNeeded(pixels, quantize)
}

/**
 * Detects which native-resolution columns of `keyed` contain sprite content.
 * A column counts as content when at least `GAP_CONTENT_RATIO` of its pixels
 * are opaque (alpha >= ALPHA_TRANSPARENT_THRESHOLD); everything else is a gap
 * between frames. Relies on `keyed` already having a transparent background
 * (via removeBackground) — detection is done on alpha, never on color.
 */
const countContentByColumn = (keyed: PixelBuffer, width: number, height: number): number[] => {
  const minContentPixels = height * GAP_CONTENT_RATIO
  const columns: number[] = []
  for (let x = 0; x < width; x++) {
    let opaque = 0
    for (let y = 0; y < height; y++) {
      if (keyed[y][x].a >= ALPHA_TRANSPARENT_THRESHOLD) opaque++
    }
    columns.push(opaque >= minContentPixels ? opaque : 0)
  }
  return columns
}

/** Groups runs of content columns into frame spans, discarding runs narrower than MIN_FRAME_WIDTH (noise). */
const groupContentColumnsIntoFrames = (contentColumns: number[]): FrameSpan[] => {
  const frames: FrameSpan[] = []
  let runStart = -1
  for (let x = 0; x < contentColumns.length; x++) {
    if (contentColumns[x] > 0) {
      if (runStart === -1) runStart = x
      continue
    }
    if (runStart !== -1) {
      if (x - 1 - runStart + 1 >= MIN_FRAME_WIDTH) frames.push([runStart, x - 1])
      runStart = -1
    }
  }
  if (runStart !== -1 && contentColumns.length - 1 - runStart + 1 >= MIN_FRAME_WIDTH) {
    frames.push([runStart, contentColumns.length - 1])
  }
  return frames
}

const median = (values: number[]): number => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

/** Partitions a connected span at low-occupancy valleys near equal cell boundaries. */
const partitionSpanAtValleys = (
  span: FrameSpan,
  parts: number,
  columnContent: number[],
): FrameSpan[] => {
  if (parts <= 1) return [span]
  const [x0, x1] = span
  const spanWidth = x1 - x0 + 1
  if (spanWidth < parts * MIN_FRAME_WIDTH) return [span]

  const boundaries: number[] = []
  let previousBoundary = x0 - 1
  for (let part = 1; part < parts; part++) {
    const ideal = x0 + Math.round((part * spanWidth) / parts) - 1
    const cellWidth = spanWidth / parts
    const radius = Math.max(1, Math.round(cellWidth * FRAME_SPLIT_SEARCH_RATIO))
    const remainingParts = parts - part
    const searchStart = Math.max(previousBoundary + MIN_FRAME_WIDTH, ideal - radius)
    const searchEnd = Math.min(x1 - remainingParts * MIN_FRAME_WIDTH, ideal + radius)

    let best = searchStart
    for (let x = searchStart + 1; x <= searchEnd; x++) {
      const isLower = columnContent[x] < columnContent[best]
      const isEquallyLowAndCloser =
        columnContent[x] === columnContent[best] && Math.abs(x - ideal) < Math.abs(best - ideal)
      if (isLower || isEquallyLowAndCloser) best = x
    }
    boundaries.push(best)
    previousBoundary = best
  }

  const frames: FrameSpan[] = []
  let start = x0
  for (const boundary of boundaries) {
    frames.push([start, boundary])
    start = boundary + 1
  }
  frames.push([start, x1])
  return frames
}

/**
 * Repairs content-run detection when neighbouring poses touch. Wide outliers
 * are split at projection valleys; if Codex returned fewer connected runs than
 * requested, the widest runs are split until the requested minimum is met.
 */
const repairTouchingFrameSpans = (
  detected: FrameSpan[],
  columnContent: number[],
  nFrames: number,
): FrameSpan[] => {
  if (detected.length === 0 || detected.length === nFrames) return detected

  // Codex can over-generate poses (for example, eight poses for a four-frame
  // request). Repair suspicious wide runs before evenly sampling them, or a
  // selected sample can still contain two joined poses.
  if (detected.length > nFrames) {
    const widths = detected.map(([x0, x1]) => x1 - x0 + 1)
    const typicalWidth = median(widths)
    return detected.flatMap((span) => {
      const width = span[1] - span[0] + 1
      const estimatedParts = Math.max(1, Math.round(width / typicalWidth))
      return width > typicalWidth * FRAME_RUN_SPLIT_FACTOR
        ? partitionSpanAtValleys(span, estimatedParts, columnContent)
        : [span]
    })
  }

  // A single connected run has no independent width sample from which to
  // estimate a typical frame. In that case the requested frame count is the
  // only useful partition signal.
  if (detected.length === 1) {
    return partitionSpanAtValleys(detected[0], nFrames, columnContent)
  }

  let repaired = detected
  while (repaired.length < nFrames) {
    const widths = repaired.map(([x0, x1]) => x1 - x0 + 1)
    const typicalWidth = median(widths)
    let widestIndex = 0
    for (let i = 1; i < repaired.length; i++) {
      const currentWidth = repaired[i][1] - repaired[i][0] + 1
      const widestWidth = repaired[widestIndex][1] - repaired[widestIndex][0] + 1
      if (currentWidth > widestWidth) widestIndex = i
    }

    const widestWidth = repaired[widestIndex][1] - repaired[widestIndex][0] + 1
    // Do not cut a legitimate broad pose merely because Codex generated fewer
    // poses than requested. A width outlier is the evidence that two poses
    // were actually joined; without it, returning fewer complete frames is
    // safer than inventing two cropped frames from one pose.
    if (widestWidth <= typicalWidth * FRAME_RUN_SPLIT_FACTOR) break

    const split = partitionSpanAtValleys(repaired[widestIndex], 2, columnContent)
    if (split.length === 1) break
    repaired = [...repaired.slice(0, widestIndex), ...split, ...repaired.slice(widestIndex + 1)]
  }

  return repaired
}

/**
 * Resamples `frameCount` detected frames down to the `nFrames` requested by
 * the caller, picking equally spaced indices. Codex tends to over-generate
 * (e.g. asked for 4, draws 8), so this is normally a downsample. If Codex
 * under-generates, we cannot invent missing frames — every detected frame is
 * returned instead (caller ends up with fewer frames than requested).
 */
const resampleFrameIndices = (frameCount: number, nFrames: number): number[] => {
  if (frameCount >= nFrames) {
    return Array.from({ length: nFrames }, (_, i) => Math.min(frameCount - 1, Math.round((i * frameCount) / nFrames)))
  }
  return Array.from({ length: frameCount }, (_, i) => i)
}

/** Returns the [top, bottom] rows (inclusive) that contain content within the given column range, or null if none. */
const contentRowBounds = (keyed: PixelBuffer, x0: number, x1: number, height: number): [number, number] | null => {
  let top = -1
  let bottom = -1
  for (let y = 0; y < height; y++) {
    let hasContent = false
    for (let x = x0; x <= x1; x++) {
      if (keyed[y][x].a >= ALPHA_TRANSPARENT_THRESHOLD) { hasContent = true; break }
    }
    if (hasContent) {
      if (top === -1) top = y
      bottom = y
    }
  }
  return top === -1 ? null : [top, bottom]
}

/** Union of the content row bounds across every chosen frame, so all frames share one vertical crop band. */
const sharedVerticalBand = (keyed: PixelBuffer, chosen: FrameSpan[], height: number): [number, number] => {
  let yTop = Infinity
  let yBot = -Infinity
  for (const [x0, x1] of chosen) {
    const bounds = contentRowBounds(keyed, x0, x1, height)
    if (!bounds) continue
    yTop = Math.min(yTop, bounds[0])
    yBot = Math.max(yBot, bounds[1])
  }
  // No content found anywhere (shouldn't happen post removeBackground) — fall back to full height.
  return yTop === Infinity ? [0, height - 1] : [yTop, yBot]
}

/** Crops `keyed` to [x0..x1] x [yTop..yBot] (all inclusive). */
const cropRegion = (keyed: PixelBuffer, x0: number, x1: number, yTop: number, yBot: number): PixelBuffer =>
  keyed.slice(yTop, yBot + 1).map((row) => row.slice(x0, x1 + 1))

/** Composes `scaled` centered (horizontally and vertically) into a transparent size x size buffer. */
const composeCentered = (scaled: PixelBuffer, size: number): PixelBuffer => {
  const buffer: PixelBuffer = Array.from({ length: size }, () =>
    Array.from({ length: size }, (): RgbaColor => ({ ...TRANSPARENT_PIXEL })),
  )
  const dh = scaled.length
  const dw = scaled[0]?.length ?? 0
  const offsetX = Math.floor((size - dw) / 2)
  const offsetY = Math.floor((size - dh) / 2)
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const ty = y + offsetY
      const tx = x + offsetX
      if (ty < 0 || ty >= size || tx < 0 || tx >= size) continue
      buffer[ty][tx] = scaled[y][x]
    }
  }
  return buffer
}

const quantizeIfNeeded = (pixels: PixelBuffer, quantize: boolean): PixelBuffer =>
  quantize
    ? quantizePixels(pixels, {
        colors: QUANTIZE_DEFAULTS.COLORS,
        weightBySaturation: true,
        iterations: QUANTIZE_DEFAULTS.ITERATIONS,
        alphaThreshold: QUANTIZE_DEFAULTS.ALPHA_THRESHOLD,
      })
    : pixels

const contentBounds = (pixels: PixelBuffer): { width: number; height: number } | null => {
  const height = pixels.length
  const width = pixels[0]?.length ?? 0
  let left = width
  let right = -1
  let top = height
  let bottom = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[y][x].a < ALPHA_TRANSPARENT_THRESHOLD) continue
      left = Math.min(left, x)
      right = Math.max(right, x)
      top = Math.min(top, y)
      bottom = Math.max(bottom, y)
    }
  }
  return right < left ? null : { width: right - left + 1, height: bottom - top + 1 }
}

const measureReferenceOccupancy = (reference: PixelBuffer): number => {
  const bounds = contentBounds(reference)
  const height = reference.length
  const width = reference[0]?.length ?? 0
  if (!bounds || width === 0 || height === 0) return ANIMATION_DEFAULT_CONTENT_RATIO
  const measured = Math.max(bounds.width / width, bounds.height / height)
  return Math.min(ANIMATION_MAX_CONTENT_RATIO, Math.max(ANIMATION_MIN_CONTENT_RATIO, measured))
}

/** Pure sheet normalization, exported so the separator can be regression-tested without browser Image APIs. */
export const normalizeSheetFrames = (
  keyed: PixelBuffer,
  nFrames: number,
  size: number,
  quantize: boolean,
  targetContentRatio: number = ANIMATION_DEFAULT_CONTENT_RATIO,
): PixelBuffer[] => {
  const srcHeight = keyed.length
  const srcWidth = keyed[0]?.length ?? 0
  if (srcHeight === 0 || srcWidth === 0 || nFrames <= 0 || size <= 0) return []

  const columnContent = countContentByColumn(keyed, srcWidth, srcHeight)
  const detectedFrames = groupContentColumnsIntoFrames(columnContent)
  const repairedFrames = repairTouchingFrameSpans(detectedFrames, columnContent, nFrames)
  const chosenIndices = resampleFrameIndices(repairedFrames.length, nFrames)
  const chosenFrames = chosenIndices.map((i) => repairedFrames[i])
  if (chosenFrames.length === 0) return []

  const [yTop, yBot] = sharedVerticalBand(keyed, chosenFrames, srcHeight)
  const bandHeight = yBot - yTop + 1
  const maxFrameWidth = Math.max(...chosenFrames.map(([x0, x1]) => x1 - x0 + 1))
  const safeContentRatio = Math.min(ANIMATION_MAX_CONTENT_RATIO, Math.max(ANIMATION_MIN_CONTENT_RATIO, targetContentRatio))
  const targetExtent = Math.max(1, Math.round(size * safeContentRatio))
  const scale = targetExtent / Math.max(bandHeight, maxFrameWidth)

  return chosenFrames.map(([x0, x1]) => {
    const frameWidth = x1 - x0 + 1
    const targetW = Math.max(1, Math.round(frameWidth * scale))
    const targetH = Math.max(1, Math.round(bandHeight * scale))
    const region = cropRegion(keyed, x0, x1, yTop, yBot)
    const scaled = resizeNearest(region, targetW, targetH)
    const composed = composeCentered(scaled, size)
    return quantizeIfNeeded(composed, quantize)
  })
}

/**
 * Decodes a Codex-generated walk-cycle sheet (one horizontal row with
 * roughly `nFrames` frames of the same character) into `nFrames` individual
 * PixelBuffers, downscaled to `size` and optionally quantized.
 *
 * Frames are detected by scanning native-resolution columns for content gaps.
 * Suspiciously wide runs are split at low-content valleys, which handles a
 * fist, cape, or effect touching the next pose. All chosen frames share one
 * vertical crop band and one scale factor derived from the reference sprite's
 * occupancy, so the character keeps its original relative size without pose
 * jitter. Nearest-neighbour sampling preserves source palette and hard edges.
 *
 * KNOWN LIMITATION (v1): detection relies on `removeBackground` having fully
 * keyed out the background first. If the character touches the image border
 * (so removeBackground's flood-fill can't reach the background behind it) or
 * the background wasn't cleanly removed, some columns may be misclassified
 * and frame detection can merge or split frames incorrectly.
 */
export async function decodeSheetToFrames(
  base64: string,
  nFrames: number,
  size: number,
  quantize: boolean,
  referenceBase64?: string,
): Promise<PixelBuffer[]> {
  const native: PixelBuffer = await base64ToNativePixels(base64)
  const keyed = removeBackground(native)
  let targetContentRatio = ANIMATION_DEFAULT_CONTENT_RATIO
  if (referenceBase64) {
    const reference = removeBackground(await base64ToNativePixels(referenceBase64))
    targetContentRatio = measureReferenceOccupancy(reference)
  }
  return normalizeSheetFrames(keyed, nFrames, size, quantize, targetContentRatio)
}

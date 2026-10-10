import type { PixelBuffer } from '@/types'
import { ALPHA_TRANSPARENT_THRESHOLD, QUANTIZE_DEFAULTS } from '@/constants'
import { base64ToNativePixels } from './image-decode'
import { downscaleTo, resizeNearest } from './downscale'
import { quantizePixels } from './quantize'
import { createEmptyBuffer } from './pixel-buffer'

/**
 * Pixel processing for images that arrive from OUTSIDE the editor — user file
 * imports, mainly. Generated sprites do not come through here: Retro Diffusion
 * already returns them at grid size with real alpha, so
 * `decodeGeneratedSprite` uses those verbatim.
 *
 * There is deliberately NO background removal in this file. Generated sprites
 * arrive with true alpha, so no flood-fill chroma key, halo erosion or colour
 * tolerance heuristic is needed anywhere in the app — do not add one back.
 *
 * Consequence to be aware of: a user importing a PNG that still has a solid
 * background keeps that background. It is imported faithfully rather than
 * guessed at.
 */

const EMPTY_BUFFER: PixelBuffer = { w: 0, h: 0, data: new Uint8ClampedArray(0) }

/** Bounding box (inclusive) of pixels above the transparency threshold, or null if empty. */
const contentBox = (pixels: PixelBuffer): [x0: number, y0: number, x1: number, y1: number] | null => {
  const { w: width, h: height, data } = pixels
  let x0 = width
  let y0 = height
  let x1 = -1
  let y1 = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] < ALPHA_TRANSPARENT_THRESHOLD) continue
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  return x1 < x0 ? null : [x0, y0, x1, y1]
}

/** Crops to [x0..x1] x [y0..y1], all inclusive. Exported: reused by retro-diffusion-utils sheet slicing. */
export const cropRegion = (pixels: PixelBuffer, x0: number, x1: number, y0: number, y1: number): PixelBuffer => {
  const width = x1 - x0 + 1
  const height = y1 - y0 + 1
  if (width <= 0 || height <= 0) return EMPTY_BUFFER

  const out = createEmptyBuffer(width, height)
  const srcW = pixels.w
  for (let y = 0; y < height; y++) {
    const srcRowStart = ((y0 + y) * srcW + x0) * 4
    const dstRowStart = y * width * 4
    out.data.set(pixels.data.subarray(srcRowStart, srcRowStart + width * 4), dstRowStart)
  }
  return out
}

/** Composes `scaled` centered into a transparent size x size buffer. */
const composeCentered = (scaled: PixelBuffer, size: number): PixelBuffer => {
  const buffer = createEmptyBuffer(size, size)
  const sourceHeight = scaled.h
  const sourceWidth = scaled.w
  const offsetX = Math.floor((size - sourceWidth) / 2)
  const offsetY = Math.floor((size - sourceHeight) / 2)

  for (let y = 0; y < sourceHeight; y++) {
    const targetY = y + offsetY
    if (targetY < 0 || targetY >= size) continue
    const visibleX0 = Math.max(0, -offsetX)
    const visibleX1 = Math.min(sourceWidth, size - offsetX)
    if (visibleX1 <= visibleX0) continue

    const srcRowStart = (y * sourceWidth + visibleX0) * 4
    const dstRowStart = (targetY * size + (offsetX + visibleX0)) * 4
    buffer.data.set(
      scaled.data.subarray(srcRowStart, srcRowStart + (visibleX1 - visibleX0) * 4),
      dstRowStart
    )
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

/**
 * Fits a sprite into a transparent size x size buffer WITHOUT distorting its
 * aspect ratio: crop to content, scale so the longer side fills `size`, center.
 */
const fitSpriteCentered = (pixels: PixelBuffer, size: number): PixelBuffer => {
  const box = contentBox(pixels)
  if (!box) return composeCentered(EMPTY_BUFFER, size)
  const [x0, y0, x1, y1] = box
  const boxWidth = x1 - x0 + 1
  const boxHeight = y1 - y0 + 1
  const scale = size / Math.max(boxWidth, boxHeight)
  const targetWidth = Math.max(1, Math.min(size, Math.round(boxWidth * scale)))
  const targetHeight = Math.max(1, Math.min(size, Math.round(boxHeight * scale)))
  const cropped = cropRegion(pixels, x0, x1, y0, y1)
  return composeCentered(downscaleTo(cropped, targetWidth, targetHeight), size)
}

/** Decodes an imported image to the target grid size, aspect preserved. */
export async function decodeToPixels(base64: string, size: number, quantize: boolean): Promise<PixelBuffer> {
  const native: PixelBuffer = await base64ToNativePixels(base64)
  return quantizeIfNeeded(fitSpriteCentered(native, size), quantize)
}

/**
 * Cuts an imported sprite sheet into `frameCount` frames.
 *
 * The user declares the frame count, and sheets are laid out as one horizontal
 * row of equal cells, so the cut is `sheetWidth / frameCount` — plain division.
 * No gap scanning, valley splitting or run repair: a declared frame count makes
 * layout detection unnecessary, and detection was never reliable anyway.
 *
 * Every frame shares one scale factor, so the character does not jitter in size
 * between poses.
 */
export async function decodeSheetToFrames(
  base64: string,
  frameCount: number,
  size: number,
  quantize: boolean,
): Promise<PixelBuffer[]> {
  const sheet: PixelBuffer = await base64ToNativePixels(base64)
  const sheetHeight = sheet.h
  const sheetWidth = sheet.w
  if (sheetHeight === 0 || sheetWidth === 0 || frameCount <= 0 || size <= 0) return []

  const cellWidth = Math.floor(sheetWidth / frameCount)
  if (cellWidth < 1) return []

  const scale = size / Math.max(cellWidth, sheetHeight)
  const targetWidth = Math.max(1, Math.min(size, Math.round(cellWidth * scale)))
  const targetHeight = Math.max(1, Math.min(size, Math.round(sheetHeight * scale)))

  const frames: PixelBuffer[] = []
  for (let index = 0; index < frameCount; index++) {
    const x0 = index * cellWidth
    const region = cropRegion(sheet, x0, x0 + cellWidth - 1, 0, sheetHeight - 1)
    // Nearest-neighbour keeps hard pixel edges and the source palette intact.
    const scaled = resizeNearest(region, targetWidth, targetHeight)
    frames.push(quantizeIfNeeded(composeCentered(scaled, size), quantize))
  }
  return frames
}

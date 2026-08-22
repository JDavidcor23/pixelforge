import type { PixelBuffer, RgbaColor } from '@/app/editor/types'
import { ALPHA_TRANSPARENT_THRESHOLD, QUANTIZE_DEFAULTS } from '@/app/editor/constants'
import { base64ToNativePixels } from './image-decode'
import { downscaleTo, resizeNearest } from './downscale'
import { quantizePixels } from './quantize'

/**
 * Pixel processing for images that arrive from OUTSIDE the editor — user file
 * imports, mainly. Generated sprites do not come through here: Retro Diffusion
 * already returns them at grid size with real alpha, so
 * `decodeGeneratedSprite` uses those verbatim.
 *
 * There is deliberately no background removal in this file. It used to run a
 * flood-fill chroma key to strip the opaque fill that Codex produced (gpt-image-2
 * cannot output alpha at all). Retro Diffusion returns true alpha, so the guessing
 * is gone — and with it the halo erosion, the tolerance constants, and the
 * column-projection frame detection that only existed to survive it.
 *
 * Consequence to be aware of: a user importing a PNG that still has a solid
 * background now keeps that background. It is imported faithfully rather than
 * guessed at.
 */

const TRANSPARENT_PIXEL: RgbaColor = { r: 0, g: 0, b: 0, a: 0 }

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

/** Crops to [x0..x1] x [y0..y1], all inclusive. */
const cropRegion = (pixels: PixelBuffer, x0: number, x1: number, y0: number, y1: number): PixelBuffer =>
  pixels.slice(y0, y1 + 1).map((row) => row.slice(x0, x1 + 1))

/** Composes `scaled` centered into a transparent size x size buffer. */
const composeCentered = (scaled: PixelBuffer, size: number): PixelBuffer => {
  const buffer: PixelBuffer = Array.from({ length: size }, () =>
    Array.from({ length: size }, (): RgbaColor => ({ ...TRANSPARENT_PIXEL })),
  )
  const sourceHeight = scaled.length
  const sourceWidth = scaled[0]?.length ?? 0
  const offsetX = Math.floor((size - sourceWidth) / 2)
  const offsetY = Math.floor((size - sourceHeight) / 2)
  for (let y = 0; y < sourceHeight; y++) {
    for (let x = 0; x < sourceWidth; x++) {
      const targetY = y + offsetY
      const targetX = x + offsetX
      if (targetY < 0 || targetY >= size || targetX < 0 || targetX >= size) continue
      buffer[targetY][targetX] = scaled[y][x]
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

/**
 * Fits a sprite into a transparent size x size buffer WITHOUT distorting its
 * aspect ratio: crop to content, scale so the longer side fills `size`, center.
 */
const fitSpriteCentered = (pixels: PixelBuffer, size: number): PixelBuffer => {
  const box = contentBox(pixels)
  if (!box) return composeCentered([], size)
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
 * This replaces the old detector that scanned column occupancy for gaps, split
 * suspiciously wide runs at projection valleys and resampled over-generated
 * poses. All ~250 lines of that existed to cope with a sheet drawn by an agent
 * at an unpredictable layout; a declared frame count needs none of it.
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
  const sheetHeight = sheet.length
  const sheetWidth = sheet[0]?.length ?? 0
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

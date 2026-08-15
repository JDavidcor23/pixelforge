import type { PixelBuffer, RgbaColor } from '@/app/editor/types'
import {
  ALPHA_TRANSPARENT_THRESHOLD,
  CHROMA_KEY_TOLERANCE,
  CHROMA_FRINGE_TOLERANCE,
  CHROMA_FRINGE_PASSES,
} from '@/app/editor/constants'

const ALPHA_TRANSPARENT = 0

/**
 * Removes a solid, non-deterministic background color (magenta, white, green, etc.)
 * from Codex-generated pixel art that came back WITHOUT transparency.
 *
 * Algorithm (validated on a real sheet: 73.8% removed on both magenta and white
 * backgrounds, vs. 82.9% for naive global color-match, which ate into
 * same-colored character pixels):
 *
 * 1. Skip entirely if the image is already transparent (sampled from the border).
 * 2. Detect the background color as the average RGB of the 4 corners.
 * 3. Iterative flood-fill (queue, NOT recursion — native images can be ~2000px
 *    and would blow the call stack) seeded from every border pixel within
 *    `tolerance` of the background color, expanding to 4-neighbors also within
 *    tolerance. Visited pixels get `a = 0`.
 *
 * Flood-fill (not global match) is required because the background color is
 * unpredictable and can collide with colors inside the character (e.g. a white
 * background sitting next to white highlights on the sprite). Global match would
 * erase those highlights; flood-fill can't reach them because the background is
 * always connected to the image border while the character is walled off from
 * it by its own outline.
 *
 * KNOWN LIMITATION (v1): if the character touches the image border with a color
 * close to the background color, the flood-fill can leak inward through that
 * point. Unlikely with centered sprites, which is Codex's default framing.
 */
export function removeBackground(pixels: PixelBuffer, tolerance: number = CHROMA_KEY_TOLERANCE): PixelBuffer {
  const height = pixels.length
  const width = pixels[0]?.length ?? 0
  if (height === 0 || width === 0) return pixels

  if (isAlreadyTransparent(pixels, width, height)) return pixels

  const out: PixelBuffer = pixels.map((row) => row.map((p) => ({ ...p })))
  const background = averageCornerColor(pixels, width, height)
  const visited = new Uint8Array(width * height)
  const queue: number[] = []

  const trySeed = (x: number, y: number): void => {
    const idx = y * width + x
    if (visited[idx]) return
    if (colorDistance(pixels[y][x], background) > tolerance) return
    visited[idx] = 1
    queue.push(idx)
  }

  for (let x = 0; x < width; x++) {
    trySeed(x, 0)
    trySeed(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    trySeed(0, y)
    trySeed(width - 1, y)
  }

  const tryVisit = (nx: number, ny: number): void => {
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) return
    const nIdx = ny * width + nx
    if (visited[nIdx]) return
    if (colorDistance(pixels[ny][nx], background) > tolerance) return
    visited[nIdx] = 1
    queue.push(nIdx)
  }

  let head = 0
  while (head < queue.length) {
    const idx = queue[head]
    head++
    const x = idx % width
    const y = Math.floor(idx / width)
    out[y][x] = { ...out[y][x], a: ALPHA_TRANSPARENT }

    tryVisit(x + 1, y)
    tryVisit(x - 1, y)
    tryVisit(x, y + 1)
    tryVisit(x, y - 1)
  }

  erodeFringe(out, pixels, background, visited, width, height)
  return out
}

/**
 * Removes the anti-aliased halo the flood-fill leaves behind. Those ring pixels
 * are the blend between the background and the sprite: too far from the pure
 * background colour to be caught by CHROMA_KEY_TOLERANCE, so they survive keying
 * and read as a bright outline on a dark canvas. We erode inward from the keyed
 * region (marked in `visited`): a still-opaque pixel is dropped when it touches a
 * keyed pixel and is within the wider CHROMA_FRINGE_TOLERANCE of the background.
 * Bounded passes so a break in the sprite's own outline can't let the erosion
 * bleed across the whole character.
 */
const erodeFringe = (
  out: PixelBuffer,
  source: PixelBuffer,
  background: RgbaColor,
  keyed: Uint8Array,
  width: number,
  height: number,
): void => {
  for (let pass = 0; pass < CHROMA_FRINGE_PASSES; pass++) {
    const toKey: number[] = []
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x
        if (keyed[idx]) continue
        const touchesKeyed =
          (x > 0 && keyed[idx - 1] === 1) ||
          (x < width - 1 && keyed[idx + 1] === 1) ||
          (y > 0 && keyed[idx - width] === 1) ||
          (y < height - 1 && keyed[idx + width] === 1)
        if (!touchesKeyed) continue
        if (colorDistance(source[y][x], background) > CHROMA_FRINGE_TOLERANCE) continue
        toKey.push(idx)
      }
    }
    if (toKey.length === 0) return
    for (const idx of toKey) {
      keyed[idx] = 1
      const x = idx % width
      const y = Math.floor(idx / width)
      out[y][x] = { ...out[y][x], a: ALPHA_TRANSPARENT }
    }
  }
}

const colorDistance = (a: RgbaColor, b: RgbaColor): number =>
  Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2)

const averageCornerColor = (pixels: PixelBuffer, width: number, height: number): RgbaColor => {
  const corners = [
    pixels[0][0],
    pixels[0][width - 1],
    pixels[height - 1][0],
    pixels[height - 1][width - 1],
  ]
  const sum = corners.reduce(
    (acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }),
    { r: 0, g: 0, b: 0 },
  )
  return {
    r: Math.round(sum.r / corners.length),
    g: Math.round(sum.g / corners.length),
    b: Math.round(sum.b / corners.length),
    a: 255,
  }
}

const isAlreadyTransparent = (pixels: PixelBuffer, width: number, height: number): boolean => {
  const samples: RgbaColor[] = []
  for (let x = 0; x < width; x++) {
    samples.push(pixels[0][x], pixels[height - 1][x])
  }
  for (let y = 0; y < height; y++) {
    samples.push(pixels[y][0], pixels[y][width - 1])
  }
  const transparentCount = samples.filter((p) => p.a <= ALPHA_TRANSPARENT_THRESHOLD).length
  return transparentCount > samples.length / 2
}

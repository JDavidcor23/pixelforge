import type { PixelBuffer, RgbaColor } from '@/app/editor/types'
import { colorsEqual, getPixel, isInBounds } from './pixel-buffer'

export function floodFill(
  buffer: PixelBuffer,
  startX: number,
  startY: number,
  fillColor: RgbaColor
): PixelBuffer {
  const targetColor = getPixel(buffer, startX, startY)

  if (colorsEqual(targetColor, fillColor)) {
    return buffer
  }

  const height = buffer.length
  const width = buffer[0].length
  const newBuffer = buffer.map((row) => row.map((pixel) => ({ ...pixel })))
  const visited = new Set<string>()
  const queue: Array<[number, number]> = [[startX, startY]]

  while (queue.length > 0) {
    const [x, y] = queue.shift()!
    const key = `${x},${y}`

    if (visited.has(key)) continue
    if (!isInBounds(buffer, x, y)) continue
    if (!colorsEqual(getPixel(buffer, x, y), targetColor)) continue

    visited.add(key)
    newBuffer[y][x] = { ...fillColor }

    if (x + 1 < width) queue.push([x + 1, y])
    if (x - 1 >= 0) queue.push([x - 1, y])
    if (y + 1 < height) queue.push([x, y + 1])
    if (y - 1 >= 0) queue.push([x, y - 1])
  }

  return newBuffer
}


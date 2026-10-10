import type { PixelBuffer, RgbaColor } from '@/app/editor/types'

const TRANSPARENT: RgbaColor = { r: 0, g: 0, b: 0, a: 0 }

export function createEmptyBuffer(width: number, height: number): PixelBuffer {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ ...TRANSPARENT }))
  )
}

export function cloneBuffer(buffer: PixelBuffer): PixelBuffer {
  return buffer.map((row) => row.map((pixel) => ({ ...pixel })))
}

export function getPixel(buffer: PixelBuffer, x: number, y: number): RgbaColor {
  return buffer[y][x]
}

export function setPixelInBuffer(
  buffer: PixelBuffer,
  x: number,
  y: number,
  color: RgbaColor
): PixelBuffer {
  const newBuffer = buffer.map((row) => [...row])
  newBuffer[y][x] = { ...color }
  return newBuffer
}

export function colorsEqual(a: RgbaColor, b: RgbaColor): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a
}

export function isInBounds(buffer: PixelBuffer, x: number, y: number): boolean {
  return y >= 0 && y < buffer.length && x >= 0 && x < buffer[0].length
}


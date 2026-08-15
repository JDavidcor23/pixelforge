import { describe, expect, it } from 'vitest'

import type { PixelBuffer, RgbaColor } from '@/app/editor/types'

import { normalizeSheetFrames } from './codex-utils'

const CLEAR: RgbaColor = { r: 0, g: 0, b: 0, a: 0 }

const createTransparentBuffer = (width: number, height: number): PixelBuffer =>
  Array.from({ length: height }, () =>
    Array.from({ length: width }, (): RgbaColor => ({ ...CLEAR })),
  )

const paintRect = (
  buffer: PixelBuffer,
  x0: number,
  x1: number,
  color: RgbaColor,
): void => {
  for (let y = 0; y < buffer.length; y++) {
    for (let x = x0; x <= x1; x++) buffer[y][x] = { ...color }
  }
}

const opaquePixels = (buffer: PixelBuffer): RgbaColor[] =>
  buffer.flat().filter((pixel) => pixel.a > 0)

describe('normalizeSheetFrames', () => {
  it('splits a wide connected run at its occupancy valley without importing the neighbour', () => {
    const sheet = createTransparentBuffer(94, 12)
    const starts = [2, 14, 26, 38, 50, 60, 72, 84]
    starts.forEach((start, index) => {
      paintRect(sheet, start, start + 7, { r: (index + 1) * 10, g: 0, b: 0, a: 255 })
    })
    // Simulate a punch/effect touching the next pose: the two 8px frames are
    // one connected 18px run, but the bridge creates a clear projection valley.
    sheet[5][58] = { r: 50, g: 0, b: 0, a: 255 }
    sheet[5][59] = { r: 50, g: 0, b: 0, a: 255 }

    const frames = normalizeSheetFrames(sheet, 4, 20, false, 0.8)

    expect(frames).toHaveLength(4)
    const frameColors = frames.map((frame) =>
      new Set(opaquePixels(frame).map((pixel) => pixel.r)),
    )
    expect(frameColors[0]).toEqual(new Set([10]))
    expect(frameColors[1]).toEqual(new Set([30]))
    expect(frameColors[2]).toEqual(new Set([50]))
    expect(frameColors[3]).toEqual(new Set([70]))
  })

  it('uses the requested reference occupancy instead of filling or shrinking the grid arbitrarily', () => {
    const sheet = createTransparentBuffer(40, 12)
    paintRect(sheet, 2, 9, { r: 200, g: 20, b: 20, a: 255 })
    paintRect(sheet, 16, 23, { r: 20, g: 200, b: 20, a: 255 })
    paintRect(sheet, 30, 37, { r: 20, g: 20, b: 200, a: 255 })

    const frames = normalizeSheetFrames(sheet, 3, 20, false, 0.75)
    const occupiedRows = frames[0].filter((row) => row.some((pixel) => pixel.a > 0))

    expect(occupiedRows).toHaveLength(15)
  })

  it('does not split a legitimate wide pose when the requested frame count is already detected', () => {
    const sheet = createTransparentBuffer(54, 12)
    paintRect(sheet, 2, 9, { r: 10, g: 0, b: 0, a: 255 })
    paintRect(sheet, 14, 21, { r: 20, g: 0, b: 0, a: 255 })
    paintRect(sheet, 26, 39, { r: 30, g: 0, b: 0, a: 255 })
    paintRect(sheet, 44, 51, { r: 40, g: 0, b: 0, a: 255 })

    const frames = normalizeSheetFrames(sheet, 4, 20, false, 0.75)
    const occupiedColumns = frames.map((frame) =>
      frame[0].filter((_, x) => frame.some((row) => row[x].a > 0)).length,
    )

    expect(frames).toHaveLength(4)
    expect(occupiedColumns[2]).toBeGreaterThan(occupiedColumns[1])
    expect(new Set(opaquePixels(frames[2]).map((pixel) => pixel.r))).toEqual(new Set([30]))
  })

  it('returns fewer complete frames instead of slicing a normal pose when Codex under-generates', () => {
    const sheet = createTransparentBuffer(40, 12)
    paintRect(sheet, 2, 9, { r: 10, g: 0, b: 0, a: 255 })
    paintRect(sheet, 16, 23, { r: 20, g: 0, b: 0, a: 255 })
    paintRect(sheet, 30, 37, { r: 30, g: 0, b: 0, a: 255 })

    const frames = normalizeSheetFrames(sheet, 4, 20, false, 0.75)

    expect(frames).toHaveLength(3)
    expect(frames.map((frame) => [...new Set(opaquePixels(frame).map((pixel) => pixel.r))])).toEqual([
      [10],
      [20],
      [30],
    ])
  })
})

import { describe, expect, it } from 'vitest'

import { computeHorizontalSheetLayout } from './compose-horizontal-sheet'

describe('computeHorizontalSheetLayout', () => {
  it('stacks frames left-to-right at the frame width', () => {
    const layout = computeHorizontalSheetLayout(16, 16, 4)

    expect(layout.sheetWidth).toBe(64)
    expect(layout.sheetHeight).toBe(16)
    expect(layout.offsets).toEqual([0, 16, 32, 48])
  })

  it('keeps the sheet height at a single frame regardless of frame count', () => {
    const layout = computeHorizontalSheetLayout(8, 24, 6)

    expect(layout.sheetHeight).toBe(24)
    expect(layout.offsets).toHaveLength(6)
  })

  it('returns an empty layout for zero frames', () => {
    const layout = computeHorizontalSheetLayout(16, 16, 0)

    expect(layout.sheetWidth).toBe(0)
    expect(layout.offsets).toEqual([])
  })
})

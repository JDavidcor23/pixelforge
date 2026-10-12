import { describe, expect, it } from 'vitest'

import type { PixelWriter, TitleLetterState } from '@/types'
import { drawGlyph, drawGlyphText, measureGlyphText } from './mascot-font'
import { GLYPH_FONT, GLYPH_SIZE, SUBTITLE_TEXT, TITLE_TEXT } from './mascot.constants'

interface FillRectCall {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
  readonly color: string
}

function createRecorder(): PixelWriter & { calls: FillRectCall[] } {
  const calls: FillRectCall[] = []
  return {
    calls,
    fillRect(x, y, w, h, color) {
      calls.push({ x, y, w, h, color })
    },
  }
}

describe('GLYPH_FONT', () => {
  it('defines a 5x7 bitmap for every letter in "PIXELFORGE" and "AI"', () => {
    for (const char of new Set(`${TITLE_TEXT}${SUBTITLE_TEXT}`.split(''))) {
      const bitmap = GLYPH_FONT[char]
      expect(bitmap, `missing glyph for "${char}"`).toBeDefined()
      expect(bitmap).toHaveLength(GLYPH_SIZE.HEIGHT)
      for (const row of bitmap) {
        expect(row).toHaveLength(GLYPH_SIZE.WIDTH)
        expect(row).toMatch(/^[01]{5}$/)
      }
    }
  })
})

describe('drawGlyph', () => {
  it('draws "I" as a filled top bar, a 1px stem, and a filled bottom bar', () => {
    const recorder = createRecorder()
    drawGlyph(recorder, 'I', 0, 0, '#00fbfb')
    expect(recorder.calls).toContainEqual({ x: 0, y: 0, w: 1, h: 1, color: '#00fbfb' })
    expect(recorder.calls).toContainEqual({ x: 2, y: 3, w: 1, h: 1, color: '#00fbfb' })
    expect(recorder.calls).toContainEqual({ x: 4, y: 6, w: 1, h: 1, color: '#00fbfb' })
  })

  it('draws "A" with a closed apex and a crossbar', () => {
    const recorder = createRecorder()
    drawGlyph(recorder, 'A', 0, 0, '#00fbfb')
    expect(recorder.calls).toContainEqual({ x: 1, y: 0, w: 1, h: 1, color: '#00fbfb' })
    expect(recorder.calls).toContainEqual({ x: 0, y: 3, w: 1, h: 1, color: '#00fbfb' })
    expect(recorder.calls).toContainEqual({ x: 4, y: 3, w: 1, h: 1, color: '#00fbfb' })
  })

  it('draws nothing for an undefined character', () => {
    const recorder = createRecorder()
    drawGlyph(recorder, '?', 0, 0, '#00fbfb')
    expect(recorder.calls).toHaveLength(0)
  })
})

describe('measureGlyphText', () => {
  it('accounts for glyph width and inter-letter spacing', () => {
    expect(measureGlyphText('')).toBe(0)
    expect(measureGlyphText('I')).toBe(GLYPH_SIZE.WIDTH)
    expect(measureGlyphText('II')).toBe(GLYPH_SIZE.WIDTH * 2 + 2)
  })
})

describe('drawGlyphText', () => {
  it('skips fully transparent letters', () => {
    const recorder = createRecorder()
    const letters: TitleLetterState[] = [{ char: 'I', x: 0, yOffset: 0, opacity: 0 }]
    drawGlyphText(recorder, letters, 0)
    expect(recorder.calls).toHaveLength(0)
  })

  it('applies yOffset to the glyph baseline and bakes opacity into an rgba color', () => {
    const recorder = createRecorder()
    const letters: TitleLetterState[] = [{ char: 'I', x: 10, yOffset: -2, opacity: 0.5 }]
    drawGlyphText(recorder, letters, 20)
    expect(recorder.calls).toContainEqual({ x: 10, y: 18, w: 1, h: 1, color: 'rgba(0,251,251,0.5019607843137255)' })
  })

  it('uses a custom color (the plain-ink "AI" subtitle) instead of the default cyan', () => {
    const recorder = createRecorder()
    const letters: TitleLetterState[] = [{ char: 'I', x: 0, yOffset: 0, opacity: 1 }]
    drawGlyphText(recorder, letters, 0, { color: '#ededed' })
    expect(recorder.calls).toContainEqual({ x: 0, y: 0, w: 1, h: 1, color: 'rgba(237,237,237,1)' })
  })

  it('adds a dim halo around each lit pixel when glow is on', () => {
    const recorder = createRecorder()
    const letters: TitleLetterState[] = [{ char: 'I', x: 0, yOffset: 0, opacity: 1 }]
    drawGlyphText(recorder, letters, 0, { glow: true })
    // The top bar's leftmost pixel (0,0) gets a glow pixel just below it, at (0,1).
    expect(recorder.calls).toContainEqual({ x: 0, y: 1, w: 1, h: 1, color: 'rgba(0,251,251,0.35294117647058826)' })
  })
})

import { hexToRgba, rgbaToString } from '@/lib/color-utils'
import type { PixelWriter, TitleLetterState } from '@/types'
import { GLYPH_FONT, GLYPH_SIZE, GLYPH_SPACING, MASCOT_COLORS } from './mascot.constants'

/** Draws one 5x7 bitmap glyph at `(x, y)` — `color` already carries any opacity (an rgba string), since `PixelWriter.fillRect` takes a flat color. */
export function drawGlyph(writer: PixelWriter, char: string, x: number, y: number, color: string): void {
  const bitmap = GLYPH_FONT[char]
  if (!bitmap) return
  bitmap.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) {
      if (row[rx] === '1') writer.fillRect(x + rx, y + ry, 1, 1, color)
    }
  })
}

/** Cheap "soft glow": a dim copy of the glyph's lit pixels, offset 1px in each direction, drawn behind the crisp glyph. */
function drawGlyphGlow(writer: PixelWriter, char: string, x: number, y: number, color: string): void {
  const bitmap = GLYPH_FONT[char]
  if (!bitmap) return
  bitmap.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) {
      if (row[rx] !== '1') continue
      writer.fillRect(x + rx - 1, y + ry, 1, 1, color)
      writer.fillRect(x + rx + 1, y + ry, 1, 1, color)
      writer.fillRect(x + rx, y + ry - 1, 1, 1, color)
      writer.fillRect(x + rx, y + ry + 1, 1, 1, color)
    }
  })
}

/** Total pixel width of `text` rendered in the glyph font, including inter-letter spacing. */
export function measureGlyphText(text: string): number {
  if (text.length === 0) return 0
  return text.length * GLYPH_SIZE.WIDTH + (text.length - 1) * GLYPH_SPACING
}

export interface DrawGlyphTextOptions {
  /** Defaults to `MASCOT_COLORS.GLYPH` (cyan) — pass `MASCOT_COLORS.GLYPH_SUBTITLE` for the plain-ink "AI" line. */
  readonly color?: string
  /** Soft halo behind the glyph — used for "PIXELFORGE", not the quieter "AI" subtitle. */
  readonly glow?: boolean
}

/** Draws one title line (either "PIXELFORGE" or "AI") at each letter's own drop-in/hold/fade position and opacity (see `computeMascotSceneState`). */
export function drawGlyphText(writer: PixelWriter, letters: readonly TitleLetterState[], baselineY: number, options: DrawGlyphTextOptions = {}): void {
  const { color = MASCOT_COLORS.GLYPH, glow = false } = options
  for (const letter of letters) {
    if (letter.opacity <= 0) continue
    const y = baselineY + letter.yOffset
    const alpha = Math.round(letter.opacity * 255)
    if (glow) {
      const glowColor = rgbaToString({ ...hexToRgba(color), a: Math.round(letter.opacity * 90) })
      drawGlyphGlow(writer, letter.char, letter.x, y, glowColor)
    }
    const solidColor = rgbaToString({ ...hexToRgba(color), a: alpha })
    drawGlyph(writer, letter.char, letter.x, y, solidColor)
  }
}

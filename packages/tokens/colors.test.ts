import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { COLORS } from './colors'

/**
 * Parity gate between `colors.ts` (the Konva/canvas literal mirror) and
 * `tokens.css` (the CSS custom-property source of truth). Both files hold the
 * same palette in two forms by necessity (see the header comments in each) —
 * this test fails loudly the moment someone edits one without the other.
 */
const tokensCssPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'tokens.css',
)
const tokensCss = readFileSync(tokensCssPath, 'utf8')

const readCssVar = (name: string): string => {
  const match = tokensCss.match(new RegExp(`--${name}:\\s*([^;]+);`))
  if (!match) throw new Error(`CSS variable --${name} not found in tokens.css`)
  return match[1].trim()
}

describe('colors.ts <-> tokens.css parity', () => {
  it('surface ladder matches', () => {
    expect(COLORS.SURFACE.BASE).toBe(readCssVar('pf-base'))
    expect(COLORS.SURFACE.SURFACE).toBe(readCssVar('pf-surface'))
    expect(COLORS.SURFACE.RAISED).toBe(readCssVar('pf-raised'))
    expect(COLORS.SURFACE.HOVER).toBe(readCssVar('pf-hover'))
  })

  it('lines match', () => {
    expect(COLORS.LINE.DEFAULT.replace(/\s/g, '')).toBe(
      readCssVar('pf-line').replace(/\s/g, ''),
    )
    expect(COLORS.LINE.STRONG.replace(/\s/g, '')).toBe(
      readCssVar('pf-line-strong').replace(/\s/g, ''),
    )
  })

  it('content colors match', () => {
    expect(COLORS.TEXT.INK).toBe(readCssVar('pf-ink'))
    expect(COLORS.TEXT.MUTED).toBe(readCssVar('pf-muted'))
    expect(COLORS.TEXT.SUBTLE).toBe(readCssVar('pf-subtle'))
  })

  it('accents match', () => {
    expect(COLORS.ACCENT.DEFAULT).toBe(readCssVar('pf-accent'))
    expect(COLORS.ACCENT.STRONG).toBe(readCssVar('pf-accent-strong'))
    expect(COLORS.AI).toBe(readCssVar('pf-ai'))
    expect(COLORS.SUCCESS).toBe(readCssVar('pf-success'))
    expect(COLORS.DANGER).toBe(readCssVar('pf-danger'))
  })

  it('canvas chrome matches', () => {
    expect(COLORS.CANVAS.GRID_LINE).toBe(readCssVar('pf-grid-line'))
    expect(COLORS.CANVAS.CHECKER_A).toBe(readCssVar('pf-checker-a'))
    expect(COLORS.CANVAS.CHECKER_B).toBe(readCssVar('pf-checker-b'))
  })
})

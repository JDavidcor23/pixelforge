import { colord } from 'colord'
import type { RgbaColor } from '@/app/editor/types'

export interface PfmParseResult {
  width: number
  height: number
  pixels: RgbaColor[][]
}

export function parsePfm(pfm: string): PfmParseResult {
  const lines = pfm
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'))

  const sizeIndex = lines.findIndex((l) => l.startsWith('SIZE:'))
  if (sizeIndex === -1) throw new Error('SIZE section missing')

  const paletteIndex = lines.findIndex((l) => l.startsWith('PALETTE:'))
  if (paletteIndex === -1) throw new Error('PALETTE section missing')

  const gridIndex = lines.findIndex((l) => l.startsWith('GRID:'))
  if (gridIndex === -1) throw new Error('GRID section missing')

  // Parse SIZE
  const sizeMatch = lines[sizeIndex].match(/SIZE:\s*(\d+)x(\d+)/i)
  if (!sizeMatch) throw new Error('Invalid SIZE format. Expected WxH')
  const width = parseInt(sizeMatch[1], 10)
  const height = parseInt(sizeMatch[2], 10)

  // Parse PALETTE
  const paletteMap = new Map<string, RgbaColor>()
  for (let i = paletteIndex + 1; i < gridIndex; i++) {
    const line = lines[i]
    if (line.includes(':')) {
      const [char, value] = line.split(':').map((s) => s.trim())
      if (value.toLowerCase() === 'transparent') {
        paletteMap.set(char, { r: 0, g: 0, b: 0, a: 0 })
      } else {
        const color = colord(value).toRgb()
        paletteMap.set(char, {
          r: color.r,
          g: color.g,
          b: color.b,
          a: Math.round((color.a ?? 1) * 255),
        })
      }
    }
  }

  // Parse GRID
  const gridLines = lines.slice(gridIndex + 1)
  if (gridLines.length !== height) {
    throw new Error(`Grid dimensions do not match SIZE. Expected ${height} rows, got ${gridLines.length}`)
  }

  const pixels: RgbaColor[][] = []
  for (const line of gridLines) {
    let chars: string[] = []
    
    // Check if it's a "Dense Grid" (no spaces)
    if (line.length === width) {
      chars = line.split('')
    } else {
      // Fallback to space-separated
      chars = line.split(/\s+/).filter((c) => c !== '')
    }

    if (chars.length !== width) {
      throw new Error(`Grid dimensions do not match SIZE. Expected ${width} columns, got ${chars.length} in row: ${line}`)
    }

    const row: RgbaColor[] = []
    for (const char of chars) {
      const color = paletteMap.get(char)
      if (!color) {
        throw new Error(`Character '${char}' not found in palette`)
      }
      row.push(color)
    }
    pixels.push(row)
  }

  return { width, height, pixels }
}

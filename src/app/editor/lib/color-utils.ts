import type { RgbaColor } from '@/app/editor/types'

export function rgbaToHex(color: RgbaColor): string {
  const r = color.r.toString(16).padStart(2, '0')
  const g = color.g.toString(16).padStart(2, '0')
  const b = color.b.toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

export function hexToRgba(hex: string): RgbaColor {
  const cleaned = hex.replace('#', '')
  return {
    r: parseInt(cleaned.slice(0, 2), 16),
    g: parseInt(cleaned.slice(2, 4), 16),
    b: parseInt(cleaned.slice(4, 6), 16),
    a: 255,
  }
}

export function rgbaToString(color: RgbaColor): string {
  return `rgba(${color.r},${color.g},${color.b},${color.a / 255})`
}


import { colord } from 'colord'

import type { HsvColor, RgbaColor } from '@/types'

/**
 * Hex → HSV with a sticky-hue fallback. Converting an achromatic color
 * (black, white, or any pure gray) back to HSV always yields hue 0 — the hex
 * value has no hue information left. Passing the previously-known hue as
 * `fallbackHue` keeps the hue slider from jumping to red whenever the user
 * drags saturation/value to an achromatic corner. See `useColorPicker.hook.ts`.
 */
export function hexToHsv(hex: string, fallbackHue: number): HsvColor {
  const { h, s, v, a } = colord(hex).toHsv()
  const isAchromatic = s === 0 || v === 0
  return { h: isAchromatic ? fallbackHue : h, s, v, a: Math.round(a * 255) }
}

export function hsvToHex(hsv: HsvColor): string {
  return colord({ h: hsv.h, s: hsv.s, v: hsv.v, a: hsv.a / 255 }).toHex()
}

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


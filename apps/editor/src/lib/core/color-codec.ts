import type { RgbaColor } from '@/types'

/**
 * RGBA <-> packed `u32` codec (phase 2e, design D6/D1: "no serde", "flat
 * methods, `u32` handles, slices plus `rgba: u32`"). A wasm-bindgen command
 * boundary cannot carry a `{r,g,b,a}` object — a plain number crosses the
 * FFI boundary with zero marshalling. The byte order is defined here, by
 * arithmetic (NOT by casting a buffer through a `DataView`/`Uint32Array`), so
 * the packed value is identical regardless of host endianness: R in the
 * highest byte, A in the lowest.
 *
 * This is the ONLY place that should shift/mask an RGBA value — every
 * command payload that needs a color (`stroke.points`, `fill`) carries a
 * packed `rgba: number`, never a live `RgbaColor` object.
 */
export const RGBA_BYTE_SHIFT = { R: 24, G: 16, B: 8, A: 0 } as const

export function packRgba(color: RgbaColor): number {
  return (
    ((color.r & 0xff) << RGBA_BYTE_SHIFT.R) |
    ((color.g & 0xff) << RGBA_BYTE_SHIFT.G) |
    ((color.b & 0xff) << RGBA_BYTE_SHIFT.B) |
    ((color.a & 0xff) << RGBA_BYTE_SHIFT.A)
  ) >>> 0
}

export function unpackRgba(rgba: number): RgbaColor {
  return {
    r: (rgba >>> RGBA_BYTE_SHIFT.R) & 0xff,
    g: (rgba >>> RGBA_BYTE_SHIFT.G) & 0xff,
    b: (rgba >>> RGBA_BYTE_SHIFT.B) & 0xff,
    a: (rgba >>> RGBA_BYTE_SHIFT.A) & 0xff,
  }
}

/**
 * Packs a batch of pixel coordinates into the interleaved `x,y` `Int32Array`
 * the `stroke.points` command carries (design.md's Rust surface: "points are
 * batched as `Int32Array`, so there are no per-pixel calls"). The ONLY
 * allocation per pointer-move batch, by design.
 */
export function packPoints(points: ReadonlyArray<{ readonly x: number; readonly y: number }>): Int32Array {
  const out = new Int32Array(points.length * 2)
  for (let i = 0; i < points.length; i++) {
    out[i * 2] = points[i].x
    out[i * 2 + 1] = points[i].y
  }
  return out
}

import type { PixelBuffer, Rect, RgbaColor } from '@/types'

const CHANNELS = 4

export function createEmptyBuffer(width: number, height: number): PixelBuffer {
  return { w: width, h: height, data: new Uint8ClampedArray(width * height * CHANNELS) }
}

export function cloneBuffer(buffer: PixelBuffer): PixelBuffer {
  return { w: buffer.w, h: buffer.h, data: new Uint8ClampedArray(buffer.data) }
}

function dataIndex(buffer: PixelBuffer, x: number, y: number): number {
  return (y * buffer.w + x) * CHANNELS
}

export function getPixel(buffer: PixelBuffer, x: number, y: number): RgbaColor {
  const i = dataIndex(buffer, x, y)
  const { data } = buffer
  return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] }
}

/**
 * Writes a pixel IN PLACE. The caller must already own `buffer` exclusively
 * (e.g. a buffer just produced by `createEmptyBuffer`/`cloneBuffer`) — this
 * never copies, unlike `setPixelInBuffer`. Internal building block for every
 * other buffer op in this module and in `lib/*` consumers that construct a
 * buffer once and fill it in a loop.
 */
export function putPixel(buffer: PixelBuffer, x: number, y: number, color: RgbaColor): void {
  const i = dataIndex(buffer, x, y)
  const { data } = buffer
  data[i] = color.r
  data[i + 1] = color.g
  data[i + 2] = color.b
  data[i + 3] = color.a
}

/** Copy-on-write single pixel write: clones the whole buffer, then writes one pixel. */
export function setPixelInBuffer(
  buffer: PixelBuffer,
  x: number,
  y: number,
  color: RgbaColor
): PixelBuffer {
  const next = cloneBuffer(buffer)
  putPixel(next, x, y, color)
  return next
}

/**
 * Copy-on-write BATCH write: clones the buffer ONCE, then writes every point
 * in place (design D2 — one copy per batch, not one copy per pixel). Used by
 * `setPixelBatch` so a whole stroke segment costs a single buffer clone.
 */
export function setPixelsInBuffer(
  buffer: PixelBuffer,
  points: ReadonlyArray<{ x: number; y: number; color: RgbaColor }>
): PixelBuffer {
  const next = cloneBuffer(buffer)
  for (const { x, y, color } of points) {
    putPixel(next, x, y, color)
  }
  return next
}

export function colorsEqual(a: RgbaColor, b: RgbaColor): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a
}

export function isInBounds(buffer: PixelBuffer, x: number, y: number): boolean {
  return y >= 0 && y < buffer.h && x >= 0 && x < buffer.w
}

/**
 * Bounding box of every byte that differs between two SAME-SIZED buffers, or
 * `null` if they are identical. Generic diff used by the phase 2 dirty-rect
 * history (`lib/core/history.ts`) to turn a "before"/"after" pair of full
 * buffers (e.g. a flood fill, or a whole stroke gesture) into the smallest
 * rect worth retaining — this is what keeps a 1px stroke's history entry
 * under 1KB instead of retaining a full-layer snapshot.
 */
export function diffRect(before: PixelBuffer, after: PixelBuffer): Rect | null {
  const { w, h } = before
  const a = before.data
  const b = after.data
  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < h; y++) {
    const rowStart = y * w * CHANNELS
    for (let x = 0; x < w; x++) {
      const i = rowStart + x * CHANNELS
      if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < minX || maxY < minY) return null
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

/**
 * `true` iff `rect` fits entirely inside a `w x h` buffer — negative origin,
 * non-positive size, or an out-of-range far edge are all rejected. Phase 4f
 * (W2/W3): the SAME "negative rx wraps into the previous row" bug class
 * found in `packages/core`'s Rust/TS kernels applies here too — a plain
 * `rect.x + rect.w > w` check PASSES for a negative `rect.x` (the sum is
 * smaller, not larger), so the sign must be checked explicitly.
 */
function isValidRect(w: number, h: number, rect: Rect): boolean {
  return (
    Number.isInteger(rect.x) &&
    Number.isInteger(rect.y) &&
    Number.isInteger(rect.w) &&
    Number.isInteger(rect.h) &&
    rect.w > 0 &&
    rect.h > 0 &&
    rect.x >= 0 &&
    rect.y >= 0 &&
    rect.x + rect.w <= w &&
    rect.y + rect.h <= h
  )
}

/**
 * Copies just `rect` out of `buffer` as a tightly-packed RGBA byte array.
 * Returns an empty `Uint8Array` — never reads out of bounds or wraps into a
 * neighboring row — if `rect` doesn't fit `buffer`, or `buffer.data`'s own
 * length doesn't match `w*h*4` (W2/W3 hardening).
 */
export function extractRect(buffer: PixelBuffer, rect: Rect): Uint8Array {
  if (buffer.data.length !== buffer.w * buffer.h * CHANNELS || !isValidRect(buffer.w, buffer.h, rect)) {
    console.error('[pixel-buffer] extractRect: invalid rect or buffer shape — returning an empty patch', { buffer: { w: buffer.w, h: buffer.h, len: buffer.data.length }, rect })
    return new Uint8Array(0)
  }
  const out = new Uint8Array(rect.w * rect.h * CHANNELS)
  for (let row = 0; row < rect.h; row++) {
    const srcStart = ((rect.y + row) * buffer.w + rect.x) * CHANNELS
    const destStart = row * rect.w * CHANNELS
    out.set(buffer.data.subarray(srcStart, srcStart + rect.w * CHANNELS), destStart)
  }
  return out
}

/**
 * Copy-on-write: clones `buffer`, then writes `patch` (as produced by
 * {@link extractRect}) back into `rect`. Used to apply a dirty-rect undo/redo
 * patch without touching the rest of the buffer. Returns `buffer` UNCHANGED
 * (a safe no-op, never a wrap/out-of-bounds write) if `rect` doesn't fit
 * `buffer`, `buffer.data`'s length doesn't match `w*h*4`, or `patch`'s length
 * doesn't match `rect.w*rect.h*4` (W2/W3 hardening).
 */
export function writeRect(buffer: PixelBuffer, rect: Rect, patch: Uint8Array): PixelBuffer {
  if (
    buffer.data.length !== buffer.w * buffer.h * CHANNELS ||
    !isValidRect(buffer.w, buffer.h, rect) ||
    patch.length !== rect.w * rect.h * CHANNELS
  ) {
    console.error('[pixel-buffer] writeRect: invalid rect, buffer shape or patch length — leaving the buffer unchanged', {
      buffer: { w: buffer.w, h: buffer.h, len: buffer.data.length },
      rect,
      patchLen: patch.length,
    })
    return buffer
  }
  const next = cloneBuffer(buffer)
  for (let row = 0; row < rect.h; row++) {
    const destStart = ((rect.y + row) * buffer.w + rect.x) * CHANNELS
    const srcStart = row * rect.w * CHANNELS
    next.data.set(patch.subarray(srcStart, srcStart + rect.w * CHANNELS), destStart)
  }
  return next
}

/**
 * True iff two same-length byte arrays hold identical values. Works across
 * `Uint8Array`/`Uint8ClampedArray` interchangeably (same element type, just a
 * different write-clamp behavior) — used to detect a true no-op write (e.g.
 * `selection.commit` with a patch identical to what's already there) without
 * needing same-typed inputs.
 */
export function bytesEqual(a: Uint8Array | Uint8ClampedArray, b: Uint8Array | Uint8ClampedArray): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

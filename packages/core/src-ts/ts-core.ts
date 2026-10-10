/**
 * The TS parity reference for this package's phase-4 kernels (design.md
 * "Testing Strategy": "the TS version stays as the parity reference"). A
 * small, SELF-CONTAINED mirror of `apps/editor/src/lib/pixel-buffer.ts`'s
 * buffer ops — `packages/core` does not depend on `apps/editor` (dependency
 * direction: apps depend on packages, never the reverse), so this is its own
 * copy, kept behaviorally identical on purpose (see `pixel-parity.test.ts`).
 *
 * Byte layout matches `crate::pixels` exactly: flat row-major RGBA,
 * `i = (y*w + x) * 4`; colors cross as a packed `u32` (R highest byte, A
 * lowest — same as `apps/editor/src/lib/core/color-codec.ts`).
 */
import type { PixelKernels } from './types'

export const CHANNELS = 4

function unpackRgba(rgba: number): [number, number, number, number] {
  return [(rgba >>> 24) & 0xff, (rgba >>> 16) & 0xff, (rgba >>> 8) & 0xff, rgba & 0xff]
}

/**
 * Phase 4f (judgment-day W2/W3): every boundary function here validates
 * `data.length === w*h*CHANNELS` FIRST — mirrors `crate::pixels::valid_buffer`
 * on the Rust side exactly, so a short/long buffer is rejected identically by
 * both implementations instead of silently reading/writing past the end of a
 * too-short TS array (which never panics in JS the way an out-of-bounds Rust
 * slice index does, but is just as wrong: it silently reads `undefined`
 * /writes nowhere).
 */
function validBuffer(data: Uint8Array, w: number, h: number): boolean {
  return data.length === w * h * CHANNELS
}

/**
 * Fix-agent phase 5f.5 (Rust/TS boundary parity — integer/NaN/huge-value
 * inputs): `true` iff `n` is an integer that fits in a `u32` with no
 * truncation/wrap — i.e. the SAME value a wasm-bindgen `u32` parameter would
 * receive if `n` were valid at all. A fractional number (`1.5`), `NaN`,
 * `±Infinity`, a negative number, or a number outside `[0, 2**32 - 1]` (e.g.
 * `2**32 + 1`) all fail this check.
 *
 * DECISION (design.md "Boundary number validation"): every rect/coordinate
 * argument crossing a `PixelKernels` call is validated with this check
 * BEFORE any further arithmetic, in BOTH `tsKernels` (this file) and
 * `makeWasmKernels` (`wasm-core.ts`) — so the two implementations reject
 * exactly the same inputs, the same way (a no-op/`undefined`/`false`),
 * instead of relying on wasm-bindgen's own JS->Wasm numeric coercion for a
 * `u32` parameter (which silently truncates a fraction toward zero, maps
 * `NaN`/negative/out-of-range values via `ToUint32`'s 32-bit wraparound, and
 * therefore would reach the Rust side as a DIFFERENT, "valid-looking" number
 * than what was actually passed in). `tsKernels`'s own arithmetic has no
 * such coercion (JS numbers don't wrap), so without this check it would
 * instead silently compute a fractional/NaN buffer index — never throwing,
 * but misaligning instead of rejecting. Never throws.
 */
function isValidU32(n: number): boolean {
  return Number.isInteger(n) && n >= 0 && n <= 0xffffffff
}

/**
 * Fix-agent 6f.4 (verify-report-phase-6.md W-A): `isValidU32` alone lets
 * through numbers that are individually "valid" `u32`s but whose PRODUCT
 * (`target_w * target_h * 4`) overflows a 32-bit `usize` on the `wasm32`
 * target — e.g. `downscale(data, 1, 1, 32768, 32768)`, where
 * `32768 * 32768 * 4 == 2**32`, wraps to `0`, and traps the Wasm instance
 * (confirmed by direct execution against the real `.wasm`). Neither the TS
 * oracle nor the TS reference kernel has any upper bound either — a
 * technically-valid-looking huge target would instead attempt a multi-
 * gigabyte `new Uint8Array` allocation and a billion-cell loop, risking a tab
 * hang/OOM rather than a clean rejection.
 *
 * DECISION: a generous but finite cap, applied identically here, in
 * `wasm-core.ts`'s boundary guard, and in `downscale.rs`/`quantize.rs` (same
 * "reject on both sides before coercion" convention `isValidU32`/5f.5
 * established) — chosen far above any real editor use (sprites top out in the
 * low thousands of px; `colors` never exceeds `SPRITE_EDITOR_PALETTE.
 * MAX_COLORS` (32) in the app) while keeping worst-case allocation/compute
 * bounded (`MAX_DOWNSCALE_DIMENSION`^2 * 4 bytes <= 256 MiB).
 */
export const MAX_DOWNSCALE_DIMENSION = 8192
export const MAX_QUANTIZE_COLORS = 4096

function inBounds(w: number, h: number, x: number, y: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < w && y >= 0 && y < h
}

/**
 * Exported so `wasm-core.ts`'s `makeWasmKernels` can apply the IDENTICAL
 * boundary validation before ever calling into the Wasm module (see
 * `isValidU32`'s doc) — one validator, never two independently-maintained
 * copies that could drift apart.
 */
export { isValidU32, inBounds, validBuffer }

function index(w: number, x: number, y: number): number {
  return (y * w + x) * CHANNELS
}

/**
 * Single-pixel write — an internal building block for {@link putPoints}
 * only. T1 (phase 4f) removed the matching `getPixel` AND this function's
 * standalone export from the public `PixelKernels` facade (a reader can use
 * `extractRect` instead) — kept here, unexported, purely because
 * `putPoints` needs a per-point write primitive to loop over.
 */
function putPixel(data: Uint8Array, w: number, h: number, x: number, y: number, rgba: number): boolean {
  if (!validBuffer(data, w, h) || !inBounds(w, h, x, y)) return false
  const [r, g, b, a] = unpackRgba(rgba)
  const i = index(w, x, y)
  data[i] = r
  data[i + 1] = g
  data[i + 2] = b
  data[i + 3] = a
  return true
}

function cloneBuffer(data: Uint8Array): Uint8Array {
  return new Uint8Array(data)
}

function diffRect(
  before: Uint8Array,
  after: Uint8Array,
  w: number,
  h: number
): [number, number, number, number] | undefined {
  if (!isValidU32(w) || !isValidU32(h) || !validBuffer(before, w, h) || !validBuffer(after, w, h)) return undefined
  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < h; y++) {
    const rowStart = y * w * CHANNELS
    for (let x = 0; x < w; x++) {
      const i = rowStart + x * CHANNELS
      if (before[i] !== after[i] || before[i + 1] !== after[i + 1] || before[i + 2] !== after[i + 2] || before[i + 3] !== after[i + 3]) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < minX || maxY < minY) return undefined
  return [minX, minY, maxX - minX + 1, maxY - minY + 1]
}

function extractRect(
  data: Uint8Array,
  w: number,
  h: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): Uint8Array | undefined {
  // Phase 4f (W2/W3): `rx < 0 || ry < 0` closes the exact bug a plain
  // `rx + rw > w` check misses — a negative `rx` (e.g. `-1`) makes
  // `rx + rw` SMALLER, not larger, so the check passed and the subsequent
  // `((ry+row)*w + rx) * CHANNELS` index silently wrapped into the PREVIOUS
  // row instead of being rejected. Mirrors `crate::pixels::extract_rect`'s
  // Rust-side fix (checked arithmetic there; an explicit sign check here,
  // since JS numbers have no unsigned/overflow-wrap equivalent to guard).
  //
  // Phase 5f.5: `isValidU32` additionally rejects NaN/fractional/±Infinity/
  // out-of-u32-range `rx`/`ry`/`rw`/`rh` — a plain `rx < 0`/`rx + rw > w`
  // comparison is silently `false` for `NaN` on EITHER side (NaN compares
  // unequal/false to everything), which used to let a NaN or fractional
  // rect argument fall through into the loop below and compute a NaN or
  // fractional buffer index instead of being rejected outright.
  if (
    !validBuffer(data, w, h) ||
    !isValidU32(rx) ||
    !isValidU32(ry) ||
    !isValidU32(rw) ||
    !isValidU32(rh) ||
    rw === 0 ||
    rh === 0 ||
    rx + rw > w ||
    ry + rh > h
  )
    return undefined
  const out = new Uint8Array(rw * rh * CHANNELS)
  for (let row = 0; row < rh; row++) {
    const srcStart = ((ry + row) * w + rx) * CHANNELS
    const destStart = row * rw * CHANNELS
    out.set(data.subarray(srcStart, srcStart + rw * CHANNELS), destStart)
  }
  return out
}

function writeRect(
  data: Uint8Array,
  w: number,
  h: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  patch: Uint8Array
): boolean {
  // Phase 5f.5: same `isValidU32` hardening as `extractRect` (see its
  // comment) — NaN/fractional/out-of-range `rx`/`ry`/`rw`/`rh` are rejected
  // outright instead of silently passing the `rx < 0`/`rx + rw > w`-style
  // comparisons (always `false` for NaN on either side) and writing into a
  // NaN/fractional buffer index.
  if (
    !validBuffer(data, w, h) ||
    !isValidU32(rx) ||
    !isValidU32(ry) ||
    !isValidU32(rw) ||
    !isValidU32(rh) ||
    rw === 0 ||
    rh === 0 ||
    rx + rw > w ||
    ry + rh > h ||
    patch.length !== rw * rh * CHANNELS
  )
    return false
  for (let row = 0; row < rh; row++) {
    const destStart = ((ry + row) * w + rx) * CHANNELS
    const srcStart = row * rw * CHANNELS
    data.set(patch.subarray(srcStart, srcStart + rw * CHANNELS), destStart)
  }
  return true
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

/**
 * T1 (phase 4f): the batched replacement for a per-pixel `putPixel` loop —
 * see `PixelKernels.putPoints`'s doc. An odd `points` length is rejected as
 * a whole malformed batch (mirrors `crate::pixels::put_points` exactly).
 */
function putPoints(data: Uint8Array, w: number, h: number, points: Int32Array, rgba: number): number {
  if (points.length % 2 !== 0) return 0
  let written = 0
  for (let i = 0; i + 1 < points.length; i += 2) {
    if (putPixel(data, w, h, points[i], points[i + 1], rgba)) written += 1
  }
  return written
}

/** Whether pixel `p` (a flat `w`-relative index, not yet multiplied by `CHANNELS`) still holds `target`. Internal to {@link floodFill} only. */
function pixelMatches(data: Uint8Array, p: number, target: readonly [number, number, number, number]): boolean {
  const i = p * CHANNELS
  return data[i] === target[0] && data[i + 1] === target[1] && data[i + 2] === target[2] && data[i + 3] === target[3]
}

/**
 * Fills the contiguous run of `target`-colored pixels on row `rowStart`
 * (`row * w`) that CONTAINS column `sx`, with `fill`. Returns the run's
 * inclusive `[left, right]` column bounds. Caller guarantees
 * `pixelMatches(data, rowStart + sx, target)` is already true.
 */
function fillSpanRow(
  data: Uint8Array,
  rowStart: number,
  sx: number,
  w: number,
  target: readonly [number, number, number, number],
  fill: readonly [number, number, number, number]
): [number, number] {
  let lx = sx
  while (lx > 0 && pixelMatches(data, rowStart + lx - 1, target)) lx -= 1
  let rx = sx
  while (rx + 1 < w && pixelMatches(data, rowStart + rx + 1, target)) rx += 1
  for (let p = lx; p <= rx; p++) {
    const i = (rowStart + p) * CHANNELS
    data[i] = fill[0]
    data[i + 1] = fill[1]
    data[i + 2] = fill[2]
    data[i + 3] = fill[3]
  }
  return [lx, rx]
}

/**
 * Phase 5f.3: 4-connected flood fill, IN PLACE, SCANLINE SPAN algorithm. A
 * self-contained TS mirror of `crate::flood_fill::flood_fill` (packages/core
 * does not depend on `apps/editor` — see this file's module doc) — rewritten
 * alongside the Rust side from the original phase-5 per-pixel stack version
 * to a scanline span fill (see `flood_fill.rs`'s module doc for the full
 * "why" — same reasoning applies on both sides: processing one contiguous
 * horizontal RUN per stack entry instead of one PIXEL per entry cuts stack
 * traffic from `O(w*h)` to `O(h)` for a large open fill). Still no
 * recursion (`pending` is a heap-allocated array of seed points, never the
 * JS call stack), still bounded memory (`O(h)` outstanding seeds at any
 * time). No separate `visited` array — a filled pixel can never again match
 * `target` (the same property the old per-pixel version's reverted
 * "drop visited" experiment relied on, see `flood_fill.rs`'s module doc —
 * that specific finding was about the per-pixel algorithm this file no
 * longer uses; the scanline rewrite never needed `visited` in the first
 * place since `fillSpanRow` already marks a whole run as non-matching in
 * one pass).
 */
function floodFill(
  data: Uint8Array,
  w: number,
  h: number,
  x: number,
  y: number,
  rgba: number
): [number, number, number, number] | undefined {
  if (!validBuffer(data, w, h) || !inBounds(w, h, x, y)) return undefined

  const seed = y * w + x
  const seedI = seed * CHANNELS
  const target: [number, number, number, number] = [data[seedI], data[seedI + 1], data[seedI + 2], data[seedI + 3]]
  const fill = unpackRgba(rgba)
  if (target[0] === fill[0] && target[1] === fill[1] && target[2] === fill[2] && target[3] === fill[3]) {
    return undefined // seed already the fill color — a true no-op
  }

  let minX = x
  let minY = y
  let maxX = x
  let maxY = y

  // Seed points for unexplored spans — NOT one entry per pixel (see doc
  // above). A seed popped here may already have been filled by an earlier
  // overlapping span; `pixelMatches` below re-checks and skips it with one
  // cheap read, exactly like the old per-pixel version's `visited` check
  // did for a duplicate pop.
  const pending: Array<[number, number]> = [[x, y]]

  while (pending.length > 0) {
    const [sx, sy] = pending.pop() as [number, number]
    const rowStart = sy * w
    if (!pixelMatches(data, rowStart + sx, target)) continue // already filled by a previously-processed overlapping span

    const [lx, rx] = fillSpanRow(data, rowStart, sx, w, target, fill)

    if (lx < minX) minX = lx
    if (rx > maxX) maxX = rx
    if (sy < minY) minY = sy
    if (sy > maxY) maxY = sy

    // Queue AT MOST ONE seed per contiguous target-colored run found in each
    // neighboring row, restricted to this span's [lx, rx] columns — the
    // standard scanline-fill invariant: any target pixel in a neighboring
    // row OUTSIDE [lx, rx] is reached later via its OWN row's horizontal
    // expansion once some other span queues it.
    for (const ny of [sy - 1, sy + 1]) {
      if (ny < 0 || ny >= h) continue
      const nrowStart = ny * w
      let nx = lx
      while (nx <= rx) {
        if (pixelMatches(data, nrowStart + nx, target)) {
          pending.push([nx, ny])
          // Skip to the end of this run — one seed is enough; the run's own
          // horizontal expansion (when popped) rediscovers its full extent.
          while (nx <= rx && pixelMatches(data, nrowStart + nx, target)) nx += 1
        } else {
          nx += 1
        }
      }
    }
  }

  return [minX, minY, maxX - minX + 1, maxY - minY + 1]
}

// ── Phase 6: quantize (weighted k-means-style palette reduction) ───────────
// Self-contained mirror of `apps/editor/src/lib/quantize.ts`'s
// `quantizePixels` (this file's module doc: packages/core never depends on
// apps/editor). `SATURATION_WEIGHT` duplicates
// `QUANTIZE_DEFAULTS.SATURATION_WEIGHT` (apps/editor/src/constants) on
// purpose — see `quantize.rs`'s matching doc for the full "why" and the
// floating-point parity reasoning (every computation here is a JS `number`,
// i.e. an IEEE 754 double, matching Rust's `f64` bit for bit).

const SATURATION_WEIGHT = 6

interface QPoint {
  r: number
  g: number
  b: number
  w: number
}
interface QCentroid {
  r: number
  g: number
  b: number
}

function saturation(r: number, g: number, b: number): number {
  const mx = Math.max(r, g, b)
  const mn = Math.min(r, g, b)
  return mx === 0 ? 0 : (mx - mn) / mx
}

function dist2(a: QCentroid, b: QCentroid): number {
  return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2
}

/** Nearest centroid by squared distance — ties go to the FIRST centroid found (strict `<`). `undefined` only if `palette` is empty (see `quantize`'s doc: the real caller never hits this). */
function nearest(palette: readonly QCentroid[], p: QCentroid): QCentroid | undefined {
  let best = palette[0]
  let bestD = Infinity
  for (const c of palette) {
    const d = dist2(c, p)
    if (d < bestD) {
      bestD = d
      best = c
    }
  }
  return best
}

/**
 * Mirrors `quantize.ts`'s `buildPalette` exactly, including its quirks: `k
 * === 0` still yields ONE centroid (the initial highest-weight seed is
 * pushed unconditionally, before the `while centroids.length < k` check ever
 * runs), and a `k` larger than the number of distinct colors may push
 * duplicate centroids.
 */
function buildPalette(points: readonly QPoint[], k: number, iterations: number): QCentroid[] {
  if (points.length === 0) return []
  const centroids: QCentroid[] = []
  let first = points[0]
  for (const p of points) if (p.w > first.w) first = p
  centroids.push({ r: first.r, g: first.g, b: first.b })

  while (centroids.length < k) {
    let best: QPoint | null = null
    let bestScore = -1
    for (const p of points) {
      let dmin = Infinity
      for (const c of centroids) {
        const d = dist2(c, p)
        if (d < dmin) dmin = d
      }
      const score = dmin * p.w
      if (score > bestScore) {
        bestScore = score
        best = p
      }
    }
    if (!best) break
    centroids.push({ r: best.r, g: best.g, b: best.b })
  }

  for (let it = 0; it < iterations; it++) {
    const sums = centroids.map(() => ({ r: 0, g: 0, b: 0, w: 0 }))
    for (const p of points) {
      let bi = 0
      let bd = Infinity
      for (let i = 0; i < centroids.length; i++) {
        const d = dist2(centroids[i], p)
        if (d < bd) {
          bd = d
          bi = i
        }
      }
      const s = sums[bi]
      s.r += p.r * p.w
      s.g += p.g * p.w
      s.b += p.b * p.w
      s.w += p.w
    }
    for (let i = 0; i < centroids.length; i++) {
      if (sums[i].w > 0) {
        centroids[i] = {
          r: Math.round(sums[i].r / sums[i].w),
          g: Math.round(sums[i].g / sums[i].w),
          b: Math.round(sums[i].b / sums[i].w),
        }
      }
    }
  }

  return centroids
}

/**
 * Reduces `data`'s RGB palette to at most `colors` colors, leaving alpha
 * untouched. `undefined` if `data`'s length isn't a whole number of RGBA
 * pixels, or `colors`/`iterations`/`alphaThreshold` fail `isValidU32` (phase
 * 6: the same boundary-number-validation convention every other kernel
 * argument gets — design.md "Boundary number validation").
 */
function quantize(data: Uint8Array, colors: number, weightBySaturation: boolean, iterations: number, alphaThreshold: number): Uint8Array | undefined {
  if (data.length % CHANNELS !== 0 || !isValidU32(colors) || !isValidU32(iterations) || !isValidU32(alphaThreshold) || colors > MAX_QUANTIZE_COLORS) return undefined

  const points: QPoint[] = []
  for (let i = 0; i < data.length; i += CHANNELS) {
    const a = data[i + 3]
    if (a < alphaThreshold) continue
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const w = weightBySaturation ? 1 + SATURATION_WEIGHT * saturation(r, g, b) : 1
    points.push({ r, g, b, w })
  }

  const palette = buildPalette(points, colors, iterations)
  const out = new Uint8Array(data)
  for (let i = 0; i < out.length; i += CHANNELS) {
    const a = out[i + 3]
    if (a < alphaThreshold) continue
    const c = nearest(palette, { r: out[i], g: out[i + 1], b: out[i + 2] })
    if (!c) continue // defensive — never reached, see this function's doc
    out[i] = c.r
    out[i + 1] = c.g
    out[i + 2] = c.b
  }
  return out
}

// ── Phase 6: downscale (majority-vote, defringed) ──────────────────────────
// Self-contained mirror of `apps/editor/src/lib/downscale.ts`'s
// `downscaleTo` (NOT `resizeNearest` — out of this phase's scope, see
// `downscale.rs`'s module doc). The `ALPHA_OPAQUE / 2` fallback threshold is
// deliberately kept as the exact float `127.5`, never rounded — see
// `downscale.rs`'s doc for why that half-integer changes which side `alpha
// === 127`/`128` falls on.

const DOWNSCALE_ALPHA_OPAQUE = 255
const DOWNSCALE_OPAQUE_TRANSPARENT_SPLIT = DOWNSCALE_ALPHA_OPAQUE / 2 // 127.5, exact — never round this
const DOWNSCALE_BUCKET_SHIFT = 3
const DOWNSCALE_CORE_ALPHA_THRESHOLD = 200

interface DownscaleBucket {
  count: number
  r: number
  g: number
  b: number
}

function hasSolidCore(data: Uint8Array): boolean {
  for (let i = 3; i < data.length; i += CHANNELS) {
    if (data[i] >= DOWNSCALE_CORE_ALPHA_THRESHOLD) return true
  }
  return false
}

function dominantColor(data: Uint8Array, srcW: number, x0: number, x1: number, y0: number, y1: number, coreAlpha: number): [number, number, number, number] {
  const buckets = new Map<number, DownscaleBucket>()
  let opaque = 0
  let transparent = 0
  let core = 0

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * srcW + x) * CHANNELS
      const a = data[i + 3]
      if (a < DOWNSCALE_OPAQUE_TRANSPARENT_SPLIT) {
        transparent++
        continue
      }
      opaque++
      if (a < coreAlpha) continue
      core++
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const key = ((r >> DOWNSCALE_BUCKET_SHIFT) << 10) | ((g >> DOWNSCALE_BUCKET_SHIFT) << 5) | (b >> DOWNSCALE_BUCKET_SHIFT)
      const bucket = buckets.get(key)
      if (bucket) {
        bucket.count++
        bucket.r += r
        bucket.g += g
        bucket.b += b
      } else {
        buckets.set(key, { count: 1, r, g, b })
      }
    }
  }

  if (transparent >= opaque || core === 0) return [0, 0, 0, 0]

  let best: DownscaleBucket | null = null
  for (const bucket of buckets.values()) {
    if (!best || bucket.count > best.count) best = bucket
  }
  if (!best) return [0, 0, 0, 0]
  return [Math.round(best.r / best.count), Math.round(best.g / best.count), Math.round(best.b / best.count), DOWNSCALE_ALPHA_OPAQUE]
}

/**
 * Majority-vote downscale from `srcW x srcH` to `targetW x targetH`.
 * `undefined` if `data`'s length doesn't match `srcW*srcH*4`, any dimension
 * is zero, or any numeric argument fails `isValidU32`.
 */
function downscale(data: Uint8Array, srcW: number, srcH: number, targetW: number, targetH: number): Uint8Array | undefined {
  if (
    !isValidU32(srcW) ||
    !isValidU32(srcH) ||
    !isValidU32(targetW) ||
    !isValidU32(targetH) ||
    !validBuffer(data, srcW, srcH) ||
    srcW === 0 ||
    srcH === 0 ||
    targetW === 0 ||
    targetH === 0 ||
    targetW > MAX_DOWNSCALE_DIMENSION ||
    targetH > MAX_DOWNSCALE_DIMENSION
  ) {
    return undefined
  }

  const coreAlpha = hasSolidCore(data) ? DOWNSCALE_CORE_ALPHA_THRESHOLD : DOWNSCALE_OPAQUE_TRANSPARENT_SPLIT
  const out = new Uint8Array(targetW * targetH * CHANNELS)

  for (let ty = 0; ty < targetH; ty++) {
    const y0 = Math.floor((ty * srcH) / targetH)
    const y1 = Math.max(y0 + 1, Math.floor(((ty + 1) * srcH) / targetH))
    for (let tx = 0; tx < targetW; tx++) {
      const x0 = Math.floor((tx * srcW) / targetW)
      const x1 = Math.max(x0 + 1, Math.floor(((tx + 1) * srcW) / targetW))
      const [r, g, b, a] = dominantColor(data, srcW, x0, x1, y0, y1, coreAlpha)
      const o = (ty * targetW + tx) * CHANNELS
      out[o] = r
      out[o + 1] = g
      out[o + 2] = b
      out[o + 3] = a
    }
  }
  return out
}

export const tsKernels: PixelKernels = {
  impl: 'ts',
  putPoints,
  floodFill,
  cloneBuffer,
  diffRect,
  extractRect,
  writeRect,
  bytesEqual,
  quantize,
  downscale,
}

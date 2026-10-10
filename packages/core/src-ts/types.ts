/**
 * `PixelKernels` (design.md D5: "stateless, phases 4-6") — the stable,
 * flat-function boundary both `tsKernels` and `wasmKernels` implement
 * identically. Every signature here already matches what a wasm-bindgen
 * export looks like from the JS side: numeric handles/dimensions, a packed
 * `u32` color, a flat `Uint8Array` buffer in, and either a mutated buffer
 * (in place) or a fresh one/`undefined` out — never a live object.
 */
export interface PixelKernels {
  readonly impl: 'ts' | 'wasm'
  /**
   * T1 (phase 4f): writes every `(x, y)` pair in `points` (interleaved
   * `i32`s — see `apps/editor/src/lib/core/color-codec.ts`'s `packPoints`)
   * with `rgba`, in ONE call. This REPLACES per-pixel `getPixel`/`putPixel`
   * on this facade — they are still useful Rust-domain building blocks
   * (kept in `crate::pixels`/its own `cargo test`s, and as private TS
   * helpers here), but a facade that offers a one-pixel-per-FFI-call path
   * invites exactly the worst-case usage pattern this crate's own bench
   * measured as ~1480x slower than TS (the per-call JS<->Wasm boundary cost
   * dominates at that granularity — see `LEARNING.md` §4). Returns the
   * number of points actually written (an out-of-range point is skipped,
   * never thrown).
   */
  putPoints(data: Uint8Array, w: number, h: number, points: Int32Array, rgba: number): number
  /**
   * Phase 5: 4-connected flood fill, operating IN PLACE on `data` (design.md
   * "Interfaces / Contracts": "`PixelKernels` ... operates in place and
   * returns the dirty rect"). Returns the dirty rect `[x, y, w, h]` touched
   * by the fill, or `undefined` if nothing changed — an invalid buffer shape,
   * an out-of-bounds seed, or a seed pixel that already matches `rgba` (a
   * true no-op, mirroring `apps/editor/src/lib/flood-fill.ts`'s
   * `colorsEqual` short-circuit). Never throws/traps on any input; 4-
   * connected (matches the existing TS editor behavior — no diagonal leak).
   */
  floodFill(data: Uint8Array, w: number, h: number, x: number, y: number, rgba: number): [number, number, number, number] | undefined
  cloneBuffer(data: Uint8Array): Uint8Array
  diffRect(before: Uint8Array, after: Uint8Array, w: number, h: number): [number, number, number, number] | undefined
  extractRect(data: Uint8Array, w: number, h: number, rx: number, ry: number, rw: number, rh: number): Uint8Array | undefined
  writeRect(data: Uint8Array, w: number, h: number, rx: number, ry: number, rw: number, rh: number, patch: Uint8Array): boolean
  bytesEqual(a: Uint8Array, b: Uint8Array): boolean
  /**
   * Phase 6: reduces `data`'s RGB palette to at most `colors` colors (alpha
   * is left byte-for-byte untouched). Unlike every kernel above, this
   * returns a FRESH buffer rather than mutating in place (mirrors
   * `apps/editor/src/lib/quantize.ts`'s `cloneBuffer`-then-recolor shape) —
   * `undefined` if `data`'s length isn't a whole number of RGBA pixels, or
   * `colors`/`iterations`/`alphaThreshold` fail the same `isValidU32`
   * boundary check every other numeric kernel argument gets (design.md
   * "Boundary number validation").
   */
  quantize(data: Uint8Array, colors: number, weightBySaturation: boolean, iterations: number, alphaThreshold: number): Uint8Array | undefined
  /**
   * Phase 6: majority-vote downscale from `srcW x srcH` to `targetW x
   * targetH`, defringing anti-aliased edges (see `crate::downscale`'s doc).
   * Returns a FRESH `targetW*targetH*4`-byte buffer, or `undefined` if
   * `data`'s length doesn't match `srcW*srcH*4`, any dimension is zero, or
   * any numeric argument fails `isValidU32`.
   */
  downscale(data: Uint8Array, srcW: number, srcH: number, targetW: number, targetH: number): Uint8Array | undefined
}

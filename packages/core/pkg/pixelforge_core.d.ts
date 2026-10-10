/* tslint:disable */
/* eslint-disable */

/**
 * `true` iff two same-length byte slices hold identical values.
 */
export function bytes_equal(a: Uint8Array, b: Uint8Array): boolean;

/**
 * Returns an independent copy of `data` — a `Vec<u8>` return is always
 * copied back to JS as a fresh `Uint8Array` (never a view).
 */
export function clone_buffer(data: Uint8Array): Uint8Array;

/**
 * Bounding box of every differing byte between two same-sized buffers,
 * packed as `[x, y, w, h]` — `None` (JS: `undefined`) if they are identical.
 */
export function diff_rect(before: Uint8Array, after: Uint8Array, w: number, h: number): Uint32Array | undefined;

/**
 * Copies `rect` (`rx, ry, rw, rh`) out of `data` as a tightly-packed RGBA
 * byte vec. `None` if the rect doesn't fit the buffer.
 */
export function extract_rect(data: Uint8Array, w: number, h: number, rx: number, ry: number, rw: number, rh: number): Uint8Array | undefined;

/**
 * 4-connected flood fill (phase 5, design.md's Rust surface), in place.
 * Returns the dirty rect packed as `[x, y, w, h]` — `None` (JS: `undefined`)
 * if nothing changed: an invalid buffer shape, an out-of-bounds seed, or a
 * seed pixel that already matches `rgba`. See `crate::flood_fill` for the
 * algorithm (stack-based, no recursion, bounded memory).
 */
export function flood_fill(data: Uint8Array, w: number, h: number, x: number, y: number, rgba: number): Uint32Array | undefined;

/**
 * Reads one pixel as a packed `u32` (R highest byte, A lowest — see
 * `pixels::pack_rgba`). Returns `0` (fully transparent black) for an
 * out-of-range coordinate — a boundary no-op, never a throw.
 */
export function get_pixel(data: Uint8Array, w: number, h: number, x: number, y: number): number;

/**
 * Writes one pixel in place. A `&mut [u8]` argument is copied INTO Wasm
 * memory, mutated, then copied back OUT by wasm-bindgen's generated glue
 * (see `LEARNING.md`) — the caller's `Uint8ClampedArray` sees the write once
 * the call returns. A no-op (returns `false`) for an out-of-range coordinate.
 */
export function put_pixel(data: Uint8Array, w: number, h: number, x: number, y: number, rgba: number): boolean;

/**
 * Writes every `(x, y)` pair in `points` (interleaved `i32`s) with `rgba`,
 * in ONE call — T1 (phase 4f): the batched replacement for a per-pixel
 * `put_pixel` loop crossing the FFI boundary once per point. Returns the
 * count of points actually written (out-of-range points are skipped, never
 * panic). `get_pixel`/`put_pixel` stay exported here (useful for Rust-side
 * tests/tools that want single-pixel access), but `src-ts/types.ts`'s
 * `PixelKernels` facade — the only thing `apps/editor` is meant to call —
 * no longer exposes them, steering callers to this batched kernel instead.
 */
export function put_points(data: Uint8Array, w: number, h: number, points: Int32Array, rgba: number): number;

/**
 * Writes `patch` into `rect` of `data`, in place. `false` (no-op) if the
 * rect doesn't fit the buffer or `patch`'s length doesn't match `rw*rh*4`.
 */
export function write_rect(data: Uint8Array, w: number, h: number, rx: number, ry: number, rw: number, rh: number, patch: Uint8Array): boolean;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly bytes_equal: (a: number, b: number, c: number, d: number) => number;
    readonly clone_buffer: (a: number, b: number) => [number, number];
    readonly diff_rect: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly extract_rect: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number];
    readonly flood_fill: (a: number, b: number, c: any, d: number, e: number, f: number, g: number, h: number) => [number, number];
    readonly get_pixel: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly put_pixel: (a: number, b: number, c: any, d: number, e: number, f: number, g: number, h: number) => number;
    readonly put_points: (a: number, b: number, c: any, d: number, e: number, f: number, g: number, h: number) => number;
    readonly write_rect: (a: number, b: number, c: any, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;

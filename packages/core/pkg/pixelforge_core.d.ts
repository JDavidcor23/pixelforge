/* tslint:disable */
/* eslint-disable */

/**
 * The Wasm-exposed `Document` handle. Holds the ENTIRE document (frames,
 * layers, pixel buffers) in Wasm linear memory — `readLayer`/`exportPixels`
 * are the only ways pixel bytes ever leave it, and both always COPY (D7: a
 * view into Wasm memory is invalidated by the next call that might grow
 * that memory).
 */
export class WasmDocument {
    free(): void;
    [Symbol.dispose](): void;
    can_redo(): boolean;
    can_undo(): boolean;
    /**
     * TEST-ONLY (phase 7f). Deliberately panics — with this crate's
     * `panic = "abort"` release profile, that compiles to a Wasm
     * `unreachable` trap, i.e. a REAL `WebAssembly.RuntimeError`, not a
     * simulated one. Exists purely so JS-side tests can reproduce the
     * actual wasm-bindgen post-trap behavior (the generated glue sets a
     * "this object is currently borrowed" flag before entering any `&self`/
     * `&mut self` method and only clears it on a NORMAL return — a trap
     * skips that cleanup, so the flag is stuck forever and every later call
     * on the SAME JS handle throws a plain `Error: recursive use of an
     * object detected which is already borrowed`, never another
     * `RuntimeError`) without relying on a slow/flaky genuine OOM. Never
     * called by production TS (`rg`-verified: only
     * `wasm-pixel-core-resolver.*.test.ts` and `wasm-document-core.test.ts`
     * reference it).
     */
    debug_force_trap(): void;
    doc_replace(canvas_w: number, canvas_h: number, frame_count: number, frame_duration_ms: number, pixels: Uint8Array, label: string): Uint32Array;
    export_pixels(): Uint8Array;
    fill(layer_id: number, x: number, y: number, rgba: number, label: string): Uint32Array;
    frame_add(): Uint32Array;
    frame_paste(at: number, layer_counts: Uint32Array, durations: Uint32Array, visible: Uint32Array, locked: Uint32Array, opacity: Float64Array, name_lens: Uint32Array, names_bytes: Uint8Array, pixels: Uint8Array): Uint32Array;
    frame_remove(index: number): Uint32Array;
    frame_select(index: number): Uint32Array;
    /**
     * Imports a full document from the flat wire format. `undefined` on any
     * shape mismatch — a boundary-validated no-op, never a panic/throw. See
     * `Document::from_payload`'s doc for the exact `doc_meta` layout.
     */
    static from_payload(doc_meta: Uint32Array, layer_opacity: Float64Array, layer_name_lens: Uint32Array, layer_names_bytes: Uint8Array, pixels: Uint8Array): WasmDocument | undefined;
    history_bytes(): number;
    layer_add(): Uint32Array;
    layer_meta(layer_id: number, name?: string | null, visible?: boolean | null, locked?: boolean | null, opacity?: number | null): Uint32Array;
    layer_remove(layer_id: number): Uint32Array;
    layer_reorder(from: number, to: number): Uint32Array;
    layer_set_active(layer_id: number): Uint32Array;
    meta_doc(): Uint32Array;
    meta_layer_name_lens(): Uint32Array;
    meta_layer_names_bytes(): Uint8Array;
    meta_layer_opacity(): Float64Array;
    /**
     * Fresh document: one frame, one default layer. Mirrors
     * `Document::new` — see that function's doc.
     */
    constructor(canvas_w: number, canvas_h: number);
    /**
     * Fix-agent 7g (item 3): see `Document::noop`'s doc.
     */
    noop(): Uint32Array;
    read_layer(frame_id: number, layer_id: number): Uint8Array;
    redo(): Uint32Array;
    region_clear(layer_id: number, rx: number, ry: number, rw: number, rh: number): Uint32Array;
    selection_commit(layer_id: number, rx: number, ry: number, rw: number, rh: number, pixels: Uint8Array): Uint32Array;
    stroke_begin(layer_id: number): Uint32Array;
    stroke_end(label: string): Uint32Array;
    stroke_points(points: Int32Array, rgba: number): Uint32Array;
    timeline_set_fps(fps: number): Uint32Array;
    timeline_set_frame_selection(indices: Uint32Array): Uint32Array;
    timeline_toggle_loop(): Uint32Array;
    timeline_toggle_playback(): Uint32Array;
    undo(): Uint32Array;
}

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
 * Majority-vote downscale from `src_w x src_h` to `target_w x target_h`
 * (phase 6, design.md "Lossless Pixel Round-Trip"). `None` (JS: `undefined`)
 * if `data`'s length doesn't match `src_w*src_h*4`, any dimension is zero,
 * or `target_w`/`target_h` exceeds `crate::downscale::
 * MAX_DOWNSCALE_TARGET_DIMENSION` (phase 6f boundary hardening — closes an
 * allocation-size overflow that used to trap the Wasm instance for an
 * individually-"valid" `u32` target, verify-report-phase-6.md W-A). See
 * `crate::downscale` for the algorithm.
 */
export function downscale(data: Uint8Array, src_w: number, src_h: number, target_w: number, target_h: number): Uint8Array | undefined;

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
 * Reduces `data`'s RGB palette to at most `colors` colors (phase 6, design.md
 * "Lossless Pixel Round-Trip"). A `Vec<u8>` return is always a fresh copy
 * back to JS (see `LEARNING.md`'s note on owned returns) — unlike the
 * in-place `&mut [u8]` kernels above, this always allocates a brand new
 * buffer, mirroring `quantizePixels`'s `cloneBuffer` + recolor shape.
 * `None` (JS: `undefined`) if `data`'s length isn't a whole number of RGBA
 * pixels, or `colors` exceeds `crate::quantize::MAX_QUANTIZE_COLORS` (phase
 * 6f boundary hardening — same convention `downscale` below documents). See
 * `crate::quantize` for the algorithm.
 */
export function quantize(data: Uint8Array, colors: number, weight_by_saturation: boolean, iterations: number, alpha_threshold: number): Uint8Array | undefined;

/**
 * Writes `patch` into `rect` of `data`, in place. `false` (no-op) if the
 * rect doesn't fit the buffer or `patch`'s length doesn't match `rw*rh*4`.
 */
export function write_rect(data: Uint8Array, w: number, h: number, rx: number, ry: number, rw: number, rh: number, patch: Uint8Array): boolean;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_wasmdocument_free: (a: number, b: number) => void;
    readonly bytes_equal: (a: number, b: number, c: number, d: number) => number;
    readonly clone_buffer: (a: number, b: number) => [number, number];
    readonly diff_rect: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly downscale: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly extract_rect: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number];
    readonly flood_fill: (a: number, b: number, c: any, d: number, e: number, f: number, g: number, h: number) => [number, number];
    readonly get_pixel: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly put_pixel: (a: number, b: number, c: any, d: number, e: number, f: number, g: number, h: number) => number;
    readonly put_points: (a: number, b: number, c: any, d: number, e: number, f: number, g: number, h: number) => number;
    readonly quantize: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly wasmdocument_can_redo: (a: number) => number;
    readonly wasmdocument_can_undo: (a: number) => number;
    readonly wasmdocument_debug_force_trap: (a: number) => void;
    readonly wasmdocument_doc_replace: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number];
    readonly wasmdocument_export_pixels: (a: number) => [number, number];
    readonly wasmdocument_fill: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
    readonly wasmdocument_frame_add: (a: number) => [number, number];
    readonly wasmdocument_frame_paste: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number, r: number) => [number, number];
    readonly wasmdocument_frame_remove: (a: number, b: number) => [number, number];
    readonly wasmdocument_frame_select: (a: number, b: number) => [number, number];
    readonly wasmdocument_from_payload: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => number;
    readonly wasmdocument_history_bytes: (a: number) => number;
    readonly wasmdocument_layer_add: (a: number) => [number, number];
    readonly wasmdocument_layer_meta: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number];
    readonly wasmdocument_layer_remove: (a: number, b: number) => [number, number];
    readonly wasmdocument_layer_reorder: (a: number, b: number, c: number) => [number, number];
    readonly wasmdocument_layer_set_active: (a: number, b: number) => [number, number];
    readonly wasmdocument_meta_doc: (a: number) => [number, number];
    readonly wasmdocument_meta_layer_name_lens: (a: number) => [number, number];
    readonly wasmdocument_meta_layer_names_bytes: (a: number) => [number, number];
    readonly wasmdocument_meta_layer_opacity: (a: number) => [number, number];
    readonly wasmdocument_new: (a: number, b: number) => number;
    readonly wasmdocument_noop: (a: number) => [number, number];
    readonly wasmdocument_read_layer: (a: number, b: number, c: number) => [number, number];
    readonly wasmdocument_redo: (a: number) => [number, number];
    readonly wasmdocument_region_clear: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly wasmdocument_selection_commit: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number];
    readonly wasmdocument_stroke_begin: (a: number, b: number) => [number, number];
    readonly wasmdocument_stroke_end: (a: number, b: number, c: number) => [number, number];
    readonly wasmdocument_stroke_points: (a: number, b: number, c: number, d: number) => [number, number];
    readonly wasmdocument_timeline_set_fps: (a: number, b: number) => [number, number];
    readonly wasmdocument_timeline_set_frame_selection: (a: number, b: number, c: number) => [number, number];
    readonly wasmdocument_timeline_toggle_loop: (a: number) => [number, number];
    readonly wasmdocument_timeline_toggle_playback: (a: number) => [number, number];
    readonly wasmdocument_undo: (a: number) => [number, number];
    readonly write_rect: (a: number, b: number, c: any, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
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

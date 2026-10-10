//! The ONLY module in this crate that knows about wasm-bindgen/JS (hexagonal:
//! `crate::pixels` is pure Rust, this module is the thin adapter). Every
//! function here is a flat, numeric-handle call (design D6: "no serde") —
//! `&[u8]`/`&mut [u8]` buffer args, `u32` dimensions/coordinates/packed
//! colors, `Option<Box<[u32]>>` for a "maybe a rect" return (wasm-bindgen
//! cannot return a tuple or a `None`-able primitive directly).
//!
//! No `unsafe`, no `.unwrap()` on anything that came from JS — every
//! boundary-validated no-op in `crate::pixels` (an out-of-range coordinate, a
//! rect that doesn't fit, a mismatched patch length) surfaces here as `false`/
//! `None`/an unchanged buffer, never a panic that would abort the whole Wasm
//! instance.

use crate::pixels;
use wasm_bindgen::prelude::*;

/// Reads one pixel as a packed `u32` (R highest byte, A lowest — see
/// `pixels::pack_rgba`). Returns `0` (fully transparent black) for an
/// out-of-range coordinate — a boundary no-op, never a throw.
#[wasm_bindgen]
pub fn get_pixel(data: &[u8], w: u32, h: u32, x: u32, y: u32) -> u32 {
    pixels::get_pixel(data, w, h, x, y).unwrap_or(0)
}

/// Writes one pixel in place. A `&mut [u8]` argument is copied INTO Wasm
/// memory, mutated, then copied back OUT by wasm-bindgen's generated glue
/// (see `LEARNING.md`) — the caller's `Uint8ClampedArray` sees the write once
/// the call returns. A no-op (returns `false`) for an out-of-range coordinate.
#[wasm_bindgen]
pub fn put_pixel(data: &mut [u8], w: u32, h: u32, x: u32, y: u32, rgba: u32) -> bool {
    pixels::put_pixel(data, w, h, x, y, rgba)
}

/// Returns an independent copy of `data` — a `Vec<u8>` return is always
/// copied back to JS as a fresh `Uint8Array` (never a view).
#[wasm_bindgen]
pub fn clone_buffer(data: &[u8]) -> Vec<u8> {
    pixels::clone_buffer(data)
}

/// Bounding box of every differing byte between two same-sized buffers,
/// packed as `[x, y, w, h]` — `None` (JS: `undefined`) if they are identical.
#[wasm_bindgen]
pub fn diff_rect(before: &[u8], after: &[u8], w: u32, h: u32) -> Option<Box<[u32]>> {
    pixels::diff_rect(before, after, w, h)
        .map(|(x, y, rw, rh)| vec![x, y, rw, rh].into_boxed_slice())
}

/// Copies `rect` (`rx, ry, rw, rh`) out of `data` as a tightly-packed RGBA
/// byte vec. `None` if the rect doesn't fit the buffer.
#[wasm_bindgen]
pub fn extract_rect(
    data: &[u8],
    w: u32,
    h: u32,
    rx: u32,
    ry: u32,
    rw: u32,
    rh: u32,
) -> Option<Vec<u8>> {
    pixels::extract_rect(data, w, h, rx, ry, rw, rh)
}

/// Writes `patch` into `rect` of `data`, in place. `false` (no-op) if the
/// rect doesn't fit the buffer or `patch`'s length doesn't match `rw*rh*4`.
#[allow(clippy::too_many_arguments)] // flat FFI args by design — see pixels::write_rect
#[wasm_bindgen]
pub fn write_rect(
    data: &mut [u8],
    w: u32,
    h: u32,
    rx: u32,
    ry: u32,
    rw: u32,
    rh: u32,
    patch: &[u8],
) -> bool {
    pixels::write_rect(data, w, h, rx, ry, rw, rh, patch)
}

/// `true` iff two same-length byte slices hold identical values.
#[wasm_bindgen]
pub fn bytes_equal(a: &[u8], b: &[u8]) -> bool {
    pixels::bytes_equal(a, b)
}

/// Writes every `(x, y)` pair in `points` (interleaved `i32`s) with `rgba`,
/// in ONE call — T1 (phase 4f): the batched replacement for a per-pixel
/// `put_pixel` loop crossing the FFI boundary once per point. Returns the
/// count of points actually written (out-of-range points are skipped, never
/// panic). `get_pixel`/`put_pixel` stay exported here (useful for Rust-side
/// tests/tools that want single-pixel access), but `src-ts/types.ts`'s
/// `PixelKernels` facade — the only thing `apps/editor` is meant to call —
/// no longer exposes them, steering callers to this batched kernel instead.
#[wasm_bindgen]
pub fn put_points(data: &mut [u8], w: u32, h: u32, points: &[i32], rgba: u32) -> u32 {
    pixels::put_points(data, w, h, points, rgba)
}

/// 4-connected flood fill (phase 5, design.md's Rust surface), in place.
/// Returns the dirty rect packed as `[x, y, w, h]` — `None` (JS: `undefined`)
/// if nothing changed: an invalid buffer shape, an out-of-bounds seed, or a
/// seed pixel that already matches `rgba`. See `crate::flood_fill` for the
/// algorithm (stack-based, no recursion, bounded memory).
#[wasm_bindgen]
pub fn flood_fill(
    data: &mut [u8],
    w: u32,
    h: u32,
    x: u32,
    y: u32,
    rgba: u32,
) -> Option<Box<[u32]>> {
    crate::flood_fill::flood_fill(data, w, h, x, y, rgba)
        .map(|(fx, fy, fw, fh)| vec![fx, fy, fw, fh].into_boxed_slice())
}

/// Reduces `data`'s RGB palette to at most `colors` colors (phase 6, design.md
/// "Lossless Pixel Round-Trip"). A `Vec<u8>` return is always a fresh copy
/// back to JS (see `LEARNING.md`'s note on owned returns) — unlike the
/// in-place `&mut [u8]` kernels above, this always allocates a brand new
/// buffer, mirroring `quantizePixels`'s `cloneBuffer` + recolor shape.
/// `None` (JS: `undefined`) if `data`'s length isn't a whole number of RGBA
/// pixels. See `crate::quantize` for the algorithm.
#[wasm_bindgen]
pub fn quantize(
    data: &[u8],
    colors: u32,
    weight_by_saturation: bool,
    iterations: u32,
    alpha_threshold: u32,
) -> Option<Vec<u8>> {
    crate::quantize::quantize(
        data,
        colors,
        weight_by_saturation,
        iterations,
        alpha_threshold,
    )
}

/// Majority-vote downscale from `src_w x src_h` to `target_w x target_h`
/// (phase 6, design.md "Lossless Pixel Round-Trip"). `None` (JS: `undefined`)
/// if `data`'s length doesn't match `src_w*src_h*4`, or any dimension is
/// zero. See `crate::downscale` for the algorithm.
#[allow(clippy::too_many_arguments)] // flat FFI args by design — see pixels::write_rect's precedent
#[wasm_bindgen]
pub fn downscale(
    data: &[u8],
    src_w: u32,
    src_h: u32,
    target_w: u32,
    target_h: u32,
) -> Option<Vec<u8>> {
    crate::downscale::downscale(data, src_w, src_h, target_w, target_h)
}

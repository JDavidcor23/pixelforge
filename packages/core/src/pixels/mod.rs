//! Pure-Rust pixel-buffer domain (design.md D1/D2/D6). A flat, row-major RGBA
//! buffer (`i = (y*w + x) * 4`, matching `apps/editor/src/lib/pixel-buffer.ts`
//! byte for byte) plus the handful of operations the TS core needs ported
//! first: get/put a pixel, clone, extract/write a rect, diff two buffers.
//!
//! This module knows NOTHING about wasm-bindgen or JS (hexagonal: the domain
//! has no FFI imports) — every function here takes and returns plain Rust
//! slices/`Vec<u8>`/tuples, and is tested natively with `cargo test`, no wasm
//! runtime needed. `crate::bindings` is the ONLY module that wraps these for
//! the JS boundary.
//!
//! Colors cross as a packed `u32` (design D6, matching
//! `apps/editor/src/lib/core/color-codec.ts`'s `packRgba`/`unpackRgba`
//! EXACTLY): R in the highest byte, A in the lowest —
//! `(r << 24) | (g << 16) | (b << 8) | a`.
//!
//! ## Boundary hardening (phase 4f, judgment-day W2/W3)
//!
//! Every function that takes a `data`/`before`/`after` buffer validates its
//! length against `w*h*CHANNELS` FIRST ([`valid_buffer`]) — a short or long
//! buffer is a boundary-validated no-op (`None`/`false`/empty), never an
//! out-of-bounds slice index. Every rect/coordinate bounds check uses
//! `checked_add`/`checked_mul` ([`buffer_len`], [`index`]) instead of plain
//! `u32` arithmetic — plain arithmetic silently WRAPS in a release build
//! (`overflow-checks` is off by default in `[profile.release]`), which is
//! exactly how a JS caller passing a "negative" coordinate (wasm-bindgen
//! coerces a negative `Number` into a huge `u32`, e.g. `-1` becomes
//! `4294967295`) used to bypass a plain `rx + rw > w` check entirely: the sum
//! wraps back down to a small number, the check passes, and the subsequent
//! index math wraps too, landing the write somewhere else in the buffer
//! entirely (silently "wrapping into the previous row" — confirmed via a
//! throwaway Wasm probe script during judgment-day). `checked_add`/
//! `checked_mul` make that overflow a hard `None`/reject instead, regardless
//! of the release-profile overflow-checks setting — the fix does not depend
//! on that `Cargo.toml` flag at all, which is the whole point: a boundary
//! that can take untrusted JS input must never rely on a build setting for
//! its safety.

pub const CHANNELS: u32 = 4;

/// Packs an `(r,g,b,a)` byte tuple into a `u32` — same bit layout as the TS
/// `packRgba` (R highest byte, A lowest), so a packed color round-trips
/// identically between the two implementations.
pub fn pack_rgba(r: u8, g: u8, b: u8, a: u8) -> u32 {
    ((r as u32) << 24) | ((g as u32) << 16) | ((b as u32) << 8) | (a as u32)
}

/// Inverse of [`pack_rgba`].
pub fn unpack_rgba(rgba: u32) -> (u8, u8, u8, u8) {
    (
        ((rgba >> 24) & 0xff) as u8,
        ((rgba >> 16) & 0xff) as u8,
        ((rgba >> 8) & 0xff) as u8,
        (rgba & 0xff) as u8,
    )
}

/// `true` iff `(x, y)` is a valid coordinate in a `w x h` buffer.
pub fn in_bounds(w: u32, h: u32, x: u32, y: u32) -> bool {
    x < w && y < h
}

/// `w * h * CHANNELS` as a `usize`, computed with checked arithmetic —
/// `None` on overflow (e.g. `w = h = 0x10000`, which overflows a `u32` and
/// would overflow a `usize` too on a 32-bit target; checked here regardless
/// of target pointer width).
fn buffer_len(w: u32, h: u32) -> Option<usize> {
    (w as usize)
        .checked_mul(h as usize)?
        .checked_mul(CHANNELS as usize)
}

/// `true` iff `data`'s length matches EXACTLY `w*h*CHANNELS` — the shape
/// every function below requires before it will touch `data` at all. `false`
/// (never a panic) if `w*h*CHANNELS` itself overflows.
pub fn valid_buffer(data: &[u8], w: u32, h: u32) -> bool {
    matches!(buffer_len(w, h), Some(len) if data.len() == len)
}

/// Byte offset of pixel `(x, y)` in a flat `w x h` RGBA buffer, checked —
/// `None` on any overflow along the way (`y*w`, `+x`, `*CHANNELS`). Callers
/// MUST check `in_bounds`/`valid_buffer` first for a meaningful reject
/// reason; this is the last line of defense against a wrap, not the primary
/// validation.
fn index(w: u32, x: u32, y: u32) -> Option<usize> {
    (y as usize)
        .checked_mul(w as usize)?
        .checked_add(x as usize)?
        .checked_mul(CHANNELS as usize)
}

/// Reads one pixel as a packed `u32`. `None` on an out-of-range coordinate,
/// a buffer whose length doesn't match `w*h*4`, or any overflow — never
/// panics, never wraps into the next row.
pub fn get_pixel(data: &[u8], w: u32, h: u32, x: u32, y: u32) -> Option<u32> {
    if !valid_buffer(data, w, h) || !in_bounds(w, h, x, y) {
        return None;
    }
    let i = index(w, x, y)?;
    Some(pack_rgba(data[i], data[i + 1], data[i + 2], data[i + 3]))
}

/// Writes one pixel in place. `false` (no-op) on an out-of-range coordinate,
/// a buffer whose length doesn't match `w*h*4`, or any overflow.
pub fn put_pixel(data: &mut [u8], w: u32, h: u32, x: u32, y: u32, rgba: u32) -> bool {
    if !valid_buffer(data, w, h) || !in_bounds(w, h, x, y) {
        return false;
    }
    let i = match index(w, x, y) {
        Some(i) => i,
        None => return false,
    };
    let (r, g, b, a) = unpack_rgba(rgba);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a;
    true
}

/// Owned copy of a buffer — the Rust equivalent of `cloneBuffer` (D2: every
/// batch gets its own copy, never aliased). No shape to validate against
/// (no `w`/`h` given) — `to_vec` never panics regardless of length.
pub fn clone_buffer(data: &[u8]) -> Vec<u8> {
    data.to_vec()
}

/// Bounding box `(x, y, w, h)` of every byte that differs between two
/// SAME-SIZED buffers, or `None` if they are byte-identical (or either
/// buffer's length doesn't match `w*h*4`). Mirrors `diffRect` in
/// `pixel-buffer.ts` exactly (same scan order, same tie handling) so the two
/// implementations agree on the smallest dirty rect for identical input.
pub fn diff_rect(before: &[u8], after: &[u8], w: u32, h: u32) -> Option<(u32, u32, u32, u32)> {
    if !valid_buffer(before, w, h) || !valid_buffer(after, w, h) {
        return None;
    }

    let mut min_x: i64 = w as i64;
    let mut min_y: i64 = h as i64;
    let mut max_x: i64 = -1;
    let mut max_y: i64 = -1;

    for y in 0..h {
        let row_start = (y as usize) * (w as usize) * (CHANNELS as usize);
        for x in 0..w {
            let i = row_start + (x as usize) * (CHANNELS as usize);
            if before[i] != after[i]
                || before[i + 1] != after[i + 1]
                || before[i + 2] != after[i + 2]
                || before[i + 3] != after[i + 3]
            {
                let xi = x as i64;
                let yi = y as i64;
                if xi < min_x {
                    min_x = xi;
                }
                if xi > max_x {
                    max_x = xi;
                }
                if yi < min_y {
                    min_y = yi;
                }
                if yi > max_y {
                    max_y = yi;
                }
            }
        }
    }

    if max_x < min_x || max_y < min_y {
        return None;
    }
    Some((
        min_x as u32,
        min_y as u32,
        (max_x - min_x + 1) as u32,
        (max_y - min_y + 1) as u32,
    ))
}

/// Copies just `rect` (`rx, ry, rw, rh`) out of a `w x h` buffer as a
/// tightly-packed RGBA byte vec. `None` if `data`'s length doesn't match
/// `w*h*4`, the rect doesn't fit the buffer, or any bound computation
/// overflows — a boundary-validated no-op, never a panic/out-of-range read.
pub fn extract_rect(
    data: &[u8],
    w: u32,
    h: u32,
    rx: u32,
    ry: u32,
    rw: u32,
    rh: u32,
) -> Option<Vec<u8>> {
    if !valid_buffer(data, w, h) || rw == 0 || rh == 0 {
        return None;
    }
    let rx_end = rx.checked_add(rw)?;
    let ry_end = ry.checked_add(rh)?;
    if rx_end > w || ry_end > h {
        return None;
    }
    let out_len = buffer_len(rw, rh)?;
    let row_bytes = (rw as usize).checked_mul(CHANNELS as usize)?;

    let mut out = vec![0u8; out_len];
    for row in 0..rh {
        let src_y = ry + row; // safe: row < rh and ry+rh <= h, already checked above
        let src_start = index(w, rx, src_y)?;
        let src_end = src_start.checked_add(row_bytes)?;
        let dest_start = (row as usize).checked_mul(row_bytes)?;
        let dest_end = dest_start.checked_add(row_bytes)?;
        out[dest_start..dest_end].copy_from_slice(&data[src_start..src_end]);
    }
    Some(out)
}

/// Writes `patch` (as produced by [`extract_rect`]) into `rect` of `data`, IN
/// PLACE. `false` (no-op) if `data`'s length doesn't match `w*h*4`, the rect
/// doesn't fit the buffer, `patch`'s length doesn't match `rw*rh*4`, or any
/// bound computation overflows — a boundary-validated no-op, never a
/// panic/out-of-range write.
///
/// 8 flat scalar/slice args by design (D6: "no serde" at the FFI boundary —
/// bundling `rx/ry/rw/rh` into a struct would need either a wasm-bindgen
/// class or serde to cross into `bindings.rs`, both of which D6 rules out).
#[allow(clippy::too_many_arguments)]
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
    if !valid_buffer(data, w, h) || rw == 0 || rh == 0 {
        return false;
    }
    let (rx_end, ry_end) = match (rx.checked_add(rw), ry.checked_add(rh)) {
        (Some(rx_end), Some(ry_end)) => (rx_end, ry_end),
        _ => return false,
    };
    if rx_end > w || ry_end > h {
        return false;
    }
    let row_bytes = match (rw as usize).checked_mul(CHANNELS as usize) {
        Some(n) => n,
        None => return false,
    };
    let expected_patch_len = match row_bytes.checked_mul(rh as usize) {
        Some(n) => n,
        None => return false,
    };
    if patch.len() != expected_patch_len {
        return false;
    }

    for row in 0..rh {
        let dest_y = ry + row; // safe: row < rh and ry+rh <= h, already checked above
        let dest_start = match index(w, rx, dest_y) {
            Some(i) => i,
            None => return false,
        };
        let dest_end = match dest_start.checked_add(row_bytes) {
            Some(n) => n,
            None => return false,
        };
        let src_start = match (row as usize).checked_mul(row_bytes) {
            Some(n) => n,
            None => return false,
        };
        let src_end = match src_start.checked_add(row_bytes) {
            Some(n) => n,
            None => return false,
        };
        data[dest_start..dest_end].copy_from_slice(&patch[src_start..src_end]);
    }
    true
}

/// Crops or pads `data` (a `old_w x old_h` buffer) to `new_w x new_h`,
/// anchored at the top-left corner: pixels inside the overlap are copied
/// byte-for-byte, and any newly added area is left fully transparent
/// (zeroed) — never resampled. Mirrors `apps/editor/src/lib/pixel-buffer.ts`'s
/// `resizeBuffer` exactly (ADR 0008's `doc.resize`). `None` if `data`'s
/// length doesn't match `old_w*old_h*CHANNELS`, or either output dimension
/// overflows the allocation size.
pub fn resize_buffer(
    data: &[u8],
    old_w: u32,
    old_h: u32,
    new_w: u32,
    new_h: u32,
) -> Option<Vec<u8>> {
    if !valid_buffer(data, old_w, old_h) {
        return None;
    }
    let out_len = buffer_len(new_w, new_h)?;
    let mut out = vec![0u8; out_len];
    let overlap_w = old_w.min(new_w);
    let overlap_h = old_h.min(new_h);
    if overlap_w > 0 && overlap_h > 0 {
        if let Some(patch) = extract_rect(data, old_w, old_h, 0, 0, overlap_w, overlap_h) {
            write_rect(&mut out, new_w, new_h, 0, 0, overlap_w, overlap_h, &patch);
        }
    }
    Some(out)
}

/// `true` iff two same-length byte slices hold identical values.
pub fn bytes_equal(a: &[u8], b: &[u8]) -> bool {
    a == b
}

/// Writes every `(x, y)` pair in `points` (interleaved `i32`s — `x0,y0,x1,y1,
/// ...`, matching `apps/editor/src/lib/core/color-codec.ts`'s `packPoints`)
/// with `rgba`, in ONE call. T1 (phase 4f): this is the batched replacement
/// for calling `put_pixel` once per point — the per-pixel kernels stay in
/// this module (and its own tests) because they are still useful BUILDING
/// BLOCKS and a clean unit of Rust-side correctness, but the public facade
/// (`bindings.rs`'s wasm-bindgen exports consumed by `src-ts/types.ts`'s
/// `PixelKernels`) no longer offers a one-pixel-per-FFI-call path, so a
/// caller is steered toward batching by construction, not just by
/// convention/comment. A point whose coordinate is out of range is skipped
/// (never panics, never aborts the rest of the batch — same "boundary
/// no-op, never a crash" contract every other function here has). An odd
/// `points` length is rejected as a whole malformed batch (`0` written, data
/// untouched) rather than silently dropping its trailing element. Returns
/// the number of points actually written, so a caller can tell a partial
/// (some points off-canvas) batch from a fully no-op one.
pub fn put_points(data: &mut [u8], w: u32, h: u32, points: &[i32], rgba: u32) -> u32 {
    if !points.len().is_multiple_of(2) {
        return 0;
    }
    let mut written: u32 = 0;
    let mut i = 0;
    while i + 1 < points.len() {
        let x = points[i];
        let y = points[i + 1];
        if x >= 0 && y >= 0 && put_pixel(data, w, h, x as u32, y as u32, rgba) {
            written += 1;
        }
        i += 2;
    }
    written
}

#[cfg(test)]
mod tests {
    use super::*;

    fn empty(w: u32, h: u32) -> Vec<u8> {
        vec![0u8; (w * h * CHANNELS) as usize]
    }

    #[test]
    fn pack_unpack_roundtrip_matches_byte_order() {
        let rgba = pack_rgba(0xAA, 0xBB, 0xCC, 0xDD);
        assert_eq!(rgba, 0xAABBCCDD);
        assert_eq!(unpack_rgba(rgba), (0xAA, 0xBB, 0xCC, 0xDD));
    }

    #[test]
    fn get_set_pixel_roundtrip() {
        let mut data = empty(4, 4);
        let red = pack_rgba(255, 0, 0, 255);
        assert!(put_pixel(&mut data, 4, 4, 1, 2, red));
        assert_eq!(get_pixel(&data, 4, 4, 1, 2), Some(red));
        // untouched neighbor stays transparent
        assert_eq!(get_pixel(&data, 4, 4, 0, 0), Some(0));
    }

    #[test]
    fn out_of_bounds_is_a_safe_no_op() {
        let mut data = empty(4, 4);
        assert_eq!(get_pixel(&data, 4, 4, 4, 0), None); // x == w is out of range
        assert_eq!(get_pixel(&data, 4, 4, 0, 4), None);
        assert!(!put_pixel(&mut data, 4, 4, 10, 10, 0xffffffff));
        assert_eq!(data, empty(4, 4)); // never wrote anywhere, never wrapped into another row
    }

    #[test]
    fn clone_buffer_is_an_independent_copy() {
        let data = empty(2, 2);
        let mut cloned = clone_buffer(&data);
        put_pixel(&mut cloned, 2, 2, 0, 0, 0xffffffff);
        assert_ne!(data, cloned);
    }

    #[test]
    fn diff_rect_finds_the_tight_bounding_box() {
        let w = 4;
        let h = 4;
        let before = empty(w, h);
        let mut after = empty(w, h);
        put_pixel(&mut after, w, h, 1, 1, pack_rgba(1, 0, 0, 255));
        put_pixel(&mut after, w, h, 2, 3, pack_rgba(1, 0, 0, 255));
        assert_eq!(diff_rect(&before, &after, w, h), Some((1, 1, 2, 3)));
    }

    #[test]
    fn diff_rect_identical_buffers_is_none() {
        let data = empty(4, 4);
        assert_eq!(diff_rect(&data, &data, 4, 4), None);
    }

    #[test]
    fn extract_then_write_rect_roundtrips() {
        let w = 4;
        let h = 4;
        let mut data = empty(w, h);
        put_pixel(&mut data, w, h, 1, 1, pack_rgba(9, 8, 7, 255));
        let patch = extract_rect(&data, w, h, 1, 1, 2, 2).unwrap();

        let mut target = empty(w, h);
        assert!(write_rect(&mut target, w, h, 1, 1, 2, 2, &patch));
        assert_eq!(
            get_pixel(&target, w, h, 1, 1),
            Some(pack_rgba(9, 8, 7, 255))
        );
        assert!(bytes_equal(
            &extract_rect(&target, w, h, 1, 1, 2, 2).unwrap(),
            &patch
        ));
    }

    #[test]
    fn extract_rect_out_of_range_is_none() {
        let data = empty(4, 4);
        assert_eq!(extract_rect(&data, 4, 4, 3, 3, 2, 2), None); // 3+2 > 4
        assert_eq!(extract_rect(&data, 4, 4, 0, 0, 0, 1), None); // zero-width
    }

    #[test]
    fn write_rect_rejects_mismatched_patch_length() {
        let mut data = empty(4, 4);
        let wrong_size_patch = vec![0u8; 3]; // not rw*rh*4
        assert!(!write_rect(&mut data, 4, 4, 0, 0, 1, 1, &wrong_size_patch));
    }

    // ── Phase 4f boundary-hardening tests (judgment-day W2/W3) ──────────────
    // Every case below is a reproduction of an adversarial input the
    // judgment-day Wasm probe found reachable from JS (a negative JS number
    // coerces to a huge `u32` at the wasm-bindgen boundary — these tests
    // exercise the Rust side directly with the post-coercion `u32` value).

    #[test]
    fn rejects_short_buffer_instead_of_panicking() {
        // declares a 4x4 (64-byte) buffer but only hands over 4 bytes.
        let short = vec![0u8; 4];
        assert_eq!(get_pixel(&short, 4, 4, 0, 0), None);
        let mut short_mut = vec![0u8; 4];
        assert!(!put_pixel(&mut short_mut, 4, 4, 0, 0, 0xffffffff));
        assert_eq!(extract_rect(&short, 4, 4, 0, 0, 1, 1), None);
        let mut short_target = vec![0u8; 4];
        assert!(!write_rect(
            &mut short_target,
            4,
            4,
            0,
            0,
            1,
            1,
            &[1, 2, 3, 4]
        ));
    }

    #[test]
    fn rejects_long_buffer_too_not_just_short() {
        // a buffer LONGER than w*h*4 is equally a shape mismatch, not "fine, just read the prefix".
        let long = vec![0u8; 128];
        assert_eq!(get_pixel(&long, 4, 4, 0, 0), None);
        assert_eq!(diff_rect(&long, &empty(4, 4), 4, 4), None);
    }

    #[test]
    fn rejects_wasm_coerced_negative_rx_without_wrapping_into_previous_row() {
        // JS `-1` for a `u32` param coerces to `u32::MAX` at the wasm-bindgen
        // boundary. A plain `rx + rw > w` check wraps (release profile has no
        // overflow-checks) and silently passes; `checked_add` must reject it.
        let mut data = empty(4, 4);
        assert!(!write_rect(&mut data, 4, 4, u32::MAX, 1, 2, 1, &[9; 8]));
        assert_eq!(data, empty(4, 4)); // never wrote anywhere, never wrapped into the previous row
        assert_eq!(extract_rect(&data, 4, 4, u32::MAX, 1, 2, 1), None);
    }

    #[test]
    fn rejects_huge_rw_that_would_overflow_the_bounds_check() {
        let mut data = empty(4, 4);
        assert!(!write_rect(
            &mut data,
            4,
            4,
            0x4000_0000,
            0,
            0xC000_0001,
            1,
            &[7, 7, 7, 7]
        ));
        assert_eq!(data, empty(4, 4));
    }

    #[test]
    fn rejects_dimensions_that_overflow_usize_multiplication() {
        // w = h = 0x10000: w*h = 0x1_0000_0000 overflows a u32 (and a 32-bit
        // usize); must reject cleanly rather than wrap into a tiny Vec and
        // then index out of it.
        let huge = 0x10000u32;
        assert_eq!(get_pixel(&[], huge, huge, 0xffff, 0xffff), None);
        assert_eq!(extract_rect(&[], huge, huge, 0, 0, 1, 1), None);
        assert!(!valid_buffer(&[], huge, huge));
    }

    #[test]
    fn diff_rect_rejects_mismatched_lengths() {
        assert_eq!(diff_rect(&empty(4, 4), &[0u8; 4], 4, 4), None);
    }

    #[test]
    fn put_points_writes_every_valid_point_in_one_call() {
        let mut data = empty(4, 4);
        let red = pack_rgba(255, 0, 0, 255);
        let points = [0, 0, 1, 1, 2, 2];
        assert_eq!(put_points(&mut data, 4, 4, &points, red), 3);
        assert_eq!(get_pixel(&data, 4, 4, 0, 0), Some(red));
        assert_eq!(get_pixel(&data, 4, 4, 1, 1), Some(red));
        assert_eq!(get_pixel(&data, 4, 4, 2, 2), Some(red));
    }

    #[test]
    fn put_points_skips_out_of_range_points_without_losing_the_rest() {
        let mut data = empty(4, 4);
        let red = pack_rgba(255, 0, 0, 255);
        // -1 and 10 are out of range; 1,1 is valid.
        let points = [-1, 0, 1, 1, 10, 10];
        assert_eq!(put_points(&mut data, 4, 4, &points, red), 1);
        assert_eq!(get_pixel(&data, 4, 4, 1, 1), Some(red));
    }

    #[test]
    fn put_points_rejects_an_odd_length_batch_as_a_whole() {
        let mut data = empty(4, 4);
        let points = [0, 0, 1]; // odd length — malformed
        assert_eq!(put_points(&mut data, 4, 4, &points, 0xffffffff), 0);
        assert_eq!(data, empty(4, 4));
    }

    #[test]
    fn put_points_on_a_short_buffer_is_a_safe_no_op() {
        let mut short = vec![0u8; 4];
        assert_eq!(put_points(&mut short, 4, 4, &[0, 0], 0xffffffff), 0);
    }

    #[test]
    fn resize_buffer_growing_pads_with_transparent_pixels() {
        let mut data = empty(2, 2);
        put_pixel(&mut data, 2, 2, 0, 0, pack_rgba(1, 2, 3, 255));
        let resized = resize_buffer(&data, 2, 2, 4, 4).unwrap();
        assert_eq!(resized.len(), 4 * 4 * 4);
        assert_eq!(
            get_pixel(&resized, 4, 4, 0, 0),
            Some(pack_rgba(1, 2, 3, 255))
        );
        assert_eq!(get_pixel(&resized, 4, 4, 3, 3), Some(0)); // new area is transparent
    }

    #[test]
    fn resize_buffer_shrinking_crops_anchored_top_left() {
        let mut data = empty(4, 4);
        put_pixel(&mut data, 4, 4, 0, 0, pack_rgba(1, 2, 3, 255));
        put_pixel(&mut data, 4, 4, 3, 3, pack_rgba(9, 9, 9, 255)); // cropped away
        let resized = resize_buffer(&data, 4, 4, 2, 2).unwrap();
        assert_eq!(resized.len(), 2 * 2 * 4);
        assert_eq!(
            get_pixel(&resized, 2, 2, 0, 0),
            Some(pack_rgba(1, 2, 3, 255))
        );
    }

    #[test]
    fn resize_buffer_rejects_mismatched_source_buffer() {
        let short = vec![0u8; 4];
        assert_eq!(resize_buffer(&short, 4, 4, 2, 2), None);
    }

    #[test]
    fn still_usable_after_a_rejected_call_no_poisoned_state() {
        // Rust has no mutable module-level state here, but this documents the
        // contract explicitly: a rejected call must leave `data` byte-for-byte
        // untouched, so a SUBSEQUENT valid call on the SAME buffer still works.
        let mut data = empty(4, 4);
        assert!(!write_rect(
            &mut data,
            4,
            4,
            u32::MAX,
            0,
            1,
            1,
            &[1, 2, 3, 4]
        ));
        assert!(put_pixel(&mut data, 4, 4, 0, 0, pack_rgba(1, 2, 3, 4)));
        assert_eq!(get_pixel(&data, 4, 4, 0, 0), Some(pack_rgba(1, 2, 3, 4)));
    }
}

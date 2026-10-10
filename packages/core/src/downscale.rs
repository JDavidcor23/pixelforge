//! Pure-Rust port of `apps/editor/src/lib/downscale.ts`'s `downscaleTo`
//! (phase 6, design.md "Lossless Pixel Round-Trip"). Majority-vote downscale:
//! each target cell takes the dominant color among the source pixels it
//! covers, voting only among "solid core" pixels (alpha above a threshold) so
//! an anti-aliased halo around AI-generated pixel art never outvotes the
//! sprite it surrounds. `resizeNearest` (the OTHER function in
//! `downscale.ts`) is deliberately NOT ported here — it is a separate,
//! simpler nearest-neighbor resize with no defringe logic, out of this
//! phase's scope (tasks.md 6.3 only names `downscale(buf, w, h)`; the pixel-
//! core spec's "Downscale preserves canvas content intent" scenario is about
//! THIS majority-vote operation), and `apps/editor` keeps calling its own
//! `resizeNearest` directly (see `sprite-pipeline.ts`).
//!
//! Hexagonal rule (same as every other module in this crate): no
//! `wasm_bindgen` import here — `crate::bindings` is the only FFI adapter.
//!
//! ## The ONE place this port must NOT round a constant to an integer
//!
//! The oracle computes `coreAlpha = hasSolidCore(source) ? CORE_ALPHA_THRESHOLD
//! : ALPHA_OPAQUE / 2`. `ALPHA_OPAQUE / 2` is `255 / 2`, which in JS (and in
//! this port) is the FLOATING-POINT value `127.5`, not the integer `127`.
//! That half-integer matters: the fallback branch's comparison `a < coreAlpha`
//! treats alpha `127` as below-core (excluded) and alpha `128` as core
//! (included) — a plain integer `127` for that constant would flip which side
//! `a == 127` falls on. This port keeps `core_alpha` as `f64` end to end
//! (never rounds/truncates it to an integer type) for exactly this reason —
//! see `downscale`'s call into `dominant_color` below.

use crate::pixels::{self, CHANNELS};
use std::collections::HashMap;

const ALPHA_OPAQUE: u8 = 255;
/// `ALPHA_OPAQUE as f64 / 2.0` — see this module's doc. Used for the
/// transparent-vs-opaque split, which is ALWAYS this exact half-integer
/// regardless of which `core_alpha` branch is active.
const OPAQUE_TRANSPARENT_SPLIT: f64 = 127.5;
const BUCKET_SHIFT: u32 = 3;
const CORE_ALPHA_THRESHOLD: u8 = 200;

struct BucketStats {
    count: u32,
    r: u64,
    g: u64,
    b: u64,
}

/// `true` iff at least one pixel is solid enough (`alpha >= CORE_ALPHA_THRESHOLD`,
/// always the literal integer 200 here, never the fallback half-integer) to
/// trust as sprite core.
fn has_solid_core(data: &[u8]) -> bool {
    let channels = CHANNELS as usize;
    let mut i = 3usize;
    while i < data.len() {
        if data[i] >= CORE_ALPHA_THRESHOLD {
            return true;
        }
        i += channels;
    }
    false
}

fn round_u8(sum: u64, count: u32) -> u8 {
    // Both JS's Math.round and Rust's f64::round agree for non-negative
    // inputs (see quantize.rs's doc for the same reasoning) — sum/count here
    // is always >= 0.0.
    (sum as f64 / count as f64).round() as u8
}

/// Dominant color of the `[x0,x1) x [y0,y1)` cell. Bucket keys quantize each
/// channel to its top 5 bits (`BUCKET_SHIFT`); `order` preserves FIRST-SEEN
/// insertion order (mirrors a JS `Map`'s iteration order), because the
/// oracle's tie-break — "first bucket encountered with the max count wins" —
/// depends on it (a `HashMap` alone has no defined iteration order).
#[allow(clippy::too_many_arguments)]
fn dominant_color(
    data: &[u8],
    src_w: usize,
    x0: usize,
    x1: usize,
    y0: usize,
    y1: usize,
    core_alpha: f64,
) -> (u8, u8, u8, u8) {
    let channels = CHANNELS as usize;
    let mut order: Vec<u32> = Vec::new();
    let mut buckets: HashMap<u32, BucketStats> = HashMap::new();
    let mut opaque: u32 = 0;
    let mut transparent: u32 = 0;
    let mut core: u32 = 0;

    for y in y0..y1 {
        for x in x0..x1 {
            let i = (y * src_w + x) * channels;
            let a = data[i + 3];
            if (a as f64) < OPAQUE_TRANSPARENT_SPLIT {
                transparent += 1;
                continue;
            }
            opaque += 1;
            if (a as f64) < core_alpha {
                continue;
            }
            core += 1;
            let r = data[i] as u32;
            let g = data[i + 1] as u32;
            let b = data[i + 2] as u32;
            let key =
                ((r >> BUCKET_SHIFT) << 10) | ((g >> BUCKET_SHIFT) << 5) | (b >> BUCKET_SHIFT);
            match buckets.get_mut(&key) {
                Some(bucket) => {
                    bucket.count += 1;
                    bucket.r += r as u64;
                    bucket.g += g as u64;
                    bucket.b += b as u64;
                }
                None => {
                    buckets.insert(
                        key,
                        BucketStats {
                            count: 1,
                            r: r as u64,
                            g: g as u64,
                            b: b as u64,
                        },
                    );
                    order.push(key);
                }
            }
        }
    }

    if transparent >= opaque || core == 0 {
        return (0, 0, 0, 0);
    }

    let mut best_key: Option<u32> = None;
    let mut best_count: u32 = 0;
    for key in &order {
        let bucket = &buckets[key];
        if best_key.is_none() || bucket.count > best_count {
            best_count = bucket.count;
            best_key = Some(*key);
        }
    }
    match best_key {
        None => (0, 0, 0, 0),
        Some(key) => {
            let b = &buckets[&key];
            (
                round_u8(b.r, b.count),
                round_u8(b.g, b.count),
                round_u8(b.b, b.count),
                ALPHA_OPAQUE,
            )
        }
    }
}

/// Downscales `data` (a `src_w x src_h` RGBA buffer) to `target_w x target_h`
/// by majority vote. `None` if `data`'s length doesn't match `src_w*src_h*4`,
/// or any of `src_w`/`src_h`/`target_w`/`target_h` is zero — matching the
/// oracle's `EMPTY_BUFFER` early-return shape (the caller already knows it
/// asked for a `target_w x target_h` buffer, so "no valid output" is
/// `None` here rather than a zero-sized buffer).
pub fn downscale(
    data: &[u8],
    src_w: u32,
    src_h: u32,
    target_w: u32,
    target_h: u32,
) -> Option<Vec<u8>> {
    if !pixels::valid_buffer(data, src_w, src_h)
        || src_w == 0
        || src_h == 0
        || target_w == 0
        || target_h == 0
    {
        return None;
    }

    let core_alpha: f64 = if has_solid_core(data) {
        CORE_ALPHA_THRESHOLD as f64
    } else {
        OPAQUE_TRANSPARENT_SPLIT
    };

    let (src_w_u, src_h_u, target_w_u, target_h_u) = (
        src_w as usize,
        src_h as usize,
        target_w as usize,
        target_h as usize,
    );
    let channels = CHANNELS as usize;
    let mut out = vec![0u8; target_w_u * target_h_u * channels];

    for ty in 0..target_h_u {
        let y0 = (ty * src_h_u) / target_h_u;
        let y1_calc = ((ty + 1) * src_h_u) / target_h_u;
        let y1 = (y0 + 1).max(y1_calc);
        for tx in 0..target_w_u {
            let x0 = (tx * src_w_u) / target_w_u;
            let x1_calc = ((tx + 1) * src_w_u) / target_w_u;
            let x1 = (x0 + 1).max(x1_calc);
            let (r, g, b, a) = dominant_color(data, src_w_u, x0, x1, y0, y1, core_alpha);
            let o = (ty * target_w_u + tx) * channels;
            out[o] = r;
            out[o + 1] = g;
            out[o + 2] = b;
            out[o + 3] = a;
        }
    }

    Some(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn build(size: usize, mut fill: impl FnMut(usize, usize) -> [u8; 4]) -> Vec<u8> {
        let mut out = vec![0u8; size * size * 4];
        for y in 0..size {
            for x in 0..size {
                let i = (y * size + x) * 4;
                out[i..i + 4].copy_from_slice(&fill(x, y));
            }
        }
        out
    }

    const RED: [u8; 4] = [200, 10, 10, 255];
    const BLACK: [u8; 4] = [0, 0, 0, 255];
    const CLEAR: [u8; 4] = [0, 0, 0, 0];

    #[test]
    fn picks_the_dominant_color_of_each_cell() {
        let src = build(8, |x, y| if x % 4 == 0 && y % 4 == 0 { BLACK } else { RED });
        let out = downscale(&src, 8, 8, 2, 2).unwrap();
        assert_eq!(out.len(), 2 * 2 * 4);
        for i in (0..out.len()).step_by(4) {
            assert!(out[i] > 150);
            assert!(out[i + 1] < 60);
        }
    }

    #[test]
    fn keeps_a_cell_dominated_by_outline_as_outline() {
        let src = build(8, |x, _| if x < 4 { BLACK } else { RED });
        let out = downscale(&src, 8, 8, 2, 2).unwrap();
        assert!(out[0] < 60); // cell (0,0)
        assert!(out[4] > 150); // cell (1,0)
    }

    #[test]
    fn resolves_alpha_by_majority() {
        let src = build(8, |_, y| if y < 4 { CLEAR } else { RED });
        let out = downscale(&src, 8, 8, 2, 2).unwrap();
        assert_eq!(out[3], 0); // (0,0)
        assert_eq!(out[7], 0); // (1,0)
        let row1 = 2 * 4;
        assert_eq!(out[row1 + 3], 255); // (0,1)
        assert_eq!(out[row1 + 7], 255); // (1,1)
    }

    #[test]
    fn handles_source_sizes_that_do_not_divide_evenly() {
        let src = build(7, |_, _| RED);
        let out = downscale(&src, 7, 7, 2, 2).unwrap();
        assert_eq!(out.len(), 2 * 2 * 4);
        let row1_col1 = (2 + 1) * 4; // (row=1, col=1) in a 2-wide grid
        assert!(out[row1_col1] > 150);
    }

    #[test]
    fn votes_color_only_among_solid_core_pixels() {
        // Muddy edge pixels OUTNUMBER the solid red core (10 vs 6) in a 4x4 -> 1x1 cell.
        const MUDDY: [u8; 4] = [40, 20, 20, 140];
        let mut placed = 0usize;
        let src = build(4, |_, _| {
            placed += 1;
            if placed <= 6 {
                RED
            } else {
                MUDDY
            }
        });
        let out = downscale(&src, 4, 4, 1, 1).unwrap();
        assert!(out[0] > 150);
        assert!(out[1] < 60);
        assert_eq!(out[3], 255);
    }

    #[test]
    fn drops_a_fringe_only_cell_while_keeping_the_core_cell() {
        const MUDDY: [u8; 4] = [40, 20, 20, 140];
        let src = build(8, |x, _| if x < 4 { RED } else { MUDDY });
        let out = downscale(&src, 8, 8, 2, 2).unwrap();
        assert_eq!(out[3], 255); // (0,0) core
        assert!(out[0] > 150);
        assert_eq!(out[7], 0); // (1,0) fringe-only -> keyed out
        let row1_col1 = (2 + 1) * 4; // (row=1, col=1) in a 2-wide grid
        assert_eq!(out[row1_col1 + 3], 0);
    }

    #[test]
    fn does_not_vanish_a_uniformly_semi_transparent_image() {
        const SEMI: [u8; 4] = [200, 10, 10, 150];
        let src = build(8, |_, _| SEMI);
        let out = downscale(&src, 8, 8, 2, 2).unwrap();
        for i in (0..out.len()).step_by(4) {
            assert_eq!(out[i + 3], 255);
            assert!(out[i] > 150);
        }
    }

    #[test]
    fn one_by_one_source_and_target_round_trips_the_single_pixel() {
        let src = RED.to_vec();
        let out = downscale(&src, 1, 1, 1, 1).unwrap();
        assert_eq!(out, RED.to_vec());
    }

    #[test]
    fn rejects_empty_source_or_zero_target_dims() {
        assert_eq!(downscale(&[], 0, 0, 4, 4), None);
        let single = RED.to_vec();
        assert_eq!(downscale(&single, 1, 1, 4, 0), None);
        assert_eq!(downscale(&single, 1, 1, 0, 4), None);
    }

    #[test]
    fn rejects_a_buffer_whose_length_does_not_match_src_w_times_src_h_times_4() {
        let short = vec![0u8; 4]; // declares 4x4 but is only 4 bytes
        assert_eq!(downscale(&short, 4, 4, 2, 2), None);
    }

    #[test]
    fn alpha_127_vs_128_falls_on_opposite_sides_of_the_fallback_core_threshold() {
        // No pixel reaches CORE_ALPHA_THRESHOLD (200), so the fallback
        // branch (127.5) is active. Build a 1x1 target cell where every
        // pixel has alpha 127 (just below 127.5 -> transparent, not core)
        // vs alpha 128 (just above -> opaque AND core).
        let below = [[9u8, 9, 9, 127]; 4].concat();
        let out_below = downscale(&below, 2, 2, 1, 1).unwrap();
        assert_eq!(out_below[3], 0); // majority-transparent -> keyed out

        let above = [[9u8, 9, 9, 128]; 4].concat();
        let out_above = downscale(&above, 2, 2, 1, 1).unwrap();
        assert_eq!(out_above[3], 255);
        assert_eq!(&out_above[0..3], &[9, 9, 9]);
    }
}

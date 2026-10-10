//! Pure-Rust port of `apps/editor/src/lib/quantize.ts`'s `quantizePixels`
//! (phase 6, design.md "Lossless Pixel Round-Trip"). A weighted k-means-style
//! palette reducer: seeds centroids with a weighted furthest-point heuristic
//! (the highest-weight point first, then whichever remaining point is
//! farthest from every existing centroid, weighted by its own saturation
//! weight), then refines with `iterations` rounds of Lloyd's algorithm
//! (assign each point to its nearest centroid, recompute each centroid as the
//! weighted mean of its assigned points).
//!
//! Hexagonal rule (same as every other module in this crate): no
//! `wasm_bindgen` import here — `crate::bindings` is the only FFI adapter.
//!
//! ## Floating-point parity with the JS oracle (design.md "Boundary number
//! validation" + this phase's parity requirement)
//!
//! The oracle (`apps/editor/src/lib/quantize.ts`) does every distance/weight/
//! average computation in JS's `number` type, which is an IEEE 754 double —
//! identical in bit layout and arithmetic rules to Rust's `f64`. This port
//! therefore does ALL of this module's math in `f64`, in the SAME order the
//! oracle does it, so the two implementations compute bit-identical
//! intermediate values, not just "close enough" ones:
//! - `saturation`: `(max-min)/max` on the three channel values, cast to
//!   `f64` first (never `f32` — `f32` would round differently than a JS
//!   double at the very first operation).
//! - `dist2`: a sum of three squared differences — `dr*dr` instead of a
//!   `powi(2)`/`powf(2.0)` call, mirroring the oracle's `(a.r-b.r)**2`,
//!   which V8 (like every mainstream engine) computes as a plain square —
//!   both are exact for the integer-valued inputs this module ever squares,
//!   so this is a belt-and-braces match rather than a load-bearing one.
//! - `Math.round` vs `f64::round`: these differ for NEGATIVE half values
//!   (JS rounds toward +Infinity, Rust rounds away from zero) — but every
//!   value `.round()` is called on here is a weighted mean of 0-255 channel
//!   bytes, i.e. always `>= 0.0`, where both rounding rules agree. See
//!   `build_palette`'s loop at the bottom of this file.
//!
//! ## Self-contained, not a dependency on `apps/editor`
//! `SATURATION_WEIGHT` mirrors `apps/editor/src/constants/index.ts`'s
//! `QUANTIZE_DEFAULTS.SATURATION_WEIGHT` (value `6`) — `packages/core` never
//! depends on `apps/editor` (dependency direction: apps depend on packages,
//! never the reverse, same rule `src-ts/ts-core.ts`'s module doc states for
//! its own TS mirror of this same oracle), so the constant is duplicated
//! here on purpose, kept numerically identical.
//!
//! ## Why `nearest` can never actually hit an empty palette
//! `quantize` filters pixels below `alpha_threshold` identically in BOTH the
//! point-collection pass and the recolor pass (same buffer, same threshold,
//! alpha is never written) — so by construction, every pixel the recolor
//! pass calls `nearest` for was also counted in the point-collection pass,
//! which means the palette can never be empty when `nearest` needs it. The
//! `None` branch in `nearest` is defensive dead code for exactly that reason
//! (never panics even if this invariant were ever violated by a future
//! change) rather than a path this module's own tests can reach.

use crate::pixels::CHANNELS;

const SATURATION_WEIGHT: f64 = 6.0;

/// Fix-agent 6f.4 (phase 6 review finding, bundled with W-A's
/// `downscale` target-dimension bound): `colors` has no upper bound today,
/// so a technically-valid-but-absurd value (e.g. `colors = 4_000_000_000`)
/// would run `build_palette`'s `O(points * centroids)` seeding/refinement
/// loops against a palette size with no realistic ceiling — a hang, not a
/// correctness bug, but the same class of "individually valid `u32`, globally
/// absurd" input `MAX_DOWNSCALE_TARGET_DIMENSION` closes for `downscale`.
/// Mirrors `src-ts/ts-core.ts`'s `MAX_QUANTIZE_COLORS` exactly (kept as a
/// separate Rust constant — `packages/core` never depends on `apps/editor`/
/// `src-ts` — but MUST stay numerically identical so both implementations
/// reject exactly the same inputs). Chosen far above the app's real usage
/// (`SPRITE_EDITOR_PALETTE.MAX_COLORS` is 32).
pub const MAX_QUANTIZE_COLORS: u32 = 4096;

#[derive(Clone, Copy)]
struct Point {
    r: f64,
    g: f64,
    b: f64,
    w: f64,
}

#[derive(Clone, Copy)]
struct Centroid {
    r: f64,
    g: f64,
    b: f64,
}

fn saturation(r: u8, g: u8, b: u8) -> f64 {
    let (r, g, b) = (r as f64, g as f64, b as f64);
    let mx = r.max(g).max(b);
    let mn = r.min(g).min(b);
    if mx == 0.0 {
        0.0
    } else {
        (mx - mn) / mx
    }
}

fn dist2(a: (f64, f64, f64), b: (f64, f64, f64)) -> f64 {
    let dr = a.0 - b.0;
    let dg = a.1 - b.1;
    let db = a.2 - b.2;
    dr * dr + dg * dg + db * db
}

/// Nearest centroid to `(r, g, b)` by squared Euclidean distance — ties go to
/// the FIRST centroid found (strict `<` comparison, mirrors the oracle's
/// `nearest`). `None` only if `palette` is empty (see this module's doc for
/// why the real caller never hits that case).
fn nearest(palette: &[Centroid], r: f64, g: f64, b: f64) -> Option<(f64, f64, f64)> {
    let mut iter = palette.iter();
    let mut best = iter.next()?;
    let mut best_d = f64::INFINITY;
    for c in std::iter::once(best).chain(iter) {
        let d = dist2((c.r, c.g, c.b), (r, g, b));
        if d < best_d {
            best_d = d;
            best = c;
        }
    }
    Some((best.r, best.g, best.b))
}

/// Builds a palette of at most `k` centroids from `points` (weighted
/// furthest-point seeding + `iterations` rounds of weighted Lloyd's
/// algorithm). Mirrors `quantize.ts`'s `buildPalette` exactly, including its
/// quirks: `k == 0` still yields ONE centroid (the initial highest-weight
/// seed is pushed unconditionally, before the `while centroids.len() < k`
/// check ever runs), and a `k` larger than the number of distinct colors may
/// push duplicate centroids (the seeding loop never deduplicates — it keeps
/// picking A point every round as long as any point remains, even one
/// identical to an existing centroid).
fn build_palette(points: &[Point], k: u32, iterations: u32) -> Vec<Centroid> {
    if points.is_empty() {
        return Vec::new();
    }

    let mut centroids: Vec<Centroid> = Vec::new();
    let mut first = &points[0];
    for p in points {
        if p.w > first.w {
            first = p;
        }
    }
    centroids.push(Centroid {
        r: first.r,
        g: first.g,
        b: first.b,
    });

    while (centroids.len() as u64) < (k as u64) {
        let mut best_idx: Option<usize> = None;
        let mut best_score = -1.0f64;
        for (pi, p) in points.iter().enumerate() {
            let mut dmin = f64::INFINITY;
            for c in &centroids {
                let d = dist2((c.r, c.g, c.b), (p.r, p.g, p.b));
                if d < dmin {
                    dmin = d;
                }
            }
            let score = dmin * p.w;
            if score > best_score {
                best_score = score;
                best_idx = Some(pi);
            }
        }
        match best_idx {
            Some(pi) => {
                let p = points[pi];
                centroids.push(Centroid {
                    r: p.r,
                    g: p.g,
                    b: p.b,
                });
            }
            None => break,
        }
    }

    for _ in 0..iterations {
        let mut sums: Vec<(f64, f64, f64, f64)> = vec![(0.0, 0.0, 0.0, 0.0); centroids.len()];
        for p in points {
            let mut bi = 0usize;
            let mut bd = f64::INFINITY;
            for (ci, c) in centroids.iter().enumerate() {
                let d = dist2((c.r, c.g, c.b), (p.r, p.g, p.b));
                if d < bd {
                    bd = d;
                    bi = ci;
                }
            }
            let s = &mut sums[bi];
            s.0 += p.r * p.w;
            s.1 += p.g * p.w;
            s.2 += p.b * p.w;
            s.3 += p.w;
        }
        for (i, c) in centroids.iter_mut().enumerate() {
            let (sr, sg, sb, sw) = sums[i];
            if sw > 0.0 {
                // Both JS's Math.round and Rust's f64::round agree here —
                // sr/sg/sb/sw are all weighted sums of non-negative channel
                // bytes and positive weights, so the quotient is always
                // `>= 0.0` (see this module's doc on rounding parity).
                c.r = (sr / sw).round();
                c.g = (sg / sw).round();
                c.b = (sb / sw).round();
            }
        }
    }

    centroids
}

/// Reduces `data`'s RGB palette to at most `colors` colors, leaving alpha
/// untouched. `None` if `data`'s length isn't a whole number of RGBA pixels
/// (`data.len() % 4 != 0`) — the one shape check this op can make without a
/// declared `w`/`h` (quantize is spatially agnostic, see this module's doc).
/// Pixels with `alpha < alpha_threshold` are excluded from both the palette
/// vote AND the recolor pass (left byte-for-byte unchanged, matching the
/// oracle's `if (a < alphaThreshold) continue`).
pub fn quantize(
    data: &[u8],
    colors: u32,
    weight_by_saturation: bool,
    iterations: u32,
    alpha_threshold: u32,
) -> Option<Vec<u8>> {
    let channels = CHANNELS as usize;
    if !data.len().is_multiple_of(channels) || colors > MAX_QUANTIZE_COLORS {
        return None;
    }

    // `data.len() / channels` is the exact UPPER bound on how many points can
    // ever be pushed below (one per pixel, fewer if some are below
    // `alpha_threshold`) — pre-reserving it avoids the Vec reallocating/
    // copying itself as it grows, the same optimization `flood_fill.rs`'s
    // `pending` stack uses (`LEARNING.md` §7).
    let mut points: Vec<Point> = Vec::with_capacity(data.len() / channels);
    let mut i = 0usize;
    while i + 3 < data.len() {
        let a = data[i + 3] as u32;
        if a >= alpha_threshold {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];
            let w = if weight_by_saturation {
                1.0 + SATURATION_WEIGHT * saturation(r, g, b)
            } else {
                1.0
            };
            points.push(Point {
                r: r as f64,
                g: g as f64,
                b: b as f64,
                w,
            });
        }
        i += channels;
    }

    let palette = build_palette(&points, colors, iterations);

    let mut out = data.to_vec();
    let mut i = 0usize;
    while i + 3 < out.len() {
        let a = out[i + 3] as u32;
        if a >= alpha_threshold {
            if let Some((r, g, b)) = nearest(
                &palette,
                out[i] as f64,
                out[i + 1] as f64,
                out[i + 2] as f64,
            ) {
                out[i] = r as u8;
                out[i + 1] = g as u8;
                out[i + 2] = b as u8;
            }
        }
        i += channels;
    }

    Some(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn px(r: u8, g: u8, b: u8, a: u8) -> [u8; 4] {
        [r, g, b, a]
    }

    fn build(rows: &[&[[u8; 4]]]) -> Vec<u8> {
        let mut out = Vec::new();
        for row in rows {
            for p in *row {
                out.extend_from_slice(p);
            }
        }
        out
    }

    #[test]
    fn reduces_the_palette_to_at_most_colors_opaque_colors() {
        let data = build(&[
            &[
                px(200, 10, 10, 255),
                px(198, 12, 9, 255),
                px(12, 200, 14, 255),
                px(10, 198, 16, 255),
            ],
            &[
                px(15, 12, 205, 255),
                px(13, 14, 200, 255),
                px(0, 0, 0, 0),
                px(250, 250, 250, 255),
            ],
        ]);
        let out = quantize(&data, 4, true, 12, 128).expect("multiple of 4");
        let mut palette: Vec<(u8, u8, u8)> = Vec::new();
        for i in (0..out.len()).step_by(4) {
            if out[i + 3] > 0 {
                let c = (out[i], out[i + 1], out[i + 2]);
                if !palette.contains(&c) {
                    palette.push(c);
                }
            }
        }
        assert!(palette.len() <= 4);
    }

    #[test]
    fn keeps_fully_transparent_pixels_transparent() {
        let data = build(&[&[px(0, 0, 0, 0), px(200, 10, 10, 255)]]);
        let out = quantize(&data, 2, true, 6, 128).unwrap();
        assert_eq!(out[3], 0);
    }

    #[test]
    fn preserves_a_saturated_color_over_the_dominant_near_white() {
        let data = build(&[
            &[
                px(245, 245, 245, 255),
                px(246, 244, 245, 255),
                px(244, 245, 246, 255),
                px(245, 246, 244, 255),
            ],
            &[
                px(243, 245, 245, 255),
                px(245, 245, 243, 255),
                px(210, 20, 20, 255),
                px(205, 18, 22, 255),
            ],
        ]);
        let out = quantize(&data, 2, true, 12, 128).unwrap();
        let mut has_red = false;
        for i in (0..out.len()).step_by(4) {
            let (r, g, b) = (out[i] as f64, out[i + 1] as f64, out[i + 2] as f64);
            if r > 120.0 && r > g * 1.6 && r > b * 1.6 {
                has_red = true;
            }
        }
        assert!(has_red);
    }

    #[test]
    fn colors_zero_still_yields_one_centroid_not_zero() {
        let data = build(&[&[px(10, 20, 30, 255), px(200, 100, 50, 255)]]);
        let out = quantize(&data, 0, true, 4, 0).unwrap();
        let c0 = (out[0], out[1], out[2]);
        let c1 = (out[4], out[5], out[6]);
        assert_eq!(c0, c1); // one centroid for everyone — mirrors the oracle's "push before checking k" quirk
    }

    #[test]
    fn rejects_a_buffer_whose_length_is_not_a_multiple_of_four() {
        assert_eq!(quantize(&[0u8; 3], 2, true, 1, 0), None);
    }

    #[test]
    fn rejects_colors_above_the_max_bound_but_accepts_the_bound_itself() {
        let data = build(&[&[px(200, 10, 10, 255), px(12, 200, 14, 255)]]);
        assert_eq!(quantize(&data, MAX_QUANTIZE_COLORS + 1, true, 1, 0), None);
        assert!(quantize(&data, MAX_QUANTIZE_COLORS, true, 0, 0).is_some());
    }

    #[test]
    fn empty_buffer_is_a_safe_no_op() {
        assert_eq!(quantize(&[], 4, true, 4, 0), Some(Vec::new()));
    }

    #[test]
    fn single_pixel_buffer_round_trips_its_own_color() {
        let data = build(&[&[px(12, 34, 56, 255)]]);
        let out = quantize(&data, 1, false, 1, 0).unwrap();
        assert_eq!(&out[..], &data[..]);
    }

    #[test]
    fn alpha_threshold_boundary_is_inclusive_on_the_high_side() {
        // a == alpha_threshold must COUNT (oracle: `if (a < alphaThreshold) continue`, so `a == threshold` is kept).
        let data = build(&[&[px(200, 10, 10, 128), px(10, 200, 10, 10)]]);
        let out = quantize(&data, 2, true, 4, 128).unwrap();
        // the a=128 pixel participated in the vote and was recolored to some centroid (still opaque-ish alpha preserved)
        assert_eq!(out[3], 128);
        // the a=10 pixel (< 128) is excluded — left byte for byte untouched
        assert_eq!(&out[4..8], &[10, 200, 10, 10]);
    }

    #[test]
    fn weight_by_saturation_false_uses_uniform_weight_one() {
        // With weighting off, a saturated minority color has no advantage over a desaturated majority — this just
        // asserts the call doesn't panic and produces a valid, in-range palette.
        let data = build(&[&[
            px(250, 250, 250, 255),
            px(248, 249, 250, 255),
            px(210, 20, 20, 255),
        ]]);
        let out = quantize(&data, 2, false, 8, 0).unwrap();
        assert_eq!(out.len(), data.len()); // sanity: a valid same-shape palette came back, no panic
    }
}

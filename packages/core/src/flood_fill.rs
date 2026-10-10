//! Rust port of the flood-fill kernel (design.md phase 5). 4-connected,
//! SCANLINE SPAN fill (phase 5f.3 rewrite — see "Why scanline, not
//! stack-per-pixel" below), no recursion, reusing `crate::pixels`'
//! validated-buffer primitives rather than duplicating bounds logic. Kept
//! byte-for-byte identical in behavior (same dirty rect, same filled pixels)
//! to the ORIGINAL stack-per-pixel algorithm this replaces, and to
//! `apps/editor/src/lib/flood-fill.ts` (the long-standing oracle — never
//! touched by this phase, see `flood-fill.oracle-parity.test.ts`) and
//! `packages/core/src-ts/ts-core.ts`'s `tsKernels.floodFill` (rewritten to
//! the SAME scanline algorithm alongside this file, see that file's doc).
//!
//! ## Why scanline, not stack-per-pixel (phase 5f.3 — `LEARNING.md` §13)
//!
//! Phase 5's original implementation pushed one stack entry PER PIXEL and
//! did one 4-byte color read/write PER PIXEL PER VISIT (including duplicate,
//! rejected pops — up to 4 duplicate pops per pixel for a 4-connected fill).
//! Benched at only ~2.3x-2.6x faster than TS (below the 3x target) even
//! after Wasm's FFI/call overhead — measured, not assumed, to be ~1.6% of
//! total time (see `baseline-bench.md`'s "Phase 5f" section) — the real
//! bottleneck was the SHEER NUMBER of per-pixel operations, not the FFI
//! boundary. A scanline span fill processes one CONTIGUOUS RUN of same-row
//! pixels per stack entry instead of one pixel per entry: `fill_span_row`
//! below fills an entire horizontal run with one tight loop (no per-pixel
//! branch to decide "is this still unvisited?" — a filled pixel can never
//! match `target` again, which is also what makes a separate `visited`
//! array unnecessary here, unlike the per-pixel version where dropping
//! `visited` was tried and reverted, see `LEARNING.md` §12), and queues AT
//! MOST ONE seed point per contiguous run found in each neighboring row,
//! not one per pixel. For a large open fill this cuts the number of
//! stack push/pop operations from `O(w*h)` to `O(h)` (one span per row),
//! and the inner fill loop is a straight-line byte write with no stack
//! traffic at all.
//!
//! ## Still no recursion, still bounded memory
//!
//! `pending` is a `Vec<(usize, usize)>` of SEED POINTS (one row/column pair
//! per unexplored span), not one entry per pixel — strictly smaller than the
//! old per-pixel stack's worst case. Still entirely heap-allocated (never
//! Rust's call stack, see `LEARNING.md` §9's stack-overflow-vs-panic
//! reasoning, unchanged by this rewrite) and still bounded: at most one
//! pending seed per row per span-discovery pass, so `O(h)` entries
//! outstanding at any time, never proportional to how long the fill runs.
//!
//! ## One per-pixel optimization attempt, reverted (phase 5, kept for the record)
//!
//! Phase 5's ORIGINAL per-pixel stack version tried dropping its `visited`
//! array (relying only on the color check) and measured it as a NET
//! REGRESSION — see `LEARNING.md` §12 for the full numbers. That specific
//! finding is about the per-pixel algorithm this file no longer uses, but is
//! kept here as a historical note: the scanline rewrite sidesteps the
//! question entirely (no `visited` array ever existed in this version to
//! begin with — see the paragraph above for why none is needed).

use crate::pixels::{self, CHANNELS};

/// Whether pixel `p` (a flat `width`-relative index, NOT yet multiplied by
/// `CHANNELS`) still holds `target`. Internal to {@link flood_fill} — reused
/// by both the horizontal span expansion and the neighboring-row run scan.
#[inline]
fn pixel_matches(data: &[u8], p: usize, target: [u8; 4]) -> bool {
    let i = p * (CHANNELS as usize);
    data[i] == target[0]
        && data[i + 1] == target[1]
        && data[i + 2] == target[2]
        && data[i + 3] == target[3]
}

/// Fills the contiguous run of `target`-colored pixels on row `row_start`
/// (a flat index, `row * width`) that CONTAINS column `sx`, with `fill`.
/// Returns the run's inclusive `(left, right)` column bounds. Caller
/// guarantees `pixel_matches(data, row_start + sx, target)` is already true.
#[inline]
fn fill_span_row(
    data: &mut [u8],
    row_start: usize,
    sx: usize,
    width: usize,
    target: [u8; 4],
    fill: [u8; 4],
) -> (usize, usize) {
    let mut lx = sx;
    while lx > 0 && pixel_matches(data, row_start + lx - 1, target) {
        lx -= 1;
    }
    let mut rx = sx;
    while rx + 1 < width && pixel_matches(data, row_start + rx + 1, target) {
        rx += 1;
    }
    let channels = CHANNELS as usize;
    for p in lx..=rx {
        let i = (row_start + p) * channels;
        data[i] = fill[0];
        data[i + 1] = fill[1];
        data[i + 2] = fill[2];
        data[i + 3] = fill[3];
    }
    (lx, rx)
}

/// 4-connected flood fill, in place. Returns the dirty rect `(x, y, w, h)`
/// touched by the fill, or `None` if nothing changed: an invalid buffer
/// shape (`data.len() != w*h*4`), an out-of-bounds seed, or a seed pixel
/// that already matches `rgba` (a true no-op, mirroring
/// `lib/flood-fill.ts`'s `colorsEqual` short-circuit). Never panics on any
/// input — buffer shape and the seed coordinate are validated FIRST, exactly
/// like every other function in `crate::pixels`.
pub fn flood_fill(
    data: &mut [u8],
    w: u32,
    h: u32,
    x: u32,
    y: u32,
    rgba: u32,
) -> Option<(u32, u32, u32, u32)> {
    if !pixels::valid_buffer(data, w, h) || !pixels::in_bounds(w, h, x, y) {
        return None;
    }

    let channels = CHANNELS as usize;
    let width = w as usize;
    let height = h as usize;

    let seed = (y as usize) * width + (x as usize); // safe: already bounds-checked above, w*h*4 already fits (valid_buffer)
    let seed_i = seed * channels;
    let target = [
        data[seed_i],
        data[seed_i + 1],
        data[seed_i + 2],
        data[seed_i + 3],
    ];
    let (fr, fg, fb, fa) = pixels::unpack_rgba(rgba);
    let fill = [fr, fg, fb, fa];
    if target == fill {
        return None; // seed is already the fill color
    }

    let mut min_x = x as usize;
    let mut min_y = y as usize;
    let mut max_x = x as usize;
    let mut max_y = y as usize;

    // Seed points for unexplored spans — NOT one entry per pixel (see module
    // doc). A seed popped here may already have been filled by an earlier
    // span that covered the same run from a different neighboring row —
    // `fill_span_row`'s caller (below) re-checks `pixel_matches` first and
    // skips a stale/duplicate seed with one cheap read, exactly like the
    // old per-pixel version's `visited` check did for a duplicate pop.
    let mut pending: Vec<(usize, usize)> = Vec::with_capacity(height.max(1));
    pending.push((x as usize, y as usize));

    while let Some((sx, sy)) = pending.pop() {
        let row_start = sy * width;
        if !pixel_matches(data, row_start + sx, target) {
            continue; // already filled by a previously-processed overlapping span
        }

        let (lx, rx) = fill_span_row(data, row_start, sx, width, target, fill);

        if lx < min_x {
            min_x = lx;
        }
        if rx > max_x {
            max_x = rx;
        }
        if sy < min_y {
            min_y = sy;
        }
        if sy > max_y {
            max_y = sy;
        }

        // Queue AT MOST ONE seed per contiguous target-colored run found in
        // each neighboring row, restricted to this span's [lx, rx] columns —
        // the standard scanline-fill invariant: any target pixel in a
        // neighboring row OUTSIDE [lx, rx] is reached later via its OWN
        // row's horizontal expansion once some other span queues it, never
        // missed, since every row this fill ever touches gets its full
        // horizontal run expanded before moving on.
        for ny in [sy.checked_sub(1), sy.checked_add(1).filter(|&v| v < height)]
            .into_iter()
            .flatten()
        {
            let nrow_start = ny * width;
            let mut nx = lx;
            while nx <= rx {
                if pixel_matches(data, nrow_start + nx, target) {
                    pending.push((nx, ny));
                    // Skip to the end of this run — one seed is enough; the
                    // run's own horizontal expansion (when this seed is
                    // popped) will re-discover its full extent, which may
                    // reach beyond [lx, rx] in either direction.
                    while nx <= rx && pixel_matches(data, nrow_start + nx, target) {
                        nx += 1;
                    }
                } else {
                    nx += 1;
                }
            }
        }
    }

    Some((
        min_x as u32,
        min_y as u32,
        (max_x - min_x + 1) as u32,
        (max_y - min_y + 1) as u32,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::pixels::pack_rgba;

    fn empty(w: u32, h: u32) -> Vec<u8> {
        vec![0u8; (w * h * CHANNELS) as usize]
    }

    fn get(data: &[u8], w: u32, x: u32, y: u32) -> (u8, u8, u8, u8) {
        let i = ((y * w + x) * CHANNELS) as usize;
        (data[i], data[i + 1], data[i + 2], data[i + 3])
    }

    #[test]
    fn fills_the_whole_canvas_from_any_seed() {
        let (w, h) = (8, 8);
        let mut data = empty(w, h);
        let red = pack_rgba(255, 0, 0, 255);
        let rect = flood_fill(&mut data, w, h, 3, 4, red).expect("should fill");
        assert_eq!(rect, (0, 0, w, h));
        for y in 0..h {
            for x in 0..w {
                assert_eq!(get(&data, w, x, y), (255, 0, 0, 255));
            }
        }
    }

    #[test]
    fn stops_at_a_different_colored_hole_four_connectivity() {
        // A 1-pixel-wide vertical wall of a different color at x=2 splits the
        // canvas into a left region (x<2) and a right region (x>2) — a
        // 4-connected fill from the left must NEVER leak past the wall.
        let (w, h) = (5, 5);
        let mut data = empty(w, h);
        let wall = pack_rgba(1, 2, 3, 255);
        for y in 0..h {
            let i = ((y * w + 2) * CHANNELS) as usize;
            let (r, g, b, a) = pixels::unpack_rgba(wall);
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
            data[i + 3] = a;
        }
        let red = pack_rgba(255, 0, 0, 255);
        let rect = flood_fill(&mut data, w, h, 0, 0, red).expect("should fill the left region");
        assert_eq!(rect, (0, 0, 2, h)); // only x=0,1 filled — the wall column is untouched
        for y in 0..h {
            assert_eq!(get(&data, w, 0, y), (255, 0, 0, 255));
            assert_eq!(get(&data, w, 1, y), (255, 0, 0, 255));
            assert_eq!(get(&data, w, 2, y), (1, 2, 3, 255)); // wall untouched
            assert_eq!(get(&data, w, 3, y), (0, 0, 0, 0)); // right region untouched
        }
    }

    #[test]
    fn does_not_leak_diagonally_four_connectivity_only() {
        // A checkerboard of the target color at every (x+y) even cell and a
        // different color at every odd cell: a 4-connected fill from (0,0)
        // must fill ONLY the single seed pixel (every neighbor is the "odd"
        // color), even though a diagonal neighbor shares the seed's color.
        let (w, h) = (3, 3);
        let mut data = empty(w, h);
        let other = pack_rgba(9, 9, 9, 255);
        for y in 0..h {
            for x in 0..w {
                if (x + y) % 2 == 1 {
                    let i = ((y * w + x) * CHANNELS) as usize;
                    let (r, g, b, a) = pixels::unpack_rgba(other);
                    data[i] = r;
                    data[i + 1] = g;
                    data[i + 2] = b;
                    data[i + 3] = a;
                }
            }
        }
        let red = pack_rgba(255, 0, 0, 255);
        let rect = flood_fill(&mut data, w, h, 0, 0, red).expect("should fill only the seed");
        assert_eq!(rect, (0, 0, 1, 1));
        assert_eq!(get(&data, w, 0, 0), (255, 0, 0, 255));
        assert_eq!(get(&data, w, 1, 1), (0, 0, 0, 0)); // diagonal neighbor (same original color) untouched
    }

    #[test]
    fn seed_out_of_bounds_is_a_safe_no_op() {
        let (w, h) = (4, 4);
        let mut data = empty(w, h);
        assert_eq!(
            flood_fill(&mut data, w, h, 4, 0, pack_rgba(1, 2, 3, 255)),
            None
        );
        assert_eq!(
            flood_fill(&mut data, w, h, 0, 4, pack_rgba(1, 2, 3, 255)),
            None
        );
        assert_eq!(data, empty(w, h)); // never wrote anywhere
    }

    #[test]
    fn same_color_seed_is_a_no_op() {
        let (w, h) = (4, 4);
        let mut data = empty(w, h); // every pixel starts fully transparent black (0,0,0,0)
        assert_eq!(
            flood_fill(&mut data, w, h, 1, 1, pack_rgba(0, 0, 0, 0)),
            None
        );
        assert_eq!(data, empty(w, h));
    }

    #[test]
    fn transparent_vs_opaque_are_different_colors() {
        // Same RGB, different alpha — must be treated as a different color,
        // not merged just because the visible RGB channels match.
        let (w, h) = (3, 1);
        let mut data = empty(w, h);
        let opaque_red = pack_rgba(255, 0, 0, 255);
        let (r, g, b, a) = pixels::unpack_rgba(opaque_red);
        data[0] = r;
        data[1] = g;
        data[2] = b;
        data[3] = a; // pixel (0,0) opaque red; (1,0)/(2,0) stay transparent
        let transparent_red = pack_rgba(255, 0, 0, 0);
        let rect = flood_fill(&mut data, w, h, 1, 0, transparent_red)
            .expect("should fill the transparent region");
        assert_eq!(rect, (1, 0, 2, 1)); // only the transparent pixels, not the opaque one
        assert_eq!(get(&data, w, 0, 0), (255, 0, 0, 255)); // untouched
    }

    #[test]
    fn rejects_a_buffer_whose_length_does_not_match_w_times_h_times_4() {
        let mut short = vec![0u8; 4]; // declares 4x4 but only 4 bytes
        assert_eq!(flood_fill(&mut short, 4, 4, 0, 0, 0xffffffff), None);
    }

    #[test]
    fn rejects_a_zero_sized_canvas_without_panicking() {
        let mut empty_buf: Vec<u8> = vec![];
        assert_eq!(flood_fill(&mut empty_buf, 0, 0, 0, 0, 0xffffffff), None);
    }

    #[test]
    fn holes_are_preserved_maze_shape() {
        // A 5x5 ring: the border is the "wall" color, the interior (3x3) is
        // the target color. Filling from the center must touch only the
        // interior 3x3, never the border.
        let (w, h) = (5, 5);
        let mut data = empty(w, h);
        let wall = pack_rgba(5, 5, 5, 255);
        for y in 0..h {
            for x in 0..w {
                let on_border = x == 0 || y == 0 || x == w - 1 || y == h - 1;
                if on_border {
                    let i = ((y * w + x) * CHANNELS) as usize;
                    let (r, g, b, a) = pixels::unpack_rgba(wall);
                    data[i] = r;
                    data[i + 1] = g;
                    data[i + 2] = b;
                    data[i + 3] = a;
                }
            }
        }
        let blue = pack_rgba(0, 0, 255, 255);
        let rect = flood_fill(&mut data, w, h, 2, 2, blue).expect("should fill the interior");
        assert_eq!(rect, (1, 1, 3, 3));
        for y in 0..h {
            for x in 0..w {
                let on_border = x == 0 || y == 0 || x == w - 1 || y == h - 1;
                if on_border {
                    assert_eq!(get(&data, w, x, y), (5, 5, 5, 255));
                } else {
                    assert_eq!(get(&data, w, x, y), (0, 0, 255, 255));
                }
            }
        }
    }

    #[test]
    fn bounded_stack_handles_a_large_fully_connected_canvas_without_overflow() {
        // The "no recursion" guarantee's whole point: a naive recursive
        // implementation would blow the call stack well before 256x256
        // (65,536 cells). This must simply finish.
        let (w, h) = (256, 256);
        let mut data = empty(w, h);
        let rect =
            flood_fill(&mut data, w, h, 128, 128, pack_rgba(1, 2, 3, 255)).expect("should fill");
        assert_eq!(rect, (0, 0, w, h));
    }
}

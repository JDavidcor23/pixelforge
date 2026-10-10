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
/// pixels, or `colors` exceeds `crate::quantize::MAX_QUANTIZE_COLORS` (phase
/// 6f boundary hardening — same convention `downscale` below documents). See
/// `crate::quantize` for the algorithm.
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
/// if `data`'s length doesn't match `src_w*src_h*4`, any dimension is zero,
/// or `target_w`/`target_h` exceeds `crate::downscale::
/// MAX_DOWNSCALE_TARGET_DIMENSION` (phase 6f boundary hardening — closes an
/// allocation-size overflow that used to trap the Wasm instance for an
/// individually-"valid" `u32` target, verify-report-phase-6.md W-A). See
/// `crate::downscale` for the algorithm.
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

// ─────────────────────────────────────────────────────────────────────────
// Phase 7: `WasmDocument` — the stateful `PixelCore` seam (design.md D5:
// "PixelKernels (stateless) under PixelCore (stateful document)"). Every
// method below is a thin pass-through to `crate::document::Document`, never
// business logic of its own (same hexagonal rule as every kernel above).
//
// ## Wire format (D6: "no serde" — flat numeric arrays + one length-prefixed
// byte blob for names, never a serialized object graph)
//
// Every mutating method below returns a `Vec<u32>` — the flat encoding of a
// `crate::document::DispatchResult` (mirrors `commands.ts`'s
// `DispatchResult`):
// ```text
// [0] changed (0/1)            [1] contentChanged (0/1)
// [2] structureChanged (0/1)   [3] historyChanged (0/1)
// [4] canUndo (0/1)            [5] canRedo (0/1)
// [6] strokeOpen (0/1)
// [7] revision (truncated to u32 — see note below)
// [8] contentRevision (truncated to u32)
// [9] dirtyCount (D)           [10] evictedCount (E)
// [11] layerRevisionsCount (L)
// next D*6:  [frameId, layerId, x, y, w, h] per dirty rect
// next E*2:  [frameId, layerId] per evicted ref
// next L*2:  [layerId, revision] per layer-revisions entry
// ```
//
// `structureChanged` (fix-agent 7g, store-loop performance): `false` for
// every pixel-only command (stroke/fill/region.clear/selection.commit) —
// lets `wasm-document-core.ts`'s `WasmPixelCore` caller (`core.slice.ts`)
// skip calling `meta_doc`/`meta_layer_opacity`/`meta_layer_names` entirely on
// the hot path (a drawing gesture fires many `stroke_points` calls), since
// none of those three can possibly have changed.
// `revision`/`contentRevision` are `u64` in `crate::document` but truncated
// to `u32` here — a session would need four billion dispatches to overflow
// this, far beyond this editor's realistic lifetime; truncating avoids a
// second, BigInt-flavored wire format for two render-purpose counters whose
// only real use is "did this change" (a client compares successive values,
// never prints them).
//
// `WasmDocument::from_payload`/`doc_replace`/`frame_paste` decode/encode a
// full document the same flat-array way — see `Document::from_payload`'s doc
// for the exact `doc_meta` layout, and `meta_doc` below for the
// metadata-export mirror of it. Layer/frame NAMES are the one piece of
// genuinely free-form text in this boundary. Fix-agent 7g (item 2, WARNING
// #3): names used to cross as a single NUL-joined `String`
// (`\u0000`-separated) — which silently corrupted every name reported AFTER
// one containing a literal NUL character, since `"x\u{0}y".split('\u{0}')`
// desyncs the whole array (confirmed via judgment-day's `nul.jb.test.ts`
// repro). Fixed with a length-prefixed encoding instead: a `u32` byte-length
// per name (`meta_layer_name_lens`/`layer_name_lens`/`name_lens` depending on
// the method) paired with the concatenated UTF-8 bytes of every name, NO
// separator at all (`meta_layer_names_bytes`/`layer_names_bytes`/
// `names_bytes`) — see `Document::decode_names`'s doc. A JSON array (the
// originally-suggested fix) was deliberately NOT used: this crate has zero
// `serde`/`serde_json` dependency by design (D6, this module's own doc,
// `Cargo.toml`'s comment) and adding one just for this one field would both
// violate that established boundary-shape convention and grow the `.wasm`
// binary for a parser this flat length-prefixed scheme makes unnecessary —
// same "flat numeric array + byte buffer" shape every other free-form-size
// payload in this crate (pixel buffers) already uses.

use crate::document::{DispatchResult, Document};

fn encode_dispatch_result(r: &DispatchResult) -> Vec<u32> {
    let mut out = vec![
        r.changed as u32,
        r.content_changed as u32,
        r.structure_changed as u32,
        r.history_changed as u32,
        r.can_undo as u32,
        r.can_redo as u32,
        r.stroke_open as u32,
        r.revision as u32,
        r.content_revision as u32,
        r.dirty.len() as u32,
        r.evicted.len() as u32,
        r.layer_revisions.len() as u32,
    ];
    for d in &r.dirty {
        out.extend([
            d.frame_id, d.layer_id, d.rect.x, d.rect.y, d.rect.w, d.rect.h,
        ]);
    }
    for e in &r.evicted {
        out.extend([e.frame_id, e.layer_id]);
    }
    for (layer_id, rev) in &r.layer_revisions {
        out.extend([*layer_id, *rev as u32]);
    }
    out
}

/// The Wasm-exposed `Document` handle. Holds the ENTIRE document (frames,
/// layers, pixel buffers) in Wasm linear memory — `readLayer`/`exportPixels`
/// are the only ways pixel bytes ever leave it, and both always COPY (D7: a
/// view into Wasm memory is invalidated by the next call that might grow
/// that memory).
#[wasm_bindgen]
pub struct WasmDocument {
    inner: Document,
}

#[wasm_bindgen]
impl WasmDocument {
    /// Fresh document: one frame, one default layer. Mirrors
    /// `Document::new` — see that function's doc.
    #[wasm_bindgen(constructor)]
    pub fn new(canvas_w: u32, canvas_h: u32) -> WasmDocument {
        WasmDocument {
            inner: Document::new(canvas_w, canvas_h),
        }
    }

    /// Imports a full document from the flat wire format. `undefined` on any
    /// shape mismatch — a boundary-validated no-op, never a panic/throw. See
    /// `Document::from_payload`'s doc for the exact `doc_meta` layout.
    #[allow(clippy::too_many_arguments)]
    pub fn from_payload(
        doc_meta: &[u32],
        layer_opacity: &[f64],
        layer_name_lens: &[u32],
        layer_names_bytes: &[u8],
        pixels: &[u8],
    ) -> Option<WasmDocument> {
        Document::from_payload(
            doc_meta,
            layer_opacity,
            layer_name_lens,
            layer_names_bytes,
            pixels,
        )
        .map(|inner| WasmDocument { inner })
    }

    // ── Reads ────────────────────────────────────────────────────────────

    pub fn read_layer(&self, frame_id: u32, layer_id: u32) -> Vec<u8> {
        self.inner.read_layer(frame_id, layer_id)
    }

    pub fn export_pixels(&self) -> Vec<u8> {
        self.inner.export_pixels()
    }

    pub fn meta_doc(&self) -> Vec<u32> {
        self.inner.meta_doc()
    }

    pub fn meta_layer_opacity(&self) -> Vec<f64> {
        self.inner.meta_layer_opacity()
    }

    pub fn meta_layer_name_lens(&self) -> Vec<u32> {
        self.inner.meta_layer_name_lens()
    }

    pub fn meta_layer_names_bytes(&self) -> Vec<u8> {
        self.inner.meta_layer_names_bytes()
    }

    pub fn can_undo(&self) -> bool {
        self.inner.can_undo()
    }

    pub fn can_redo(&self) -> bool {
        self.inner.can_redo()
    }

    pub fn history_bytes(&self) -> u32 {
        self.inner.history_bytes()
    }

    /// Fix-agent 7g (item 3): see `Document::noop`'s doc.
    pub fn noop(&self) -> Vec<u32> {
        encode_dispatch_result(&self.inner.noop())
    }

    /// TEST-ONLY (phase 7f). Deliberately panics — with this crate's
    /// `panic = "abort"` release profile, that compiles to a Wasm
    /// `unreachable` trap, i.e. a REAL `WebAssembly.RuntimeError`, not a
    /// simulated one. Exists purely so JS-side tests can reproduce the
    /// actual wasm-bindgen post-trap behavior (the generated glue sets a
    /// "this object is currently borrowed" flag before entering any `&self`/
    /// `&mut self` method and only clears it on a NORMAL return — a trap
    /// skips that cleanup, so the flag is stuck forever and every later call
    /// on the SAME JS handle throws a plain `Error: recursive use of an
    /// object detected which is already borrowed`, never another
    /// `RuntimeError`) without relying on a slow/flaky genuine OOM. Never
    /// called by production TS (`rg`-verified: only
    /// `wasm-pixel-core-resolver.*.test.ts` and `wasm-document-core.test.ts`
    /// reference it).
    pub fn debug_force_trap(&mut self) {
        panic!("WasmDocument.debug_force_trap: intentional test-only panic")
    }

    // ── Commands (each returns the flat `DispatchResult` encoding above) ───

    pub fn stroke_begin(&mut self, layer_id: u32) -> Vec<u32> {
        encode_dispatch_result(&self.inner.stroke_begin(layer_id))
    }

    pub fn stroke_points(&mut self, points: &[i32], rgba: u32) -> Vec<u32> {
        encode_dispatch_result(&self.inner.stroke_points(points, rgba))
    }

    pub fn stroke_end(&mut self, label: &str) -> Vec<u32> {
        encode_dispatch_result(&self.inner.stroke_end(label))
    }

    pub fn fill(&mut self, layer_id: u32, x: u32, y: u32, rgba: u32, label: &str) -> Vec<u32> {
        encode_dispatch_result(&self.inner.fill(layer_id, x, y, rgba, label))
    }

    pub fn region_clear(&mut self, layer_id: u32, rx: u32, ry: u32, rw: u32, rh: u32) -> Vec<u32> {
        encode_dispatch_result(&self.inner.region_clear(layer_id, rx, ry, rw, rh))
    }

    #[allow(clippy::too_many_arguments)]
    pub fn selection_commit(
        &mut self,
        layer_id: u32,
        rx: u32,
        ry: u32,
        rw: u32,
        rh: u32,
        pixels: &[u8],
    ) -> Vec<u32> {
        encode_dispatch_result(
            &self
                .inner
                .selection_commit(layer_id, rx, ry, rw, rh, pixels),
        )
    }

    pub fn layer_add(&mut self) -> Vec<u32> {
        encode_dispatch_result(&self.inner.layer_add())
    }

    pub fn layer_remove(&mut self, layer_id: u32) -> Vec<u32> {
        encode_dispatch_result(&self.inner.layer_remove(layer_id))
    }

    pub fn layer_meta(
        &mut self,
        layer_id: u32,
        name: Option<String>,
        visible: Option<bool>,
        locked: Option<bool>,
        opacity: Option<f64>,
    ) -> Vec<u32> {
        encode_dispatch_result(
            &self
                .inner
                .layer_meta(layer_id, name, visible, locked, opacity),
        )
    }

    pub fn layer_reorder(&mut self, from: u32, to: u32) -> Vec<u32> {
        encode_dispatch_result(&self.inner.layer_reorder(from, to))
    }

    pub fn layer_set_active(&mut self, layer_id: u32) -> Vec<u32> {
        encode_dispatch_result(&self.inner.layer_set_active(layer_id))
    }

    pub fn frame_add(&mut self) -> Vec<u32> {
        encode_dispatch_result(&self.inner.frame_add())
    }

    pub fn frame_remove(&mut self, index: u32) -> Vec<u32> {
        encode_dispatch_result(&self.inner.frame_remove(index))
    }

    pub fn frame_select(&mut self, index: u32) -> Vec<u32> {
        encode_dispatch_result(&self.inner.frame_select(index))
    }

    #[allow(clippy::too_many_arguments)]
    pub fn doc_replace(
        &mut self,
        canvas_w: u32,
        canvas_h: u32,
        frame_count: u32,
        frame_duration_ms: u32,
        pixels: &[u8],
        label: &str,
    ) -> Vec<u32> {
        encode_dispatch_result(&self.inner.doc_replace(
            canvas_w,
            canvas_h,
            frame_count,
            frame_duration_ms,
            pixels,
            label,
        ))
    }

    #[allow(clippy::too_many_arguments)]
    pub fn frame_paste(
        &mut self,
        at: u32,
        layer_counts: &[u32],
        durations: &[u32],
        visible: &[u32],
        locked: &[u32],
        opacity: &[f64],
        name_lens: &[u32],
        names_bytes: &[u8],
        pixels: &[u8],
    ) -> Vec<u32> {
        encode_dispatch_result(&self.inner.frame_paste(
            at,
            layer_counts,
            durations,
            visible,
            locked,
            opacity,
            name_lens,
            names_bytes,
            pixels,
        ))
    }

    pub fn undo(&mut self) -> Vec<u32> {
        encode_dispatch_result(&self.inner.undo())
    }

    pub fn redo(&mut self) -> Vec<u32> {
        encode_dispatch_result(&self.inner.redo())
    }

    pub fn timeline_set_fps(&mut self, fps: u32) -> Vec<u32> {
        encode_dispatch_result(&self.inner.timeline_set_fps(fps))
    }

    pub fn timeline_toggle_loop(&mut self) -> Vec<u32> {
        encode_dispatch_result(&self.inner.timeline_toggle_loop())
    }

    pub fn timeline_set_frame_selection(&mut self, indices: &[u32]) -> Vec<u32> {
        encode_dispatch_result(&self.inner.timeline_set_frame_selection(indices))
    }

    pub fn timeline_toggle_playback(&mut self) -> Vec<u32> {
        encode_dispatch_result(&self.inner.timeline_toggle_playback())
    }
}

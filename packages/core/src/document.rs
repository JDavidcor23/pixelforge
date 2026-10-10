//! Phase 7: the Rust `Document` — frames, layers and pixel buffers OWNED in
//! Wasm linear memory (not JS), plus dirty-rect/structural undo history. Pure
//! Rust domain (hexagonal, same rule `crate::pixels`/`crate::flood_fill`
//! follow): no `wasm_bindgen` import anywhere in this file — `crate::bindings`
//! is the only adapter that knows this type exists to JS.
//!
//! This is a line-by-line port of `apps/editor/src/lib/core/ts-core.ts` (the
//! "behavior oracle" — see that file's extensive module docs for the full
//! judgment-day history behind every rule mirrored here). Read THAT file
//! first if a rule here looks arbitrary; it almost certainly isn't.
//!
//! ## Why ids are `u32` handles here, never strings (D6)
//!
//! `TsPixelCore` mints STRING ids (`${idSeed}-f${n}`/`${idSeed}-l${n}` —
//! `ts-core.ts`'s `nextFrameId`/`nextLayerId`). A Wasm boundary cannot hand a
//! JS string back and forth per pixel-op without paying a UTF-8 marshalling
//! cost on every call — against D6 ("no serde", flat numeric handles). So
//! `Document` mints its own, completely independent, purely-internal `u32`
//! handle per frame/layer (`frame_id_counter`/`layer_id_counter`, monotonic,
//! never reused — same nonce pattern `CoreState`'s counters use). The TS
//! facade (`packages/core/src-ts/wasm-document-core.ts`) is the ONLY place
//! that knows a "real" string id exists: it keeps a handle<->string bimap and
//! mints a fresh `${idSeed}-f${n}` string the first time it observes a
//! previously-unseen handle in a `DispatchResult.dirty` entry (every new
//! frame/layer is ALWAYS reported dirty immediately — see `fullDirty`'s doc
//! in `commands.ts` — so this is a complete, not heuristic, detection rule).
//! The numeric VALUE of a Rust handle and the numeric suffix in its formatted
//! string id are unrelated on purpose — decoupling them is what let this
//! file skip reproducing `ts-core.ts`'s `highestIdSuffix` collision-avoidance
//! scan entirely (a Rust handle can never collide with anything: it is a
//! private monotonic counter the string layer never feeds back into).

use std::collections::HashMap;

use crate::history::{
    DocSnapshotRecord, FrameRecord, History, HistoryEntry, HistoryPatch, LayerMetaSnapshot,
    LayerRecord,
};

// ── Constants (mirror `apps/editor/src/constants/index.ts`) ────────────────
const DEFAULT_OPACITY: f64 = 100.0;
const DEFAULT_FPS: u32 = 12;
const DEFAULT_FRAME_DURATION_MS: u32 = 83;
const MIN_FPS: u32 = 1;
const MAX_FPS: u32 = 60;
const MS_PER_SECOND: f64 = 1000.0;
const LAYER_NAME_PREFIX: &str = "Layer";
const CHANNELS: u32 = 4;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Rect {
    pub x: u32,
    pub y: u32,
    pub w: u32,
    pub h: u32,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct LayerRef {
    pub frame_id: u32,
    pub layer_id: u32,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct DirtyRect {
    pub frame_id: u32,
    pub layer_id: u32,
    pub rect: Rect,
}

#[derive(Clone, Debug)]
pub struct Layer {
    pub id: u32,
    pub name: String,
    pub visible: bool,
    pub locked: bool,
    pub opacity: f64,
    pub data: Vec<u8>,
}

#[derive(Clone, Debug)]
pub struct Frame {
    pub id: u32,
    pub layers: Vec<Layer>,
    pub active_layer_id: u32,
    pub duration_ms: u32,
}

/// Mirrors `ts-core.ts`'s `StrokeState` minus `working` — this port mutates
/// the frame's live layer buffer directly in place while a stroke is open
/// (cheaper: zero extra buffer, `readLayer` naturally shows live progress),
/// keeping only `shadow` (the pre-stroke copy `stroke.end` diffs against).
struct StrokeState {
    frame_id: u32,
    layer_id: u32,
    shadow: Vec<u8>,
}

/// The full, explicit result of one dispatch — the Rust-domain mirror of
/// `commands.ts`'s `DispatchResult`. `crate::bindings` flattens this into the
/// wire format JS decodes (see that module's doc).
pub struct DispatchResult {
    pub changed: bool,
    pub content_changed: bool,
    pub history_changed: bool,
    pub can_undo: bool,
    pub can_redo: bool,
    pub stroke_open: bool,
    pub revision: u64,
    pub content_revision: u64,
    pub dirty: Vec<DirtyRect>,
    pub evicted: Vec<LayerRef>,
    pub layer_revisions: Vec<(u32, u64)>,
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum Direction {
    Before,
    After,
}

pub struct Document {
    pub canvas_w: u32,
    pub canvas_h: u32,
    frames: Vec<Frame>,
    current_frame_index: usize,
    fps: u32,
    loop_enabled: bool,
    is_playing: bool,
    selected_frame_indices: Vec<u32>,
    history: History,
    stroke: Option<StrokeState>,
    revision: u64,
    content_revision: u64,
    layer_revisions: HashMap<u32, u64>,
    frame_id_counter: u32,
    layer_id_counter: u32,
}

// ── Small free-function helpers (mirror ts-core.ts's module-level helpers) ──

fn full_rect(w: u32, h: u32) -> Rect {
    Rect { x: 0, y: 0, w, h }
}

fn full_dirty(frame: &Frame, w: u32, h: u32) -> Vec<DirtyRect> {
    frame
        .layers
        .iter()
        .map(|l| DirtyRect {
            frame_id: frame.id,
            layer_id: l.id,
            rect: full_rect(w, h),
        })
        .collect()
}

fn full_refs(frame: &Frame) -> Vec<LayerRef> {
    frame
        .layers
        .iter()
        .map(|l| LayerRef {
            frame_id: frame.id,
            layer_id: l.id,
        })
        .collect()
}

fn full_dirty_record(frame: &FrameRecord, w: u32, h: u32) -> Vec<DirtyRect> {
    frame
        .layers
        .iter()
        .map(|l| DirtyRect {
            frame_id: frame.id,
            layer_id: l.id,
            rect: full_rect(w, h),
        })
        .collect()
}

fn full_refs_record(frame: &FrameRecord) -> Vec<LayerRef> {
    frame
        .layers
        .iter()
        .map(|l| LayerRef {
            frame_id: frame.id,
            layer_id: l.id,
        })
        .collect()
}

fn frame_index_by_id(frames: &[Frame], id: u32) -> Option<usize> {
    frames.iter().position(|f| f.id == id)
}

fn resolve_active_layer_id(layers: &[Layer], preferred: u32, fallback: u32) -> u32 {
    if layers.iter().any(|l| l.id == preferred) {
        return preferred;
    }
    if layers.iter().any(|l| l.id == fallback) {
        return fallback;
    }
    layers.first().map(|l| l.id).unwrap_or(preferred)
}

/// Non-negative rect-clamp — the TS facade pre-clamps any NEGATIVE x/y to 0
/// before calling into Wasm (a `u32` FFI parameter cannot represent a
/// negative number without silent wraparound, so that part of
/// `clampRectToBuffer` lives in `wasm-document-core.ts` instead); this is the
/// second half, clamping the (already non-negative) rect's far edge to the
/// canvas — kept here too as a defensive no-op layer, same "boundary-
/// validated no-op, never trust the caller" convention every other function
/// in this crate follows.
fn clamp_rect_to_buffer(
    x: u32,
    y: u32,
    w: u32,
    h: u32,
    canvas_w: u32,
    canvas_h: u32,
) -> Option<Rect> {
    let x0 = x.min(canvas_w);
    let y0 = y.min(canvas_h);
    let x1 = x.saturating_add(w).min(canvas_w);
    let y1 = y.saturating_add(h).min(canvas_h);
    if x1 <= x0 || y1 <= y0 {
        return None;
    }
    Some(Rect {
        x: x0,
        y: y0,
        w: x1 - x0,
        h: y1 - y0,
    })
}

fn layer_to_record(l: &Layer) -> LayerRecord {
    LayerRecord {
        id: l.id,
        name: l.name.clone(),
        visible: l.visible,
        locked: l.locked,
        opacity: l.opacity,
        data: l.data.clone(),
    }
}

fn frame_to_record(f: &Frame) -> FrameRecord {
    FrameRecord {
        id: f.id,
        layers: f.layers.iter().map(layer_to_record).collect(),
        active_layer_id: f.active_layer_id,
        duration_ms: f.duration_ms,
    }
}

fn layer_to_live(r: &LayerRecord) -> Layer {
    Layer {
        id: r.id,
        name: r.name.clone(),
        visible: r.visible,
        locked: r.locked,
        opacity: r.opacity,
        data: r.data.clone(),
    }
}

fn frame_to_live(r: &FrameRecord) -> Frame {
    Frame {
        id: r.id,
        layers: r.layers.iter().map(layer_to_live).collect(),
        active_layer_id: r.active_layer_id,
        duration_ms: r.duration_ms,
    }
}

/// Mirrors `ts-core.ts`'s `dirtyAndEvictedOf` exactly (see that function's
/// doc for the full "C1/W8 fix" rationale: precise (frame,layer) pairs,
/// never a blanket sweep).
fn dirty_and_evicted_of(entry: &HistoryEntry, dir: Direction) -> (Vec<DirtyRect>, Vec<LayerRef>) {
    match entry {
        HistoryEntry::Patch {
            frame_id, patches, ..
        } => (
            patches
                .iter()
                .map(|p| DirtyRect {
                    frame_id: *frame_id,
                    layer_id: p.layer_id,
                    rect: p.rect,
                })
                .collect(),
            vec![],
        ),
        HistoryEntry::LayerMeta { .. } | HistoryEntry::LayerReorder { .. } => (vec![], vec![]),
        HistoryEntry::LayerAdd {
            frame_id, layer, ..
        } => {
            let r = LayerRef {
                frame_id: *frame_id,
                layer_id: layer.id,
            };
            if dir == Direction::After {
                (
                    vec![DirtyRect {
                        frame_id: *frame_id,
                        layer_id: layer.id,
                        rect: full_rect(0, 0),
                    }],
                    vec![],
                )
            } else {
                (vec![], vec![r])
            }
        }
        HistoryEntry::LayerRemove {
            frame_id, layer, ..
        } => {
            let r = LayerRef {
                frame_id: *frame_id,
                layer_id: layer.id,
            };
            if dir == Direction::Before {
                (
                    vec![DirtyRect {
                        frame_id: *frame_id,
                        layer_id: layer.id,
                        rect: full_rect(0, 0),
                    }],
                    vec![],
                )
            } else {
                (vec![], vec![r])
            }
        }
        HistoryEntry::FrameAdd { frame, .. } => {
            if dir == Direction::After {
                (full_dirty_record(frame, 0, 0), vec![])
            } else {
                (vec![], full_refs_record(frame))
            }
        }
        HistoryEntry::FrameRemove { frame, .. } => {
            if dir == Direction::Before {
                (full_dirty_record(frame, 0, 0), vec![])
            } else {
                (vec![], full_refs_record(frame))
            }
        }
        HistoryEntry::FramePaste { frames, .. } => {
            if dir == Direction::After {
                (
                    frames
                        .iter()
                        .flat_map(|f| full_dirty_record(f, 0, 0))
                        .collect(),
                    vec![],
                )
            } else {
                (vec![], frames.iter().flat_map(full_refs_record).collect())
            }
        }
        HistoryEntry::DocReplace { before, after, .. } => {
            let (into, out_of) = if dir == Direction::Before {
                (before, after)
            } else {
                (after, before)
            };
            let dirty = into
                .frames
                .iter()
                .flat_map(|f| full_dirty_record(f, into.canvas_w, into.canvas_h))
                .collect();
            let evicted = out_of.frames.iter().flat_map(full_refs_record).collect();
            (dirty, evicted)
        }
    }
}

impl Document {
    // ── Construction ─────────────────────────────────────────────────────

    /// Fresh document: one frame, one default layer, same shape
    /// `createEmptyDocSnapshot` builds. Ids start at 1.
    ///
    /// Phase 7f (verify-report-phase-7, WARNING #1): `canvas_w * canvas_h *
    /// CHANNELS` is `checked_mul`'d exactly like every sibling constructor in
    /// this crate (`from_payload`, `doc_replace`) — the same overflow class
    /// phase 6f's W-A fixed for `downscale`/`quantize` (on wasm32's 32-bit
    /// `usize`, `canvas_w * canvas_h * 4 >= 2^32` wraps to a small number,
    /// under-allocating `data` so a later write indexes past the real buffer
    /// and traps). This constructor is `pub` FFI surface
    /// (`#[wasm_bindgen(constructor)]` in `bindings.rs`) and infallible by
    /// signature, so an overflowing request degrades to a safe 1x1 canvas
    /// instead of panicking — never reachable today (the only call site,
    /// `wasm-document-core.ts`'s `importDocument` corruption fallback, uses a
    /// hardcoded `32x32`), but closes the defect for any future/external caller.
    pub fn new(canvas_w: u32, canvas_h: u32) -> Self {
        let data_len = (canvas_w as usize)
            .checked_mul(canvas_h as usize)
            .and_then(|px| px.checked_mul(CHANNELS as usize));
        let (canvas_w, canvas_h, data_len) = match data_len {
            Some(len) => (canvas_w, canvas_h, len),
            None => (1, 1, CHANNELS as usize),
        };
        let layer = Layer {
            id: 1,
            name: format!("{LAYER_NAME_PREFIX} 1"),
            visible: true,
            locked: false,
            opacity: DEFAULT_OPACITY,
            data: vec![0u8; data_len],
        };
        let frame = Frame {
            id: 1,
            layers: vec![layer],
            active_layer_id: 1,
            duration_ms: DEFAULT_FRAME_DURATION_MS,
        };
        Self {
            canvas_w,
            canvas_h,
            frames: vec![frame],
            current_frame_index: 0,
            fps: DEFAULT_FPS,
            loop_enabled: true,
            is_playing: false,
            selected_frame_indices: vec![0],
            history: History::new(),
            stroke: None,
            revision: 0,
            content_revision: 0,
            layer_revisions: HashMap::new(),
            frame_id_counter: 1,
            layer_id_counter: 1,
        }
    }

    /// Imports a full document from the flat wire format `crate::bindings`
    /// decodes `from_payload`'s arguments into (see that function's doc for
    /// the exact `doc_meta` layout). `None` on any shape mismatch — a
    /// boundary-validated no-op, never a panic.
    #[allow(clippy::too_many_arguments)]
    pub fn from_payload(
        doc_meta: &[u32],
        layer_opacity: &[f64],
        layer_names: &str,
        pixels_data: &[u8],
    ) -> Option<Self> {
        let mut idx = 0usize;
        let mut next = |slice: &[u32]| -> Option<u32> {
            let v = slice.get(idx).copied();
            idx += 1;
            v
        };
        let canvas_w = next(doc_meta)?;
        let canvas_h = next(doc_meta)?;
        let fps = next(doc_meta)?;
        let loop_flag = next(doc_meta)?;
        let is_playing_flag = next(doc_meta)?;
        let current_frame_index = next(doc_meta)?;
        let frame_count = next(doc_meta)?;
        let selected_count = next(doc_meta)?;
        if frame_count == 0 {
            return None;
        }
        let mut selected_frame_indices = Vec::with_capacity(selected_count as usize);
        for _ in 0..selected_count {
            selected_frame_indices.push(next(doc_meta)?);
        }
        let mut durations = Vec::with_capacity(frame_count as usize);
        for _ in 0..frame_count {
            durations.push(next(doc_meta)?);
        }
        let mut active_layer_index = Vec::with_capacity(frame_count as usize);
        for _ in 0..frame_count {
            active_layer_index.push(next(doc_meta)?);
        }
        let mut layer_counts = Vec::with_capacity(frame_count as usize);
        for _ in 0..frame_count {
            layer_counts.push(next(doc_meta)?);
        }
        let total_layers: usize = layer_counts.iter().map(|&c| c as usize).sum();
        let mut visible = Vec::with_capacity(total_layers);
        for _ in 0..total_layers {
            visible.push(next(doc_meta)?);
        }
        let mut locked = Vec::with_capacity(total_layers);
        for _ in 0..total_layers {
            locked.push(next(doc_meta)?);
        }

        if layer_opacity.len() != total_layers {
            return None;
        }
        let names_vec: Vec<&str> = if total_layers == 0 {
            vec![]
        } else {
            layer_names.split('\u{0}').collect()
        };
        if names_vec.len() != total_layers {
            return None;
        }
        let per_layer_len = (canvas_w as usize)
            .checked_mul(canvas_h as usize)?
            .checked_mul(CHANNELS as usize)?;
        if per_layer_len.checked_mul(total_layers) != Some(pixels_data.len()) {
            return None;
        }

        let mut layer_handle = 0u32;
        let mut byte_cursor = 0usize;
        let mut layer_cursor = 0usize;
        let mut frames = Vec::with_capacity(frame_count as usize);
        for f in 0..frame_count as usize {
            let lc = layer_counts[f] as usize;
            if lc == 0 {
                return None; // every frame must have at least one layer (mirrors frame.paste's "invalid" rule)
            }
            let mut layers = Vec::with_capacity(lc);
            for _ in 0..lc {
                layer_handle += 1;
                let data = pixels_data[byte_cursor..byte_cursor + per_layer_len].to_vec();
                byte_cursor += per_layer_len;
                layers.push(Layer {
                    id: layer_handle,
                    name: names_vec[layer_cursor].to_string(),
                    visible: visible[layer_cursor] != 0,
                    locked: locked[layer_cursor] != 0,
                    opacity: layer_opacity[layer_cursor],
                    data,
                });
                layer_cursor += 1;
            }
            let active_idx = (active_layer_index[f] as usize).min(layers.len() - 1);
            let active_layer_id = layers[active_idx].id;
            frames.push(Frame {
                id: (f as u32) + 1,
                layers,
                active_layer_id,
                duration_ms: durations[f],
            });
        }

        Some(Self {
            canvas_w,
            canvas_h,
            current_frame_index: (current_frame_index as usize).min(frames.len() - 1),
            frames,
            fps,
            loop_enabled: loop_flag != 0,
            is_playing: is_playing_flag != 0,
            selected_frame_indices,
            history: History::new(),
            stroke: None,
            revision: 0,
            content_revision: 0,
            layer_revisions: HashMap::new(),
            frame_id_counter: frame_count,
            layer_id_counter: total_layers as u32,
        })
    }

    // ── Reads ────────────────────────────────────────────────────────────

    fn current_frame(&self) -> &Frame {
        &self.frames[self.current_frame_index]
    }

    fn current_layers(&self) -> &[Layer] {
        &self.frames[self.current_frame_index].layers
    }

    pub fn can_undo(&self) -> bool {
        self.history.can_undo()
    }

    pub fn can_redo(&self) -> bool {
        self.history.can_redo()
    }

    /// Total bytes retained by the undo/redo stack right now — a diagnostic
    /// for the edit-history spec's "Bounded Undo Memory" budget (not part of
    /// `PixelCore`'s own interface; exposed as an EXTRA method on
    /// `WasmPixelCore` for `*.undo-memory.baseline.test.ts`-style
    /// measurements, mirroring `history.ts`'s `historyBytes` on the TS side).
    pub fn history_bytes(&self) -> u32 {
        self.history.total_bytes() as u32
    }

    /// A COPY of the layer's live pixels — `None` (facade returns an empty
    /// buffer) for an unknown (frame, layer) pair, never a panic. A Wasm
    /// linear-memory view handed to JS is invalidated by the next call that
    /// might grow memory (D7), so this always copies, same contract
    /// `PixelCore.readLayer`'s doc describes.
    pub fn read_layer(&self, frame_id: u32, layer_id: u32) -> Vec<u8> {
        self.frames
            .iter()
            .find(|f| f.id == frame_id)
            .and_then(|f| f.layers.iter().find(|l| l.id == layer_id))
            .map(|l| l.data.clone())
            .unwrap_or_default()
    }

    pub fn export_pixels(&self) -> Vec<u8> {
        let mut out = Vec::new();
        for f in &self.frames {
            for l in &f.layers {
                out.extend_from_slice(&l.data);
            }
        }
        out
    }

    /// Flat metadata export — see `crate::bindings::meta_doc`'s doc for the
    /// exact layout (shared by both `snapshot()` and `exportDocument()` on
    /// the TS side; this is "metadata only", never pixels, matching
    /// `PixelCore.snapshot()`'s contract).
    pub fn meta_doc(&self) -> Vec<u32> {
        let mut out = vec![
            self.canvas_w,
            self.canvas_h,
            self.fps,
            self.loop_enabled as u32,
            self.is_playing as u32,
            self.current_frame_index as u32,
            self.frames.len() as u32,
            self.selected_frame_indices.len() as u32,
        ];
        out.extend(self.selected_frame_indices.iter().copied());
        out.extend(self.frames.iter().map(|f| f.duration_ms));
        out.extend(self.frames.iter().map(|f| f.id));
        out.extend(self.frames.iter().map(|f| f.active_layer_id));
        out.extend(self.frames.iter().map(|f| f.layers.len() as u32));
        for f in &self.frames {
            out.extend(f.layers.iter().map(|l| l.id));
        }
        for f in &self.frames {
            out.extend(f.layers.iter().map(|l| l.visible as u32));
        }
        for f in &self.frames {
            out.extend(f.layers.iter().map(|l| l.locked as u32));
        }
        out
    }

    pub fn meta_layer_opacity(&self) -> Vec<f64> {
        self.frames
            .iter()
            .flat_map(|f| f.layers.iter().map(|l| l.opacity))
            .collect()
    }

    pub fn meta_layer_names(&self) -> String {
        self.frames
            .iter()
            .flat_map(|f| f.layers.iter().map(|l| l.name.clone()))
            .collect::<Vec<_>>()
            .join("\u{0}")
    }

    // ── Result assembly (mirrors `ts-core.ts`'s `buildResult`/the
    // `dispatchCommand` wrapper's contentRevision/layerRevisions logic) ────

    fn build_result(
        &self,
        changed: bool,
        content_changed: bool,
        history_changed: bool,
        dirty: Vec<DirtyRect>,
        evicted: Vec<LayerRef>,
    ) -> DispatchResult {
        DispatchResult {
            changed,
            content_changed,
            history_changed,
            can_undo: self.history.can_undo(),
            can_redo: self.history.can_redo(),
            stroke_open: self.stroke.is_some(),
            revision: self.revision,
            content_revision: self.content_revision,
            dirty,
            evicted,
            layer_revisions: self.layer_revisions.iter().map(|(&k, &v)| (k, v)).collect(),
        }
    }

    fn no_change(&self, history_v0: u64) -> DispatchResult {
        let history_changed = self.history.version != history_v0;
        self.build_result(false, false, history_changed, vec![], vec![])
    }

    /// `non_content`: true for the handful of commands that mutate ONLY
    /// view/playback state (`layer.setActive`, `frame.select`,
    /// `timeline.*`) — mirrors `NON_CONTENT_COMMANDS` in `commands.ts`.
    fn finish(
        &mut self,
        changed: bool,
        history_changed: bool,
        dirty: Vec<DirtyRect>,
        evicted: Vec<LayerRef>,
        non_content: bool,
    ) -> DispatchResult {
        if !changed {
            return self.build_result(false, false, history_changed, dirty, evicted);
        }
        let content_changed = !non_content || history_changed;
        if content_changed {
            self.content_revision += 1;
        }
        let dirty_layer_ids: Vec<u32> = dirty.iter().map(|d| d.layer_id).collect();
        let layer_ids: Vec<u32> = if !dirty_layer_ids.is_empty() {
            dirty_layer_ids
        } else if !non_content {
            self.current_layers().iter().map(|l| l.id).collect()
        } else {
            vec![]
        };
        for id in layer_ids {
            *self.layer_revisions.entry(id).or_insert(0) += 1;
        }
        self.build_result(true, content_changed, history_changed, dirty, evicted)
    }

    /// Finalizes the open stroke (if any): diffs the live layer buffer
    /// against `shadow`, pushes a patch entry. Mirrors `ts-core.ts`'s
    /// `endOpenStroke` exactly, including bumping `self.revision` ONLY when
    /// a real patch was produced (a no-op commit — unknown frame/layer, or no
    /// actual pixel delta — never bumps anything).
    fn end_open_stroke(&mut self, label: &str) -> Vec<DirtyRect> {
        let Some(stroke) = self.stroke.take() else {
            return vec![];
        };
        let Some(fi) = frame_index_by_id(&self.frames, stroke.frame_id) else {
            return vec![];
        };
        let Some(layer) = self.frames[fi]
            .layers
            .iter()
            .find(|l| l.id == stroke.layer_id)
        else {
            return vec![];
        };
        let Some((x, y, w, h)) =
            crate::pixels::diff_rect(&stroke.shadow, &layer.data, self.canvas_w, self.canvas_h)
        else {
            return vec![];
        };
        let rect = Rect { x, y, w, h };
        let before =
            crate::pixels::extract_rect(&stroke.shadow, self.canvas_w, self.canvas_h, x, y, w, h)
                .unwrap_or_default();
        let after =
            crate::pixels::extract_rect(&layer.data, self.canvas_w, self.canvas_h, x, y, w, h)
                .unwrap_or_default();
        let active_layer_id = self.frames[fi].active_layer_id;
        let frame_id = self.frames[fi].id;
        self.history.push(HistoryEntry::Patch {
            label: label.to_string(),
            frame_id,
            active_layer_id,
            patches: vec![HistoryPatch {
                layer_id: stroke.layer_id,
                rect,
                before,
                after,
            }],
        });
        self.revision += 1;
        vec![DirtyRect {
            frame_id: stroke.frame_id,
            layer_id: stroke.layer_id,
            rect,
        }]
    }

    /// `prev_current_frame_id`: the id of whatever frame was current BEFORE
    /// this `apply_entry` call started mutating `self.frames` — mirrors
    /// `ts-core.ts`'s `focusStructural(doc, frames, ...)`, which reads
    /// `doc.timeline.currentFrameIndex` off the UNMUTATED `doc` argument, not
    /// off `frames` (the already-mutated array). This MUST be captured by
    /// the caller before touching `self.frames` — reading
    /// `self.frames[self.current_frame_index]` from INSIDE this function
    /// would, after an insert/remove already happened, land on whatever
    /// frame now sits at that STALE index, not the frame that was actually
    /// current (the bug a 300-seed differential fuzz caught: an `undo` of a
    /// `frame.paste` landed focus on the wrong frame, which then bumped the
    /// wrong layer's `layerRevisions` entry).
    fn focus_structural(
        &mut self,
        prev_current_frame_id: Option<u32>,
        target_frame_id: Option<u32>,
        target_layer_id: Option<u32>,
        fallback_index: usize,
    ) {
        if self.frames.is_empty() {
            self.current_frame_index = 0;
            self.selected_frame_indices = vec![];
            return;
        }
        let mut frame_index = target_frame_id.and_then(|id| frame_index_by_id(&self.frames, id));
        if frame_index.is_none() {
            if let Some(cur_id) = prev_current_frame_id {
                frame_index = frame_index_by_id(&self.frames, cur_id);
            }
        }
        let frame_index = frame_index.unwrap_or_else(|| fallback_index.min(self.frames.len() - 1));
        if let Some(frame) = self.frames.get_mut(frame_index) {
            let resolved = resolve_active_layer_id(
                &frame.layers,
                target_layer_id.unwrap_or(0),
                frame.active_layer_id,
            );
            frame.active_layer_id = resolved;
        }
        self.current_frame_index = frame_index;
        self.selected_frame_indices = vec![frame_index as u32];
    }

    fn apply_entry(&mut self, entry: &HistoryEntry, dir: Direction) {
        // Captured ONCE, before any branch below mutates `self.frames` — see
        // `focus_structural`'s doc for why this must happen here, not inside it.
        let prev_current_frame_id = self.frames.get(self.current_frame_index).map(|f| f.id);
        match entry {
            HistoryEntry::Patch {
                frame_id,
                active_layer_id,
                patches,
                ..
            } => {
                let Some(fi) = frame_index_by_id(&self.frames, *frame_id) else {
                    return;
                };
                for p in patches {
                    if let Some(layer) = self.frames[fi]
                        .layers
                        .iter_mut()
                        .find(|l| l.id == p.layer_id)
                    {
                        let bytes = if dir == Direction::Before {
                            &p.before
                        } else {
                            &p.after
                        };
                        crate::pixels::write_rect(
                            &mut layer.data,
                            self.canvas_w,
                            self.canvas_h,
                            p.rect.x,
                            p.rect.y,
                            p.rect.w,
                            p.rect.h,
                            bytes,
                        );
                    }
                }
                let resolved = resolve_active_layer_id(
                    &self.frames[fi].layers,
                    *active_layer_id,
                    self.frames[fi].active_layer_id,
                );
                self.frames[fi].active_layer_id = resolved;
                self.current_frame_index = fi;
                self.selected_frame_indices = vec![fi as u32];
            }
            HistoryEntry::LayerAdd {
                frame_id,
                layer,
                index,
                ..
            } => {
                if let Some(fi) = frame_index_by_id(&self.frames, *frame_id) {
                    if dir == Direction::After {
                        let idx = (*index as usize).min(self.frames[fi].layers.len());
                        self.frames[fi].layers.insert(idx, layer_to_live(layer));
                    } else {
                        self.frames[fi].layers.retain(|l| l.id != layer.id);
                    }
                }
                let target_layer = if dir == Direction::After {
                    Some(layer.id)
                } else {
                    None
                };
                self.focus_structural(prev_current_frame_id, Some(*frame_id), target_layer, 0);
            }
            HistoryEntry::LayerRemove {
                frame_id,
                layer,
                index,
                ..
            } => {
                if let Some(fi) = frame_index_by_id(&self.frames, *frame_id) {
                    if dir == Direction::Before {
                        let idx = (*index as usize).min(self.frames[fi].layers.len());
                        self.frames[fi].layers.insert(idx, layer_to_live(layer));
                    } else {
                        self.frames[fi].layers.retain(|l| l.id != layer.id);
                    }
                }
                let target_layer = if dir == Direction::Before {
                    Some(layer.id)
                } else {
                    None
                };
                self.focus_structural(prev_current_frame_id, Some(*frame_id), target_layer, 0);
            }
            HistoryEntry::LayerMeta {
                frame_id,
                layer_id,
                before,
                after,
                ..
            } => {
                if let Some(fi) = frame_index_by_id(&self.frames, *frame_id) {
                    let snap: &LayerMetaSnapshot = if dir == Direction::Before {
                        before
                    } else {
                        after
                    };
                    if let Some(layer) = self.frames[fi]
                        .layers
                        .iter_mut()
                        .find(|l| l.id == *layer_id)
                    {
                        layer.name = snap.name.clone();
                        layer.visible = snap.visible;
                        layer.locked = snap.locked;
                        layer.opacity = snap.opacity;
                    }
                }
                self.focus_structural(prev_current_frame_id, Some(*frame_id), Some(*layer_id), 0);
            }
            HistoryEntry::LayerReorder {
                frame_id,
                layer_id,
                from,
                to,
                ..
            } => {
                if let Some(fi) = frame_index_by_id(&self.frames, *frame_id) {
                    let (f, t) = if dir == Direction::After {
                        (*from, *to)
                    } else {
                        (*to, *from)
                    };
                    if (f as usize) < self.frames[fi].layers.len() {
                        let layer = self.frames[fi].layers.remove(f as usize);
                        let t = (t as usize).min(self.frames[fi].layers.len());
                        self.frames[fi].layers.insert(t, layer);
                    }
                }
                self.focus_structural(prev_current_frame_id, Some(*frame_id), Some(*layer_id), 0);
            }
            HistoryEntry::FrameAdd { frame, index, .. } => {
                if dir == Direction::After {
                    let idx = (*index as usize).min(self.frames.len());
                    self.frames.insert(idx, frame_to_live(frame));
                    self.focus_structural(
                        prev_current_frame_id,
                        Some(frame.id),
                        None,
                        *index as usize,
                    );
                } else {
                    self.frames.retain(|f| f.id != frame.id);
                    self.focus_structural(prev_current_frame_id, None, None, *index as usize);
                }
            }
            HistoryEntry::FrameRemove { frame, index, .. } => {
                if dir == Direction::Before {
                    let idx = (*index as usize).min(self.frames.len());
                    self.frames.insert(idx, frame_to_live(frame));
                    self.focus_structural(
                        prev_current_frame_id,
                        Some(frame.id),
                        None,
                        *index as usize,
                    );
                } else {
                    self.frames.retain(|f| f.id != frame.id);
                    self.focus_structural(prev_current_frame_id, None, None, *index as usize);
                }
            }
            HistoryEntry::FramePaste { frames, at, .. } => {
                if dir == Direction::After {
                    let idx = (*at as usize).min(self.frames.len());
                    for (offset, f) in frames.iter().enumerate() {
                        self.frames.insert(idx + offset, frame_to_live(f));
                    }
                    let target = frames.first().map(|f| f.id);
                    self.focus_structural(prev_current_frame_id, target, None, *at as usize);
                } else {
                    let pasted: std::collections::HashSet<u32> =
                        frames.iter().map(|f| f.id).collect();
                    self.frames.retain(|f| !pasted.contains(&f.id));
                    self.focus_structural(prev_current_frame_id, None, None, *at as usize);
                }
            }
            HistoryEntry::DocReplace { before, after, .. } => {
                let snap: &DocSnapshotRecord = if dir == Direction::Before {
                    before
                } else {
                    after
                };
                self.canvas_w = snap.canvas_w;
                self.canvas_h = snap.canvas_h;
                self.frames = snap.frames.iter().map(frame_to_live).collect();
                let cfi = if self.frames.is_empty() {
                    0
                } else {
                    (snap.current_frame_index as usize).min(self.frames.len() - 1)
                };
                if let Some(frame) = self.frames.get_mut(cfi) {
                    let resolved = resolve_active_layer_id(
                        &frame.layers,
                        frame.active_layer_id,
                        frame.active_layer_id,
                    );
                    frame.active_layer_id = resolved;
                }
                self.current_frame_index = cfi;
                self.selected_frame_indices = snap.selected_frame_indices.clone();
                // fps/loop/isPlaying deliberately NOT restored (playback/view
                // prefs, not document data) — mirrors `applyEntry`'s
                // 'doc.replace' case exactly.
            }
        }
    }

    // ── Commands ─────────────────────────────────────────────────────────

    pub fn stroke_begin(&mut self, layer_id: u32) -> DispatchResult {
        let history_v0 = self.history.version;
        let commit_dirty = if self.stroke.is_some() {
            self.end_open_stroke("Draw")
        } else {
            vec![]
        };
        let commit_changed = !commit_dirty.is_empty();

        if let Some(unlocked) = self
            .current_layers()
            .iter()
            .find(|l| l.id == layer_id)
            .map(|l| !l.locked)
        {
            if unlocked {
                let frame_id = self.current_frame().id;
                let shadow = self
                    .current_layers()
                    .iter()
                    .find(|l| l.id == layer_id)
                    .unwrap()
                    .data
                    .clone();
                self.stroke = Some(StrokeState {
                    frame_id,
                    layer_id,
                    shadow,
                });
            }
        }
        let history_changed = self.history.version != history_v0;
        self.finish(commit_changed, history_changed, commit_dirty, vec![], false)
    }

    pub fn stroke_points(&mut self, points: &[i32], rgba: u32) -> DispatchResult {
        let history_v0 = self.history.version;
        let (frame_id, layer_id) = match &self.stroke {
            Some(s) => (s.frame_id, s.layer_id),
            None => return self.no_change(history_v0),
        };
        if self.current_frame().id != frame_id || points.is_empty() {
            return self.no_change(history_v0);
        }

        let canvas_w = self.canvas_w;
        let canvas_h = self.canvas_h;
        let frame_idx = self.current_frame_index;
        let Some(layer) = self.frames[frame_idx]
            .layers
            .iter_mut()
            .find(|l| l.id == layer_id)
        else {
            return self.no_change(history_v0);
        };

        let mut wrote = false;
        let (mut min_x, mut min_y, mut max_x, mut max_y) = (i64::MAX, i64::MAX, i64::MIN, i64::MIN);
        let mut i = 0usize;
        while i + 1 < points.len() {
            let x = points[i];
            let y = points[i + 1];
            if x >= 0 && y >= 0 && crate::pixels::in_bounds(canvas_w, canvas_h, x as u32, y as u32)
            {
                crate::pixels::put_pixel(
                    &mut layer.data,
                    canvas_w,
                    canvas_h,
                    x as u32,
                    y as u32,
                    rgba,
                );
                wrote = true;
                min_x = min_x.min(x as i64);
                min_y = min_y.min(y as i64);
                max_x = max_x.max(x as i64);
                max_y = max_y.max(y as i64);
            }
            i += 2;
        }
        if !wrote {
            return self.no_change(history_v0);
        }
        self.revision += 1;
        let rect = Rect {
            x: min_x as u32,
            y: min_y as u32,
            w: (max_x - min_x + 1) as u32,
            h: (max_y - min_y + 1) as u32,
        };
        let dirty = vec![DirtyRect {
            frame_id,
            layer_id,
            rect,
        }];
        let history_changed = self.history.version != history_v0;
        self.finish(true, history_changed, dirty, vec![], false)
    }

    pub fn stroke_end(&mut self, label: &str) -> DispatchResult {
        let history_v0 = self.history.version;
        if self.stroke.is_none() {
            return self.no_change(history_v0);
        }
        let dirty = self.end_open_stroke(label);
        let changed = !dirty.is_empty();
        let history_changed = self.history.version != history_v0;
        self.finish(changed, history_changed, dirty, vec![], false)
    }

    pub fn fill(
        &mut self,
        layer_id: u32,
        x: u32,
        y: u32,
        rgba: u32,
        label: &str,
    ) -> DispatchResult {
        let history_v0 = self.history.version;
        let commit_dirty = if self.stroke.is_some() {
            self.end_open_stroke("Draw")
        } else {
            vec![]
        };
        let commit_changed = !commit_dirty.is_empty();

        let canvas_w = self.canvas_w;
        let canvas_h = self.canvas_h;
        let frame_idx = self.current_frame_index;
        let frame_id = self.frames[frame_idx].id;
        let mut own_dirty = vec![];
        let mut own_changed = false;
        if let Some(pos) = self.frames[frame_idx]
            .layers
            .iter()
            .position(|l| l.id == layer_id)
        {
            let locked = self.frames[frame_idx].layers[pos].locked;
            if !locked && crate::pixels::in_bounds(canvas_w, canvas_h, x, y) {
                let before = self.frames[frame_idx].layers[pos].data.clone();
                let mut working = before.clone();
                if let Some((fx, fy, fw, fh)) =
                    crate::flood_fill::flood_fill(&mut working, canvas_w, canvas_h, x, y, rgba)
                {
                    let rect = Rect {
                        x: fx,
                        y: fy,
                        w: fw,
                        h: fh,
                    };
                    let before_patch =
                        crate::pixels::extract_rect(&before, canvas_w, canvas_h, fx, fy, fw, fh)
                            .unwrap_or_default();
                    let after_patch =
                        crate::pixels::extract_rect(&working, canvas_w, canvas_h, fx, fy, fw, fh)
                            .unwrap_or_default();
                    self.frames[frame_idx].layers[pos].data = working;
                    let active_layer_id = self.frames[frame_idx].active_layer_id;
                    self.history.push(HistoryEntry::Patch {
                        label: if label.is_empty() {
                            "Draw".to_string()
                        } else {
                            label.to_string()
                        },
                        frame_id,
                        active_layer_id,
                        patches: vec![HistoryPatch {
                            layer_id,
                            rect,
                            before: before_patch,
                            after: after_patch,
                        }],
                    });
                    self.revision += 1;
                    own_dirty = vec![DirtyRect {
                        frame_id,
                        layer_id,
                        rect,
                    }];
                    own_changed = true;
                }
            }
        }
        let dirty = [commit_dirty, own_dirty].concat();
        let changed = own_changed || commit_changed;
        let history_changed = self.history.version != history_v0;
        self.finish(changed, history_changed, dirty, vec![], false)
    }

    pub fn region_clear(
        &mut self,
        layer_id: u32,
        rx: u32,
        ry: u32,
        rw: u32,
        rh: u32,
    ) -> DispatchResult {
        let history_v0 = self.history.version;
        let commit_dirty = if self.stroke.is_some() {
            self.end_open_stroke("Draw")
        } else {
            vec![]
        };
        let commit_changed = !commit_dirty.is_empty();

        let canvas_w = self.canvas_w;
        let canvas_h = self.canvas_h;
        let frame_idx = self.current_frame_index;
        let frame_id = self.frames[frame_idx].id;
        let mut own_dirty = vec![];
        let mut own_changed = false;
        if let Some(pos) = self.frames[frame_idx]
            .layers
            .iter()
            .position(|l| l.id == layer_id)
        {
            let locked = self.frames[frame_idx].layers[pos].locked;
            if !locked {
                if let Some(clamped) = clamp_rect_to_buffer(rx, ry, rw, rh, canvas_w, canvas_h) {
                    let before = self.frames[frame_idx].layers[pos].data.clone();
                    let transparent =
                        vec![0u8; (clamped.w as usize) * (clamped.h as usize) * CHANNELS as usize];
                    let mut after = before.clone();
                    if crate::pixels::write_rect(
                        &mut after,
                        canvas_w,
                        canvas_h,
                        clamped.x,
                        clamped.y,
                        clamped.w,
                        clamped.h,
                        &transparent,
                    ) {
                        if let Some((dx, dy, dw, dh)) =
                            crate::pixels::diff_rect(&before, &after, canvas_w, canvas_h)
                        {
                            let rect = Rect {
                                x: dx,
                                y: dy,
                                w: dw,
                                h: dh,
                            };
                            let before_patch = crate::pixels::extract_rect(
                                &before, canvas_w, canvas_h, dx, dy, dw, dh,
                            )
                            .unwrap_or_default();
                            let after_patch = crate::pixels::extract_rect(
                                &after, canvas_w, canvas_h, dx, dy, dw, dh,
                            )
                            .unwrap_or_default();
                            self.frames[frame_idx].layers[pos].data = after;
                            let active_layer_id = self.frames[frame_idx].active_layer_id;
                            self.history.push(HistoryEntry::Patch {
                                label: "Clear".to_string(),
                                frame_id,
                                active_layer_id,
                                patches: vec![HistoryPatch {
                                    layer_id,
                                    rect,
                                    before: before_patch,
                                    after: after_patch,
                                }],
                            });
                            self.revision += 1;
                            own_dirty = vec![DirtyRect {
                                frame_id,
                                layer_id,
                                rect,
                            }];
                            own_changed = true;
                        }
                    }
                }
            }
        }
        let dirty = [commit_dirty, own_dirty].concat();
        let changed = own_changed || commit_changed;
        let history_changed = self.history.version != history_v0;
        self.finish(changed, history_changed, dirty, vec![], false)
    }

    #[allow(clippy::too_many_arguments)]
    pub fn selection_commit(
        &mut self,
        layer_id: u32,
        rx: u32,
        ry: u32,
        rw: u32,
        rh: u32,
        patch_pixels: &[u8],
    ) -> DispatchResult {
        let history_v0 = self.history.version;
        let commit_dirty = if self.stroke.is_some() {
            self.end_open_stroke("Draw")
        } else {
            vec![]
        };
        let commit_changed = !commit_dirty.is_empty();

        let canvas_w = self.canvas_w;
        let canvas_h = self.canvas_h;
        let frame_idx = self.current_frame_index;
        let frame_id = self.frames[frame_idx].id;
        let mut own_dirty = vec![];
        let mut own_changed = false;
        if let Some(pos) = self.frames[frame_idx]
            .layers
            .iter()
            .position(|l| l.id == layer_id)
        {
            let locked = self.frames[frame_idx].layers[pos].locked;
            let in_range = rw > 0
                && rh > 0
                && rx.checked_add(rw).is_some_and(|e| e <= canvas_w)
                && ry.checked_add(rh).is_some_and(|e| e <= canvas_h)
                && (rw as u64)
                    .checked_mul(rh as u64)
                    .and_then(|c| c.checked_mul(CHANNELS as u64))
                    == Some(patch_pixels.len() as u64);
            if !locked && in_range {
                let before = crate::pixels::extract_rect(
                    &self.frames[frame_idx].layers[pos].data,
                    canvas_w,
                    canvas_h,
                    rx,
                    ry,
                    rw,
                    rh,
                )
                .unwrap_or_default();
                if !crate::pixels::bytes_equal(&before, patch_pixels) {
                    let mut data = self.frames[frame_idx].layers[pos].data.clone();
                    if crate::pixels::write_rect(
                        &mut data,
                        canvas_w,
                        canvas_h,
                        rx,
                        ry,
                        rw,
                        rh,
                        patch_pixels,
                    ) {
                        self.frames[frame_idx].layers[pos].data = data;
                        let rect = Rect {
                            x: rx,
                            y: ry,
                            w: rw,
                            h: rh,
                        };
                        let active_layer_id = self.frames[frame_idx].active_layer_id;
                        self.history.push(HistoryEntry::Patch {
                            label: "Transform".to_string(),
                            frame_id,
                            active_layer_id,
                            patches: vec![HistoryPatch {
                                layer_id,
                                rect,
                                before,
                                after: patch_pixels.to_vec(),
                            }],
                        });
                        self.revision += 1;
                        own_dirty = vec![DirtyRect {
                            frame_id,
                            layer_id,
                            rect,
                        }];
                        own_changed = true;
                    }
                }
            }
        }
        let dirty = [commit_dirty, own_dirty].concat();
        let changed = own_changed || commit_changed;
        let history_changed = self.history.version != history_v0;
        self.finish(changed, history_changed, dirty, vec![], false)
    }

    pub fn layer_add(&mut self) -> DispatchResult {
        let history_v0 = self.history.version;
        let commit_dirty = if self.stroke.is_some() {
            self.end_open_stroke("Draw")
        } else {
            vec![]
        };

        let canvas_w = self.canvas_w;
        let canvas_h = self.canvas_h;
        let frame_idx = self.current_frame_index;
        let frame_id = self.frames[frame_idx].id;
        let index = self.frames[frame_idx].layers.len() as u32;
        self.layer_id_counter += 1;
        let new_id = self.layer_id_counter;
        let new_layer = Layer {
            id: new_id,
            name: format!("{LAYER_NAME_PREFIX} {}", index + 1),
            visible: true,
            locked: false,
            opacity: DEFAULT_OPACITY,
            data: vec![0u8; (canvas_w as usize) * (canvas_h as usize) * CHANNELS as usize],
        };
        let record = layer_to_record(&new_layer);
        self.frames[frame_idx].layers.push(new_layer);
        self.frames[frame_idx].active_layer_id = new_id;
        self.history.push(HistoryEntry::LayerAdd {
            label: "Add Layer".to_string(),
            frame_id,
            layer: record,
            index,
        });
        self.revision += 1;
        let own_dirty = vec![DirtyRect {
            frame_id,
            layer_id: new_id,
            rect: full_rect(canvas_w, canvas_h),
        }];
        let dirty = [commit_dirty, own_dirty].concat();
        let history_changed = self.history.version != history_v0;
        self.finish(true, history_changed, dirty, vec![], false)
    }

    pub fn layer_remove(&mut self, layer_id: u32) -> DispatchResult {
        let history_v0 = self.history.version;
        let commit_dirty = if self.stroke.is_some() {
            self.end_open_stroke("Draw")
        } else {
            vec![]
        };
        let commit_changed = !commit_dirty.is_empty();

        let frame_idx = self.current_frame_index;
        let frame_id = self.frames[frame_idx].id;
        let mut own_changed = false;
        let mut evicted = vec![];
        if self.frames[frame_idx].layers.len() > 1 {
            if let Some(index) = self.frames[frame_idx]
                .layers
                .iter()
                .position(|l| l.id == layer_id)
            {
                let removed = self.frames[frame_idx].layers.remove(index);
                let record = layer_to_record(&removed);
                if self.frames[frame_idx].active_layer_id == layer_id {
                    self.frames[frame_idx].active_layer_id = self.frames[frame_idx].layers[0].id;
                }
                self.history.push(HistoryEntry::LayerRemove {
                    label: "Remove Layer".to_string(),
                    frame_id,
                    layer: record,
                    index: index as u32,
                });
                self.revision += 1;
                evicted = vec![LayerRef {
                    frame_id,
                    layer_id: removed.id,
                }];
                own_changed = true;
            }
        }
        let changed = own_changed || commit_changed;
        let history_changed = self.history.version != history_v0;
        self.finish(changed, history_changed, commit_dirty, evicted, false)
    }

    pub fn layer_meta(
        &mut self,
        layer_id: u32,
        name: Option<String>,
        visible: Option<bool>,
        locked: Option<bool>,
        opacity: Option<f64>,
    ) -> DispatchResult {
        let history_v0 = self.history.version;
        let commit_dirty = if self.stroke.is_some() {
            self.end_open_stroke("Draw")
        } else {
            vec![]
        };
        let commit_changed = !commit_dirty.is_empty();

        let frame_idx = self.current_frame_index;
        let frame_id = self.frames[frame_idx].id;
        let mut own_changed = false;
        if let Some(pos) = self.frames[frame_idx]
            .layers
            .iter()
            .position(|l| l.id == layer_id)
        {
            let target = &self.frames[frame_idx].layers[pos];
            let changed_any = name.as_deref().is_some_and(|n| n != target.name)
                || visible.is_some_and(|v| v != target.visible)
                || locked.is_some_and(|v| v != target.locked)
                || opacity.is_some_and(|o| o != target.opacity);
            if changed_any {
                let before = LayerMetaSnapshot {
                    name: target.name.clone(),
                    visible: target.visible,
                    locked: target.locked,
                    opacity: target.opacity,
                };
                let layer = &mut self.frames[frame_idx].layers[pos];
                if let Some(n) = name {
                    layer.name = n;
                }
                if let Some(v) = visible {
                    layer.visible = v;
                }
                if let Some(v) = locked {
                    layer.locked = v;
                }
                if let Some(o) = opacity {
                    layer.opacity = o;
                }
                let after = LayerMetaSnapshot {
                    name: layer.name.clone(),
                    visible: layer.visible,
                    locked: layer.locked,
                    opacity: layer.opacity,
                };
                self.history.push(HistoryEntry::LayerMeta {
                    label: "Layer Properties".to_string(),
                    frame_id,
                    layer_id,
                    before,
                    after,
                });
                self.revision += 1;
                own_changed = true;
            }
        }
        let changed = own_changed || commit_changed;
        let history_changed = self.history.version != history_v0;
        self.finish(changed, history_changed, commit_dirty, vec![], false)
    }

    pub fn layer_reorder(&mut self, from: u32, to: u32) -> DispatchResult {
        let history_v0 = self.history.version;
        let commit_dirty = if self.stroke.is_some() {
            self.end_open_stroke("Draw")
        } else {
            vec![]
        };
        let commit_changed = !commit_dirty.is_empty();

        let frame_idx = self.current_frame_index;
        let frame_id = self.frames[frame_idx].id;
        let len = self.frames[frame_idx].layers.len() as u32;
        let mut own_changed = false;
        if from != to && from < len && to < len {
            let moved_layer_id = self.frames[frame_idx].layers[from as usize].id;
            let layer = self.frames[frame_idx].layers.remove(from as usize);
            self.frames[frame_idx].layers.insert(to as usize, layer);
            self.history.push(HistoryEntry::LayerReorder {
                label: "Reorder Layers".to_string(),
                frame_id,
                layer_id: moved_layer_id,
                from,
                to,
            });
            self.revision += 1;
            own_changed = true;
        }
        let changed = own_changed || commit_changed;
        let history_changed = self.history.version != history_v0;
        self.finish(changed, history_changed, commit_dirty, vec![], false)
    }

    pub fn layer_set_active(&mut self, layer_id: u32) -> DispatchResult {
        let history_v0 = self.history.version;
        if !self.current_layers().iter().any(|l| l.id == layer_id) {
            return self.no_change(history_v0);
        }
        let frame_idx = self.current_frame_index;
        self.frames[frame_idx].active_layer_id = layer_id;
        self.revision += 1;
        let history_changed = self.history.version != history_v0;
        self.finish(true, history_changed, vec![], vec![], true)
    }

    pub fn frame_select(&mut self, index: u32) -> DispatchResult {
        let history_v0 = self.history.version;
        if self.frames.get(index as usize).is_none() {
            return self.no_change(history_v0);
        }
        let commit_dirty = if self.stroke.is_some() {
            self.end_open_stroke("Draw")
        } else {
            vec![]
        };
        self.current_frame_index = index as usize;
        self.selected_frame_indices = vec![index];
        self.revision += 1;
        let history_changed = self.history.version != history_v0;
        self.finish(true, history_changed, commit_dirty, vec![], true)
    }

    pub fn frame_add(&mut self) -> DispatchResult {
        let history_v0 = self.history.version;
        let commit_dirty = if self.stroke.is_some() {
            self.end_open_stroke("Draw")
        } else {
            vec![]
        };

        let canvas_w = self.canvas_w;
        let canvas_h = self.canvas_h;
        self.layer_id_counter += 1;
        let layer_id = self.layer_id_counter;
        let new_layer = Layer {
            id: layer_id,
            name: format!("{LAYER_NAME_PREFIX} 1"),
            visible: true,
            locked: false,
            opacity: DEFAULT_OPACITY,
            data: vec![0u8; (canvas_w as usize) * (canvas_h as usize) * CHANNELS as usize],
        };
        self.frame_id_counter += 1;
        let frame_id = self.frame_id_counter;
        let duration_ms = (MS_PER_SECOND / self.fps as f64).round() as u32;
        let new_frame = Frame {
            id: frame_id,
            layers: vec![new_layer],
            active_layer_id: layer_id,
            duration_ms,
        };
        let index = self.frames.len() as u32;
        self.frames.push(new_frame.clone());
        self.current_frame_index = index as usize;
        self.selected_frame_indices = vec![index];

        let record = frame_to_record(&new_frame);
        self.history.push(HistoryEntry::FrameAdd {
            label: "Add Frame".to_string(),
            frame: record,
            index,
        });
        self.revision += 1;
        let own_dirty = full_dirty(&new_frame, canvas_w, canvas_h);
        let dirty = [commit_dirty, own_dirty].concat();
        let history_changed = self.history.version != history_v0;
        self.finish(true, history_changed, dirty, vec![], false)
    }

    pub fn frame_remove(&mut self, index: u32) -> DispatchResult {
        let history_v0 = self.history.version;
        let commit_dirty = if self.stroke.is_some() {
            self.end_open_stroke("Draw")
        } else {
            vec![]
        };
        let commit_changed = !commit_dirty.is_empty();

        let mut own_changed = false;
        let mut evicted = vec![];
        if self.frames.len() > 1 && (index as usize) < self.frames.len() {
            let removed = self.frames.remove(index as usize);
            let new_current = if self.current_frame_index > index as usize {
                self.current_frame_index - 1
            } else {
                self.current_frame_index
            };
            let new_current = new_current.min(self.frames.len() - 1);
            self.current_frame_index = new_current;
            self.selected_frame_indices = vec![new_current as u32];
            let record = frame_to_record(&removed);
            self.history.push(HistoryEntry::FrameRemove {
                label: "Remove Frame".to_string(),
                frame: record,
                index,
            });
            self.revision += 1;
            evicted = full_refs(&removed);
            own_changed = true;
        }
        let changed = own_changed || commit_changed;
        let history_changed = self.history.version != history_v0;
        self.finish(changed, history_changed, commit_dirty, evicted, false)
    }

    /// Simplified `doc.replace`: each replaced frame always gets exactly ONE
    /// default layer at the new canvas size (mirrors `ts-core.ts`'s
    /// `doc.replace` case exactly — it too always builds one default layer
    /// per incoming frame).
    pub fn doc_replace(
        &mut self,
        canvas_w: u32,
        canvas_h: u32,
        frame_count: u32,
        frame_duration_ms: u32,
        pixels_data: &[u8],
        label: &str,
    ) -> DispatchResult {
        let history_v0 = self.history.version;
        let commit_dirty = if self.stroke.is_some() {
            self.end_open_stroke("Draw")
        } else {
            vec![]
        };
        let commit_changed = !commit_dirty.is_empty();

        let per_frame_len = (canvas_w as usize)
            .checked_mul(canvas_h as usize)
            .and_then(|v| v.checked_mul(CHANNELS as usize));
        let valid = frame_count > 0
            && per_frame_len
                .is_some_and(|l| l.checked_mul(frame_count as usize) == Some(pixels_data.len()));

        let mut own_dirty = vec![];
        let mut evicted = vec![];
        let mut own_changed = false;
        if valid {
            let per_frame_len = per_frame_len.unwrap();
            let before = DocSnapshotRecord {
                canvas_w: self.canvas_w,
                canvas_h: self.canvas_h,
                frames: self.frames.iter().map(frame_to_record).collect(),
                current_frame_index: self.current_frame_index as u32,
                selected_frame_indices: self.selected_frame_indices.clone(),
            };
            let fps = if frame_duration_ms > 0 {
                ((MS_PER_SECOND / frame_duration_ms as f64).round() as u32).clamp(MIN_FPS, MAX_FPS)
            } else {
                DEFAULT_FPS
            };

            let mut new_frames = Vec::with_capacity(frame_count as usize);
            for i in 0..frame_count {
                self.layer_id_counter += 1;
                let layer_id = self.layer_id_counter;
                let start = (i as usize) * per_frame_len;
                let data = pixels_data[start..start + per_frame_len].to_vec();
                let layer = Layer {
                    id: layer_id,
                    name: format!("{LAYER_NAME_PREFIX} 1"),
                    visible: true,
                    locked: false,
                    opacity: DEFAULT_OPACITY,
                    data,
                };
                self.frame_id_counter += 1;
                let frame_id = self.frame_id_counter;
                new_frames.push(Frame {
                    id: frame_id,
                    layers: vec![layer],
                    active_layer_id: layer_id,
                    duration_ms: frame_duration_ms,
                });
            }

            self.canvas_w = canvas_w;
            self.canvas_h = canvas_h;
            self.fps = fps;
            self.loop_enabled = true;
            self.is_playing = false;
            self.frames = new_frames;
            self.current_frame_index = 0;
            self.selected_frame_indices = vec![0];

            let after = DocSnapshotRecord {
                canvas_w,
                canvas_h,
                frames: self.frames.iter().map(frame_to_record).collect(),
                current_frame_index: 0,
                selected_frame_indices: vec![0],
            };
            own_dirty = self
                .frames
                .iter()
                .flat_map(|f| full_dirty(f, canvas_w, canvas_h))
                .collect();
            evicted = before.frames.iter().flat_map(full_refs_record).collect();
            self.history.push(HistoryEntry::DocReplace {
                label: label.to_string(),
                before,
                after,
            });
            self.revision += 1;
            own_changed = true;
        }
        let dirty = [commit_dirty, own_dirty].concat();
        let changed = own_changed || commit_changed;
        let history_changed = self.history.version != history_v0;
        self.finish(changed, history_changed, dirty, evicted, false)
    }

    /// `frame.paste` — pastes `layer_counts.len()` fresh frames at `at`,
    /// always with fresh ids/buffers (judgment-day round 2, finding 6 — never
    /// aliases the caller's ids/buffers). KNOWN DEVIATION from
    /// `ts-core.ts`'s `serializedFrameToFrame`: every pasted frame's
    /// `activeLayerId` defaults to its FIRST layer — the original
    /// `SerializedFrame.activeLayerId` passthrough is dropped from this
    /// phase's wire format for simplicity (documented in `HANDOFF.md`).
    #[allow(clippy::too_many_arguments)]
    pub fn frame_paste(
        &mut self,
        at: u32,
        layer_counts: &[u32],
        durations: &[u32],
        visible: &[u32],
        locked: &[u32],
        opacity: &[f64],
        names: &str,
        pixels_data: &[u8],
    ) -> DispatchResult {
        let history_v0 = self.history.version;
        let commit_dirty = if self.stroke.is_some() {
            self.end_open_stroke("Draw")
        } else {
            vec![]
        };
        let commit_changed = !commit_dirty.is_empty();

        let frame_count = layer_counts.len();
        let total_layers: usize = layer_counts.iter().map(|&c| c as usize).sum();
        let names_vec: Vec<&str> = if total_layers == 0 {
            vec![]
        } else {
            names.split('\u{0}').collect()
        };
        let per_layer_len = (self.canvas_w as usize)
            .checked_mul(self.canvas_h as usize)
            .and_then(|v| v.checked_mul(CHANNELS as usize));
        let valid = frame_count > 0
            && durations.len() == frame_count
            && layer_counts.iter().all(|&c| c > 0)
            && opacity.len() == total_layers
            && visible.len() == total_layers
            && locked.len() == total_layers
            && names_vec.len() == total_layers
            && per_layer_len
                .is_some_and(|l| l.checked_mul(total_layers) == Some(pixels_data.len()));

        let mut own_dirty = vec![];
        let mut own_changed = false;
        if valid {
            let per_layer_len = per_layer_len.unwrap();
            let at = (at as usize).min(self.frames.len());
            let mut layer_cursor = 0usize;
            let mut byte_cursor = 0usize;
            let mut new_frames = Vec::with_capacity(frame_count);
            for (f, &lc) in layer_counts.iter().enumerate() {
                let mut layers = Vec::with_capacity(lc as usize);
                for _ in 0..lc {
                    self.layer_id_counter += 1;
                    let id = self.layer_id_counter;
                    let data = pixels_data[byte_cursor..byte_cursor + per_layer_len].to_vec();
                    byte_cursor += per_layer_len;
                    layers.push(Layer {
                        id,
                        name: names_vec[layer_cursor].to_string(),
                        visible: visible[layer_cursor] != 0,
                        locked: locked[layer_cursor] != 0,
                        opacity: opacity[layer_cursor],
                        data,
                    });
                    layer_cursor += 1;
                }
                self.frame_id_counter += 1;
                let frame_id = self.frame_id_counter;
                let active_layer_id = layers[0].id;
                new_frames.push(Frame {
                    id: frame_id,
                    layers,
                    active_layer_id,
                    duration_ms: durations[f],
                });
            }

            for f in &new_frames {
                own_dirty.extend(full_dirty(f, self.canvas_w, self.canvas_h));
            }
            let record_frames: Vec<FrameRecord> = new_frames.iter().map(frame_to_record).collect();
            for (offset, f) in new_frames.into_iter().enumerate() {
                self.frames.insert(at + offset, f);
            }
            self.current_frame_index = at;
            self.selected_frame_indices = (0..frame_count as u32).map(|i| at as u32 + i).collect();
            self.history.push(HistoryEntry::FramePaste {
                label: "Paste Frames".to_string(),
                frames: record_frames,
                at: at as u32,
            });
            self.revision += 1;
            own_changed = true;
        }
        let dirty = [commit_dirty, own_dirty].concat();
        let changed = own_changed || commit_changed;
        let history_changed = self.history.version != history_v0;
        self.finish(changed, history_changed, dirty, vec![], false)
    }

    pub fn undo(&mut self) -> DispatchResult {
        let history_v0 = self.history.version;
        if self.stroke.is_some() {
            self.end_open_stroke("Draw");
        }
        let Some(entry) = self.history.pop_undo() else {
            let history_changed = self.history.version != history_v0;
            return self.finish(false, history_changed, vec![], vec![], false);
        };
        self.apply_entry(&entry, Direction::Before);
        self.revision += 1;
        let (dirty, evicted) = dirty_and_evicted_of(&entry, Direction::Before);
        let dirty = patch_in_canvas_rects(dirty, self.canvas_w, self.canvas_h);
        let history_changed = self.history.version != history_v0;
        self.finish(true, history_changed, dirty, evicted, false)
    }

    pub fn redo(&mut self) -> DispatchResult {
        let history_v0 = self.history.version;
        if self.stroke.is_some() {
            self.end_open_stroke("Draw");
        }
        let Some(entry) = self.history.pop_redo() else {
            let history_changed = self.history.version != history_v0;
            return self.finish(false, history_changed, vec![], vec![], false);
        };
        self.apply_entry(&entry, Direction::After);
        self.revision += 1;
        let (dirty, evicted) = dirty_and_evicted_of(&entry, Direction::After);
        let dirty = patch_in_canvas_rects(dirty, self.canvas_w, self.canvas_h);
        let history_changed = self.history.version != history_v0;
        self.finish(true, history_changed, dirty, evicted, false)
    }

    pub fn timeline_set_fps(&mut self, fps: u32) -> DispatchResult {
        let history_v0 = self.history.version;
        self.fps = fps.clamp(MIN_FPS, MAX_FPS);
        self.revision += 1;
        let history_changed = self.history.version != history_v0;
        self.finish(true, history_changed, vec![], vec![], true)
    }

    pub fn timeline_toggle_loop(&mut self) -> DispatchResult {
        let history_v0 = self.history.version;
        self.loop_enabled = !self.loop_enabled;
        self.revision += 1;
        let history_changed = self.history.version != history_v0;
        self.finish(true, history_changed, vec![], vec![], true)
    }

    pub fn timeline_set_frame_selection(&mut self, indices: &[u32]) -> DispatchResult {
        let history_v0 = self.history.version;
        let len = self.frames.len() as u32;
        self.selected_frame_indices = indices.iter().copied().filter(|&i| i < len).collect();
        self.revision += 1;
        let history_changed = self.history.version != history_v0;
        self.finish(true, history_changed, vec![], vec![], true)
    }

    pub fn timeline_toggle_playback(&mut self) -> DispatchResult {
        let history_v0 = self.history.version;
        self.is_playing = !self.is_playing;
        self.revision += 1;
        let history_changed = self.history.version != history_v0;
        self.finish(true, history_changed, vec![], vec![], true)
    }
}

/// `dirty_and_evicted_of` fills `rect` with `full_rect(0,0)` for every
/// whole-layer case (it has no canvas-size context — `document.rs`'s own
/// `self.canvas_w/h` is the right size for every case except `doc.replace`,
/// which already carries its own per-snapshot size). This patches those
/// placeholder `(0,0)`-sized rects up to the real current canvas size right
/// after `dirty_and_evicted_of` returns, for the cases where that is correct
/// (every kind EXCEPT `doc.replace`, which already computed its own rects
/// using each snapshot's own stored size and must be left untouched).
fn patch_in_canvas_rects(dirty: Vec<DirtyRect>, canvas_w: u32, canvas_h: u32) -> Vec<DirtyRect> {
    dirty
        .into_iter()
        .map(|d| {
            if d.rect.w == 0 && d.rect.h == 0 {
                DirtyRect {
                    rect: Rect {
                        w: canvas_w,
                        h: canvas_h,
                        ..d.rect
                    },
                    ..d
                }
            } else {
                d
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn rgba(r: u8, g: u8, b: u8, a: u8) -> u32 {
        crate::pixels::pack_rgba(r, g, b, a)
    }

    #[test]
    fn fresh_document_has_one_frame_one_layer() {
        let doc = Document::new(4, 4);
        assert_eq!(doc.meta_doc()[6], 1); // frame_count
        assert_eq!(doc.read_layer(1, 1).len(), 4 * 4 * 4);
    }

    #[test]
    fn new_degrades_to_a_safe_1x1_canvas_instead_of_overflowing_the_allocation() {
        // Phase 7f WARNING #1: `canvas_w * canvas_h * CHANNELS` must never
        // wrap on a 32-bit `usize` (wasm32) and under-allocate `data`. On a
        // 64-bit test host `usize` is 64-bit, so this exact pair doesn't
        // overflow THERE — the point of this test is the `checked_mul` chain
        // itself (same one `from_payload`/`doc_replace` use), proven here
        // with a pair that overflows on ANY width: `u32::MAX` for both
        // dimensions overflows even 64-bit usize (u32::MAX^2 * 4 > u64::MAX).
        let doc = Document::new(u32::MAX, u32::MAX);
        assert_eq!(doc.canvas_w, 1);
        assert_eq!(doc.canvas_h, 1);
        assert_eq!(doc.read_layer(1, 1).len(), CHANNELS as usize);
    }

    #[test]
    fn stroke_lifecycle_writes_pixels_and_is_undoable() {
        let mut doc = Document::new(4, 4);
        let begin = doc.stroke_begin(1);
        assert!(begin.stroke_open);
        let points = [0, 0, 1, 1];
        let r = doc.stroke_points(&points, rgba(255, 0, 0, 255));
        assert!(r.changed);
        assert_eq!(r.dirty.len(), 1);
        let end = doc.stroke_end("Draw");
        assert!(end.changed);
        assert!(!end.stroke_open);
        assert!(end.can_undo);

        let data = doc.read_layer(1, 1);
        assert_eq!(&data[0..4], &[255, 0, 0, 255]);

        let undo = doc.undo();
        assert!(undo.changed);
        let data_after_undo = doc.read_layer(1, 1);
        assert_eq!(&data_after_undo[0..4], &[0, 0, 0, 0]);

        let redo = doc.redo();
        assert!(redo.changed);
        let data_after_redo = doc.read_layer(1, 1);
        assert_eq!(&data_after_redo[0..4], &[255, 0, 0, 255]);
    }

    #[test]
    fn undo_memory_reference_scenario_a_single_pixel_stroke_retains_8_bytes() {
        // Mirrors `apps/editor/src/lib/history.undo-memory.baseline.test.ts`'s
        // exact reference scenario (task 7.7: "re-verify the undo-memory
        // metric on the Wasm path") — a single-pixel stroke patch retains
        // exactly 4 (before) + 4 (after) = 8 bytes, far under the 1KB budget,
        // regardless of canvas/frame/layer count.
        let mut doc = Document::new(64, 64);
        doc.stroke_begin(1);
        doc.stroke_points(&[10, 20], rgba(255, 0, 0, 255));
        let end = doc.stroke_end("1px stroke");
        assert!(end.can_undo);
        assert_eq!(doc.history_bytes(), 8);
        assert!(doc.history_bytes() < 1024);
    }

    #[test]
    fn stroke_points_with_no_open_stroke_is_a_no_op() {
        let mut doc = Document::new(4, 4);
        let r = doc.stroke_points(&[0, 0], rgba(1, 2, 3, 255));
        assert!(!r.changed);
    }

    #[test]
    fn fill_commits_and_undo_restores_original() {
        let mut doc = Document::new(3, 3);
        let r = doc.fill(1, 1, 1, rgba(9, 9, 9, 255), "Fill");
        assert!(r.changed);
        assert!(r.can_undo);
        let data = doc.read_layer(1, 1);
        assert_eq!(&data[0..4], &[9, 9, 9, 255]); // 4-connected flood fill covers the whole empty 3x3
        let undo = doc.undo();
        assert!(undo.changed);
        let restored = doc.read_layer(1, 1);
        assert!(restored.iter().all(|&b| b == 0));
    }

    #[test]
    fn fill_on_locked_layer_is_a_no_op() {
        let mut doc = Document::new(3, 3);
        doc.layer_meta(1, None, None, Some(true), None);
        let r = doc.fill(1, 0, 0, rgba(1, 1, 1, 255), "Fill");
        assert!(!r.changed);
    }

    #[test]
    fn fill_out_of_bounds_seed_is_a_no_op() {
        let mut doc = Document::new(3, 3);
        let r = doc.fill(1, 10, 10, rgba(1, 1, 1, 255), "Fill");
        assert!(!r.changed);
    }

    #[test]
    fn layer_add_then_remove_roundtrips_through_undo() {
        let mut doc = Document::new(2, 2);
        let add = doc.layer_add();
        assert!(add.changed);
        assert_eq!(add.dirty.len(), 1);
        let new_layer_id = add.dirty[0].layer_id;
        assert_eq!(doc.meta_doc()[12], 2); // layer_counts[0] (see meta_doc layout: idx 12 is the first frame's layer count)

        let remove = doc.layer_remove(new_layer_id);
        assert!(remove.changed);
        assert_eq!(remove.evicted.len(), 1);

        doc.undo(); // undoes the remove: layer comes back
        assert_eq!(doc.read_layer(1, new_layer_id).len(), 2 * 2 * 4);
        doc.undo(); // undoes the add: layer gone again
        assert_eq!(doc.read_layer(1, new_layer_id).len(), 0);
    }

    #[test]
    fn layer_remove_last_layer_is_a_no_op() {
        let mut doc = Document::new(2, 2);
        let r = doc.layer_remove(1);
        assert!(!r.changed);
    }

    #[test]
    fn layer_meta_no_actual_change_is_a_no_op() {
        let mut doc = Document::new(2, 2);
        let r = doc.layer_meta(
            1,
            Some("Layer 1".to_string()),
            Some(true),
            Some(false),
            Some(100.0),
        );
        assert!(!r.changed);
    }

    #[test]
    fn frame_add_then_remove_roundtrips() {
        let mut doc = Document::new(2, 2);
        let add = doc.frame_add();
        assert!(add.changed);
        assert_eq!(doc.meta_doc()[6], 2);
        let remove = doc.frame_remove(1);
        assert!(remove.changed);
        assert_eq!(doc.meta_doc()[6], 1);
        doc.undo(); // undo remove: frame 2 comes back
        assert_eq!(doc.meta_doc()[6], 2);
        doc.undo(); // undo add: back to 1 frame
        assert_eq!(doc.meta_doc()[6], 1);
    }

    #[test]
    fn frame_remove_last_frame_is_a_no_op() {
        let mut doc = Document::new(2, 2);
        let r = doc.frame_remove(0);
        assert!(!r.changed);
    }

    #[test]
    fn doc_replace_swaps_canvas_and_is_undoable() {
        let mut doc = Document::new(2, 2);
        let pixels = vec![1u8; 3 * 3 * 4 * 2]; // 2 frames of 3x3
        let r = doc.doc_replace(3, 3, 2, 100, &pixels, "Import");
        assert!(r.changed);
        assert_eq!(doc.canvas_w, 3);
        assert_eq!(doc.meta_doc()[6], 2);
        let undo = doc.undo();
        assert!(undo.changed);
        assert_eq!(doc.canvas_w, 2);
        assert_eq!(doc.meta_doc()[6], 1);
    }

    #[test]
    fn doc_replace_rejects_mismatched_buffer_length() {
        let mut doc = Document::new(2, 2);
        let pixels = vec![1u8; 10]; // wrong length
        let r = doc.doc_replace(3, 3, 2, 100, &pixels, "Import");
        assert!(!r.changed);
        assert_eq!(doc.canvas_w, 2); // untouched
    }

    #[test]
    fn frame_paste_inserts_fresh_frames_and_is_undoable() {
        let mut doc = Document::new(2, 2);
        let pixels = vec![7u8; 2 * 2 * 4]; // 1 frame, 1 layer
        let r = doc.frame_paste(1, &[1], &[50], &[1], &[0], &[100.0], "L1", &pixels);
        assert!(r.changed);
        assert_eq!(doc.meta_doc()[6], 2);
        doc.undo();
        assert_eq!(doc.meta_doc()[6], 1);
    }

    #[test]
    fn frame_paste_rejects_zero_layer_frame() {
        let mut doc = Document::new(2, 2);
        let r = doc.frame_paste(0, &[0], &[50], &[], &[], &[], "", &[]);
        assert!(!r.changed);
    }

    #[test]
    fn undo_with_nothing_to_undo_is_a_no_op() {
        let mut doc = Document::new(2, 2);
        let r = doc.undo();
        assert!(!r.changed);
    }

    #[test]
    fn undo_with_an_open_stroke_commits_then_immediately_reverts_it() {
        // Mirrors `ts-core.ts`'s 'undo' case: it force-commits any open
        // stroke FIRST (pushing a patch entry), then pops the undo stack —
        // which is now that SAME just-pushed entry. Net effect: a stroke
        // open when `undo` is called is committed and immediately reverted,
        // leaving nothing further to undo.
        let mut doc = Document::new(2, 2);
        doc.stroke_begin(1);
        doc.stroke_points(&[0, 0], rgba(1, 1, 1, 255));
        let r = doc.undo();
        assert!(r.changed);
        assert!(r.history_changed);
        assert!(!r.can_undo);
        let data = doc.read_layer(1, 1);
        assert!(data.iter().all(|&b| b == 0)); // reverted back to transparent
    }

    #[test]
    fn layer_set_active_unknown_layer_is_a_no_op() {
        let mut doc = Document::new(2, 2);
        let r = doc.layer_set_active(999);
        assert!(!r.changed);
    }

    #[test]
    fn frame_select_out_of_range_is_a_no_op() {
        let mut doc = Document::new(2, 2);
        let r = doc.frame_select(5);
        assert!(!r.changed);
    }

    #[test]
    fn timeline_set_fps_clamps_to_valid_range() {
        let mut doc = Document::new(2, 2);
        doc.timeline_set_fps(999);
        assert_eq!(doc.meta_doc()[2], MAX_FPS);
        doc.timeline_set_fps(0);
        assert_eq!(doc.meta_doc()[2], MIN_FPS);
    }

    #[test]
    fn from_payload_roundtrips_through_meta_doc_and_export_pixels() {
        let doc_meta: Vec<u32> = vec![
            2, 2, // canvas
            12, 1, 0, // fps, loop, isPlaying
            0, // currentFrameIndex
            1, // frame_count
            1, 0,  // selected_count, selected[0]
            83, // durations[0]
            0,  // active_layer_index[0]
            1,  // layer_counts[0]
            1,  // visible[0]
            0,  // locked[0]
        ];
        let opacity = vec![100.0];
        let names = "Layer 1";
        let pixels = vec![5u8; 2 * 2 * 4];
        let doc =
            Document::from_payload(&doc_meta, &opacity, names, &pixels).expect("valid payload");
        assert_eq!(doc.export_pixels(), pixels);
        assert_eq!(doc.meta_layer_names(), "Layer 1");
    }

    #[test]
    fn from_payload_rejects_mismatched_pixel_length() {
        let doc_meta: Vec<u32> = vec![2, 2, 12, 1, 0, 0, 1, 1, 0, 83, 0, 1, 1, 0];
        let opacity = vec![100.0];
        let pixels = vec![5u8; 3]; // wrong length
        assert!(Document::from_payload(&doc_meta, &opacity, "Layer 1", &pixels).is_none());
    }

    #[test]
    fn new_ids_never_collide_with_pre_existing_handles_after_import() {
        let doc_meta: Vec<u32> = vec![2, 2, 12, 1, 0, 0, 2, 1, 0, 83, 83, 0, 0, 1, 1, 1, 1, 0, 0];
        let opacity = vec![100.0, 100.0];
        let pixels = vec![0u8; 2 * 2 * 4 * 2];
        let mut doc =
            Document::from_payload(&doc_meta, &opacity, "Layer 1\u{0}Layer 1", &pixels).unwrap();
        let add = doc.layer_add();
        let new_id = add.dirty[0].layer_id;
        // handles 1 and 2 are already taken by the two imported layers.
        assert_ne!(new_id, 1);
        assert_ne!(new_id, 2);
    }
}

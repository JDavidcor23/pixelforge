//! Pure-Rust dirty-rect undo history (phase 7 port of
//! `apps/editor/src/lib/core/history.ts` — see that file's module doc for the
//! full design rationale, judgment-day round 1/2 history). No wasm-bindgen
//! import anywhere here (hexagonal, same rule `crate::pixels`/`crate::document`
//! follow) — `crate::bindings`/`crate::document` are the only callers.
//!
//! Ids are `u32` internal handles (design D6 — see `document.rs`'s module doc
//! for why: the TS facade owns the `${idSeed}-f${n}` STRING identity, Rust
//! only ever sees/stores a monotonic numeric handle).

use crate::document::Rect;

/// Mirrors `apps/editor/src/constants/index.ts`'s `SPRITE_EDITOR_HISTORY`.
pub const HISTORY_MAX_ENTRIES: usize = 50;
pub const HISTORY_MAX_BYTES: usize = 32 * 1024 * 1024;

#[derive(Clone, Debug, PartialEq)]
pub struct LayerMetaSnapshot {
    pub name: String,
    pub visible: bool,
    pub locked: bool,
    pub opacity: f64,
}

#[derive(Clone, Debug)]
pub struct HistoryPatch {
    pub layer_id: u32,
    pub rect: Rect,
    pub before: Vec<u8>,
    pub after: Vec<u8>,
}

/// A layer's full data (id, metadata, pixels) as retained by a `layer.add`/
/// `layer.remove`/frame-carrying history entry — mirrors TS's `Layer`.
#[derive(Clone, Debug)]
pub struct LayerRecord {
    pub id: u32,
    pub name: String,
    pub visible: bool,
    pub locked: bool,
    pub opacity: f64,
    pub data: Vec<u8>,
}

/// A frame's full data (id, its layers, active layer, duration) — mirrors
/// TS's `AnimationFrame`.
#[derive(Clone, Debug)]
pub struct FrameRecord {
    pub id: u32,
    pub layers: Vec<LayerRecord>,
    pub active_layer_id: u32,
    pub duration_ms: u32,
}

/// Full-document snapshot — ONLY used by the `doc.replace` entry (see
/// `history.ts`'s module doc: "the one deliberate exception").
#[derive(Clone, Debug)]
pub struct DocSnapshotRecord {
    pub canvas_w: u32,
    pub canvas_h: u32,
    pub frames: Vec<FrameRecord>,
    pub current_frame_index: u32,
    pub selected_frame_indices: Vec<u32>,
}

#[derive(Clone, Debug)]
pub enum HistoryEntry {
    Patch {
        label: String,
        frame_id: u32,
        active_layer_id: u32,
        patches: Vec<HistoryPatch>,
    },
    LayerAdd {
        label: String,
        frame_id: u32,
        layer: LayerRecord,
        index: u32,
    },
    LayerRemove {
        label: String,
        frame_id: u32,
        layer: LayerRecord,
        index: u32,
    },
    LayerMeta {
        label: String,
        frame_id: u32,
        layer_id: u32,
        before: LayerMetaSnapshot,
        after: LayerMetaSnapshot,
    },
    LayerReorder {
        label: String,
        frame_id: u32,
        layer_id: u32,
        from: u32,
        to: u32,
    },
    FrameAdd {
        label: String,
        frame: FrameRecord,
        index: u32,
    },
    FrameRemove {
        label: String,
        frame: FrameRecord,
        index: u32,
    },
    FramePaste {
        label: String,
        frames: Vec<FrameRecord>,
        at: u32,
    },
    DocReplace {
        label: String,
        before: DocSnapshotRecord,
        after: DocSnapshotRecord,
    },
}

fn bytes_of_frame(frame: &FrameRecord) -> usize {
    frame.layers.iter().map(|l| l.data.len()).sum()
}

fn bytes_of_snapshot(snap: &DocSnapshotRecord) -> usize {
    snap.frames.iter().map(bytes_of_frame).sum()
}

/// Byte cost of one entry — mirrors `history.ts`'s `entryBytes` exactly,
/// including the judgment-day round 2 fix that `layer.meta`/`layer.reorder`
/// cost `0` (scalars only, no pixel data).
pub fn entry_bytes(entry: &HistoryEntry) -> usize {
    match entry {
        HistoryEntry::Patch { patches, .. } => {
            patches.iter().map(|p| p.before.len() + p.after.len()).sum()
        }
        HistoryEntry::DocReplace { before, after, .. } => {
            bytes_of_snapshot(before) + bytes_of_snapshot(after)
        }
        HistoryEntry::LayerAdd { layer, .. } | HistoryEntry::LayerRemove { layer, .. } => {
            layer.data.len()
        }
        HistoryEntry::FrameAdd { frame, .. } | HistoryEntry::FrameRemove { frame, .. } => {
            bytes_of_frame(frame)
        }
        HistoryEntry::FramePaste { frames, .. } => frames.iter().map(bytes_of_frame).sum(),
        HistoryEntry::LayerMeta { .. } | HistoryEntry::LayerReorder { .. } => 0,
    }
}

fn total_bytes(entries: &[HistoryEntry]) -> usize {
    entries.iter().map(entry_bytes).sum()
}

/// Dirty-rect undo history. `version` is a Rust-only addition (no TS
/// equivalent — TS detects "did history change" via object-reference
/// inequality, which Rust has no analogue for; a monotonic counter bumped by
/// every mutating operation gives `document.rs` the same signal).
#[derive(Default)]
pub struct History {
    pub entries: Vec<HistoryEntry>,
    /// Index of the last APPLIED entry; `-1` (`None`) means nothing applied yet.
    pub cursor: Option<usize>,
    pub version: u64,
}

impl History {
    pub fn new() -> Self {
        Self {
            entries: Vec::new(),
            cursor: None,
            version: 0,
        }
    }

    pub fn can_undo(&self) -> bool {
        self.cursor.is_some()
    }

    pub fn can_redo(&self) -> bool {
        match self.cursor {
            None => !self.entries.is_empty(),
            Some(c) => c + 1 < self.entries.len(),
        }
    }

    pub fn total_bytes(&self) -> usize {
        total_bytes(&self.entries)
    }

    /// Pushes a new entry, discarding any redo branch beyond the cursor, then
    /// evicts the OLDEST entries first until both `HISTORY_MAX_ENTRIES` and
    /// `HISTORY_MAX_BYTES` hold — mirrors `history.ts`'s `pushEntry` exactly,
    /// including "never evict the just-pushed entry itself".
    pub fn push(&mut self, entry: HistoryEntry) {
        let keep = match self.cursor {
            Some(c) => c + 1,
            None => 0,
        };
        self.entries.truncate(keep);
        self.entries.push(entry);

        let mut start = 0usize;
        let mut bytes = total_bytes(&self.entries);
        while self.entries.len() - start > 1
            && (self.entries.len() - start > HISTORY_MAX_ENTRIES || bytes > HISTORY_MAX_BYTES)
        {
            bytes -= entry_bytes(&self.entries[start]);
            start += 1;
        }
        if start > 0 {
            self.entries.drain(0..start);
        }
        self.cursor = Some(self.entries.len() - 1);
        self.version += 1;
    }

    /// Pops the entry to undo (the one at `cursor`), moving `cursor` back one.
    /// `None` if nothing to undo.
    pub fn pop_undo(&mut self) -> Option<HistoryEntry> {
        let c = self.cursor?;
        let entry = self.entries[c].clone();
        self.cursor = if c == 0 { None } else { Some(c - 1) };
        self.version += 1;
        Some(entry)
    }

    /// Pops the entry to redo (the one right after `cursor`), moving `cursor`
    /// forward one. `None` if nothing to redo.
    pub fn pop_redo(&mut self) -> Option<HistoryEntry> {
        if !self.can_redo() {
            return None;
        }
        let next = match self.cursor {
            None => 0,
            Some(c) => c + 1,
        };
        let entry = self.entries[next].clone();
        self.cursor = Some(next);
        self.version += 1;
        Some(entry)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn patch(label: &str, bytes: usize) -> HistoryEntry {
        HistoryEntry::Patch {
            label: label.to_string(),
            frame_id: 1,
            active_layer_id: 1,
            patches: vec![HistoryPatch {
                layer_id: 1,
                rect: Rect {
                    x: 0,
                    y: 0,
                    w: 1,
                    h: 1,
                },
                before: vec![0u8; bytes],
                after: vec![1u8; bytes],
            }],
        }
    }

    #[test]
    fn fresh_history_cannot_undo_or_redo() {
        let h = History::new();
        assert!(!h.can_undo());
        assert!(!h.can_redo());
    }

    #[test]
    fn push_then_undo_then_redo_roundtrips() {
        let mut h = History::new();
        h.push(patch("a", 4));
        assert!(h.can_undo());
        assert!(!h.can_redo());
        let undone = h.pop_undo().unwrap();
        assert!(matches!(undone, HistoryEntry::Patch { .. }));
        assert!(!h.can_undo());
        assert!(h.can_redo());
        let redone = h.pop_redo().unwrap();
        assert!(matches!(redone, HistoryEntry::Patch { .. }));
        assert!(h.can_undo());
        assert!(!h.can_redo());
    }

    #[test]
    fn pushing_after_undo_truncates_redo_branch() {
        let mut h = History::new();
        h.push(patch("a", 4));
        h.push(patch("b", 4));
        h.pop_undo(); // cursor back to "a"
        h.push(patch("c", 4)); // "b" (the redo branch) must be discarded
        assert_eq!(h.entries.len(), 2);
        assert!(!h.can_redo());
    }

    #[test]
    fn eviction_never_drops_the_just_pushed_entry_even_if_it_alone_exceeds_budget() {
        let mut h = History::new();
        h.push(patch("huge", HISTORY_MAX_BYTES + 1));
        assert_eq!(h.entries.len(), 1);
        assert!(h.total_bytes() > HISTORY_MAX_BYTES);
    }

    #[test]
    fn eviction_drops_oldest_first_once_budget_exceeded() {
        let mut h = History::new();
        let chunk = HISTORY_MAX_BYTES / 2 + 1;
        h.push(patch("a", chunk));
        h.push(patch("b", chunk)); // a+b > MAX_BYTES -> "a" evicted
        assert_eq!(h.entries.len(), 1);
        if let HistoryEntry::Patch { label, .. } = &h.entries[0] {
            assert_eq!(label, "b");
        } else {
            panic!("expected a patch entry");
        }
    }

    #[test]
    fn eviction_enforces_max_entries() {
        let mut h = History::new();
        for i in 0..(HISTORY_MAX_ENTRIES + 10) {
            h.push(patch(&format!("e{i}"), 1));
        }
        assert_eq!(h.entries.len(), HISTORY_MAX_ENTRIES);
    }

    #[test]
    fn layer_meta_and_reorder_entries_cost_zero_bytes() {
        let meta = HistoryEntry::LayerMeta {
            label: "Layer Properties".into(),
            frame_id: 1,
            layer_id: 1,
            before: LayerMetaSnapshot {
                name: "Layer 1".into(),
                visible: true,
                locked: false,
                opacity: 100.0,
            },
            after: LayerMetaSnapshot {
                name: "Layer 1".into(),
                visible: false,
                locked: false,
                opacity: 100.0,
            },
        };
        assert_eq!(entry_bytes(&meta), 0);
        let reorder = HistoryEntry::LayerReorder {
            label: "Reorder".into(),
            frame_id: 1,
            layer_id: 1,
            from: 0,
            to: 1,
        };
        assert_eq!(entry_bytes(&reorder), 0);
    }

    #[test]
    fn version_bumps_on_every_mutating_call() {
        let mut h = History::new();
        let v0 = h.version;
        h.push(patch("a", 1));
        assert!(h.version > v0);
        let v1 = h.version;
        h.pop_undo();
        assert!(h.version > v1);
        let v2 = h.version;
        h.pop_redo();
        assert!(h.version > v2);
    }
}

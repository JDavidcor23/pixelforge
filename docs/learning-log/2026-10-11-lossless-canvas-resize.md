# 2026-10-11 — Resizing a sprite without losing its layers

**Area**: sprite editor
**Status**: shipped (TS and Wasm cores)
**Related**: ADR 0008, branch `feat/sprite-studio-v2`

## The problem (one paragraph, no jargon)

Changing the canvas size reused the "replace the whole document" command,
which turns every frame into a single layer. Layer names, visibility, lock,
opacity and each frame's duration were lost. Saving a full "before and after"
copy for undo was not an option either: at 256×256 with 8 layers × 8 frames
one resize fills the whole 32 MiB undo budget.

## What was researched

- **Command pattern with inverse operation** — each action knows how to undo itself.
- **Memento of only the delta** — keep just what is needed to go back, not a full copy.
- **Dirty-rect undo** (ADR 0003) — the project already stores only changed pixels for strokes.
- GIMP keeps only affected tiles in its undo history (https://docs.gimp.org/en/gimp-concepts-undo.html).

## Options and tradeoffs

| Option | Gain | Lose |
|---|---|---|
| Keep `doc.replace` + flatten | Free | All layer structure |
| Full before/after snapshot | Simple code | One resize can erase the undo history |
| Store only the cut strips (chosen) | Growing costs 0 bytes; shrinking costs only the removed area | More logic in two cores |
| Non-destructive canvas | Never loses pixels | Every tool and export must handle offsets |

## Decision and why

A new `doc.resize` command changes every layer in place (top-left anchor,
crop or transparent padding). Undo stores only the strips that were cut.
Because layers keep their ids, the Wasm boundary needs no id remapping.

## Result

- Grow 64→128 on 4 layers × 8 frames: **0 bytes** of undo history (was ~2.6 MB as a snapshot).
- Shrink 128→64 on 4 × 8: **1,572,864 bytes** — exactly the removed area.
- Tests: Rust 107/107, editor 458/458, core 4275/4275. TS ↔ Wasm differential fuzz with `doc.resize`: 0 mismatches.
- Wasm size: 41,537 → 43,411 bytes gzip (budget 153,600).

## Lessons

- An undo entry can be tiny when the operation is deterministic: redo just re-runs it, and undo only needs what the operation destroyed.
- Growing is free because padding destroys nothing.
- Mutating in place (instead of rebuilding) preserves identity for free — ids, metadata and cross-boundary handles all survive.

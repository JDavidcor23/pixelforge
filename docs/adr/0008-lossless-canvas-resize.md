# 0008 — Lossless canvas resize with a cut-strips undo entry

**Status**: Accepted
**Date**: 2026-10-11
**Applies to**: sprite editor (`apps/editor/src/lib/core`), Rust/Wasm core (`packages/core`)

## Context

Sprite Studio v2 lets the user change the canvas size from the top bar
(16 / 32 / 64 / 128 / 256). The only command that can change
`canvasWidth`/`canvasHeight` today is `doc.replace`
(`apps/editor/src/lib/core/commands.ts`, `packages/core/src/document.rs`
`doc_replace`). It was built for AI apply / import and rebuilds the timeline
from scratch: every frame becomes **one** new layer and every frame gets the
same duration. Reusing it for resize (`apps/editor/src/lib/resize-document.ts`)
flattens layers and loses names, visibility, lock, opacity and per-frame
durations.

Numbers (both cores share them):

- History budget: `HISTORY_MAX_ENTRIES = 50`, `HISTORY_MAX_BYTES = 32 MiB`
  (`constants/index.ts` `SPRITE_EDITOR_HISTORY`, `history.rs:14-15`).
- One 256×256 layer buffer = 262,144 bytes. A full before/after snapshot
  costs `2 × layers × frames × 262,144` bytes, so 8 layers × 8 frames at
  256×256 already uses the whole 32 MiB in one entry and evicts every other
  undo step (the newest entry is never evicted, ADR 0003).
- No core-level cap on canvas size, layer count or frame count exists.

## Prior art

| Who | Technique | Result | Source |
|---|---|---|---|
| GIMP | Undo stores only the affected tiles, not the whole image | Bounded undo memory on large images | https://docs.gimp.org/en/gimp-concepts-undo.html |
| Command pattern | Each command knows how to undo itself (inverse operation) | Small, self-contained history entries | https://refactoring.guru/design-patterns/command |
| Memento pattern | Store only the state needed to restore, not a full copy | Smaller snapshots | https://refactoring.guru/design-patterns/memento |
| PixelForge ADR 0003 | Dirty-rect patches instead of full snapshots | 1px stroke on 64×64/8f/4l costs 8 bytes | `docs/adr/0003-dirty-rect-undo-history.md` |

## Options considered

| Option | Gain | Lose | Risk |
|---|---|---|---|
| A. Keep current (`doc.replace` + flatten) | Already works, zero cost | All layer structure and per-frame durations | Owner rejected it |
| B. New `doc.resize`, full before/after snapshot | Simplest to write | One resize can fill the 32 MiB budget and wipe undo history | Large documents lose history |
| C. New `doc.resize`, store only the cut strips | Growing costs 0 bytes; shrinking costs only the removed area; keeps ids and metadata | More logic in both cores and the parity tests | Off-by-one errors on strip geometry (covered by fuzzing) |
| D. Non-destructive canvas (pixels outside bounds hidden) | Nothing is ever lost | Every kernel, export and history path must handle offsets | Very large change for little pixel-art value |

## Decision

- **Chosen: C.** Add a `doc.resize` command (`{ type: 'doc.resize', canvasWidth, canvasHeight, label }`) to both `TsPixelCore` and the Rust `Document`.
- The resize **mutates every existing layer buffer in place**, anchored top-left (crop or pad with transparent pixels, never resample). Frame ids, layer ids, names, visibility, lock, opacity and per-frame durations are untouched, so the Wasm handle maps need no change.
- The history entry (`kind: 'doc.resize'`) stores `fromWidth/fromHeight/toWidth/toHeight` plus, per frame and layer (addressed by stable id), only the **strips that were cut**: the right strip `[toW..fromW) × [0..fromH)` and the bottom strip `[0..min(fromW,toW)) × [toH..fromH)`. Growing produces no strips.
- Undo = resize back to `from` size (padding) and paste the stored strips back. Redo = re-apply the deterministic crop/pad.
- Entry bytes = sum of stored strip bytes, counted in the same 32 MiB budget (`entryBytes` / `entry_bytes`).
- Patterns: **Command pattern with inverse operation**, **Memento of only the delta**, consistent with **dirty-rect undo** (ADR 0003).

## Consequences

- Resizing keeps the full document structure and is one undo step.
- Growing a canvas is free in history; shrinking costs only what was removed.
- Both cores grow by one command; it must join the differential fuzz pool (`wasm-pixel-core.differential.fuzz.test.ts`), the contract suite and the Wasm size budget (< 150 KB gzip, last measured 41,537 bytes).
- `doc.replace` stays as the AI-apply / import command; `resize-document.ts` and `layer-flatten.ts` stop being used for resize.
- The same strip-based inverse applies later to the scene builder (map resize) and to any "crop to selection" feature.

## Performance budget / acceptance

| Metric | Before | Target | Measured after |
|---|---|---|---|
| Layers kept after resize (4 layers × 8 frames) | 1 per frame | 4 per frame, same ids/names/flags | 4 per frame, ids/names/flags kept (tests) |
| History bytes, grow 64→128, 4×8 doc | ~2.6 MB (full snapshot) | 0 bytes | 0 bytes (asserted) |
| History bytes, shrink 128→64, 4×8 doc | ~2.6 MB | ≤ cut area only (~1.5 MB) | 1,572,864 B (asserted) |
| TS ↔ Wasm differential fuzz with `doc.resize` | n/a | 0 mismatches | 0 mismatches (editor suite 458/458 after `pkg/` rebuild) |
| Wasm gzip size | 41,537 B | < 153,600 B | 43,411 B |

Default runtime core is `TsPixelCore` (Wasm only via `pf:core` override or
`VITE_PIXEL_CORE`). `WasmPixelCore` feature-detects `doc_resize` and throws a
clear error if an older `pkg/` is loaded.

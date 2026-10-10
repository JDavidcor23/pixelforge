# 0003 — Dirty-rect patches for undo history, not full snapshots

**Status**: Accepted (phase 2), hardened across phases 2b–2f (judgment-day rounds)

## Context

The original undo implementation stored a full snapshot of every frame after
each action (`pushHistory`). On an 8-frame/4-layer/64×64 document, a single
1px stroke retained the *entire document*, and undo on the very first history
entry was a no-op (no "before" state existed for it).

## Decision

- **D4**: History entries are **dirty-rect patches** — `{ before, after }`
  byte ranges for pixel ops, plus small purpose-built before/after records for
  structural ops (`layer.add/remove/meta/reorder`, `frame.add/remove/paste`).
  `doc.replace` is the one documented exception that keeps a full snapshot
  (a whole-document swap has no smaller representation), itself counted
  toward the same byte budget.
- Budgets: `HISTORY_MAX_ENTRIES = 50`, `HISTORY_MAX_BYTES = 32 MiB`; oldest
  entries are evicted until both hold (never evicting the sole newest entry).
- History entries address frames/layers by **stable id**, never array index
  — addressing by index was the direct cause of a judge-reported bug where a
  later `frame.paste` silently invalidated an earlier entry's position.

## Consequences

- A 1px stroke on a 64×64/8-frame/4-layer document costs **8 bytes** retained
  (measured, `baseline-bench.md`), versus the whole document before this
  change.
- The first dispatched command is now undoable (patches carry their own
  "before" state regardless of stack position — fixing the pre-existing
  first-entry-no-op bug, tracked as "carry-over item A").
- This shape maps directly onto the design's planned Rust `History` struct
  (`design.md`'s Rust surface sketch) — no further transformation needed when
  phase 7 ports it.

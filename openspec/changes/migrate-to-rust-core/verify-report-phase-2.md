# Verification Report — Phase 2 + Phase 2b

**Change**: migrate-to-rust-core
**Scope**: tasks 2.1–2.18, 2b.1–2b.4 (commits 2.15/2b.5 intentionally out of scope)
**Mode**: Standard (Strict TDD disabled)

---

### Completeness

| Metric | Value |
|--------|-------|
| Tasks in scope | 23 (2.1–2.18, 2b.1–2b.4) |
| Complete `[x]` | 23/23 |
| Incomplete | 0 (2.15, 2b.5 are commit tasks, left to user by design — not a gap) |

---

### Build & Tests Execution

**Typecheck** (`pnpm run typecheck` → `tsc --noEmit`): PASSED, no output, exit 0.

**Tests** (`pnpm run test` → `vitest run`):
```
Test Files  18 passed (18)
     Tests  181 passed (181)
  Duration  1.10s
```
0 failed, 0 skipped.

**Bench** (`pnpm run bench` → `vitest bench --run`):
```
renderPixelsToCanvas (putImageData, full 256x256 repaint): mean 0.0777ms, p99 0.4851ms
floodFill (flat Uint8ClampedArray, full 256x256):          mean 2.5486ms, p99 5.2173ms
```
Both consistent with baseline-bench.md's recorded phase-2 numbers (0.0756ms / ~2.71ms) — repaint stays ~54x under the 4ms budget. Undo-memory (8 bytes/entry) verified via `ts-core.test.ts` + `history.undo-memory.baseline.test.ts`, not re-measured live here since it's a plain byteLength assertion, not a bench.

**Coverage**: not configured in this repo — not available, not a blocker.

No build run (not requested; task explicitly scoped typecheck/test/bench only).

---

### Spec Compliance Matrix

| Requirement | Scenario | Test | Result |
|---|---|---|---|
| edit-history: Command-Based Mutation | Mutation via dispatch is observable | `ts-core.test.ts > "one dispatched stroke produces exactly one undo-stack entry"` | ✅ COMPLIANT |
| edit-history: Undo/Redo Correctness | Single undo restores prior state | `ts-core.test.ts > "single undo restores prior state"` | ✅ COMPLIANT |
| edit-history: Undo/Redo Correctness | Redo restores the undone state | `ts-core.test.ts > "redo restores the undone state"` | ✅ COMPLIANT |
| edit-history: Undo/Redo Correctness | Multi-step N-command round-trip | `ts-core.test.ts > "multi-step N-command undo/redo round-trip returns to identical final state"` | ✅ COMPLIANT |
| edit-history: Bounded Undo Memory | 1px stroke stays under 1KB | `ts-core.test.ts > "a single-pixel stroke on a 64x64/8-frame/4-layer document retains under 1KB"` (result: 8 bytes) | ✅ COMPLIANT |
| edit-history: Bounded History Retention | Oldest entries discarded first, recent undo/redo still succeed | `history.test.ts > "evicts the oldest entry once MAX_ENTRIES is exceeded"`, `"...once HISTORY_MAX_BYTES is exceeded"`, `"never evicts the only (newest) entry..."` | ✅ COMPLIANT |
| pixel-core: Local Draft Recovery | Restore runs before autosave | `document-persistence.controller.test.ts` (restore-before-autosave ordering) | ✅ COMPLIANT |
| pixel-core: Local Draft Recovery | Storage unavailable → in-memory + notice | `resolve-document-repository.service.test.ts`, `useDocumentPersistence.hook.ts` catch-path (item 2.17) | ✅ COMPLIANT |
| (carry-over) First entry undoable | First dispatched command is undoable (bug fix, item 2.16) | `history.test.ts > "a single pushed entry can be undone (fixes the phase-0 frozen bug)"` | ✅ COMPLIANT |
| (carry-over) AI doc-replace undo | frame add/remove/doc.replace undoable as one entry | `ts-core.test.ts > "frame.add creates a new frame and is undoable as one entry"`, `"replaces the whole document and is undoable"` | ✅ COMPLIANT |
| (design D3, non-undoable family) | layer/frame-select/selection ops do not create history entries | `ts-core.test.ts > "layer.add appends ... no history entry"`, `"frame.select switches ... no history entry"`, `"selection.commit replaces ... "`, `"region.clear erases only the given rect..."` | ✅ COMPLIANT |
| (design) redo stack cleared on new command | `history.test.ts > "a new push after undo discards the redo branch (classic truncation)"` | ✅ COMPLIANT |

**Compliance summary**: 12/12 scenarios in scope compliant.

---

### Correctness (Static — Structural Evidence)

| Requirement | Status | Notes |
|---|---|---|
| Command union + DispatchResult (2.1) | ✅ Implemented | `lib/core/commands.ts`; scope limited to pre-existing undoable ops, documented deviation |
| Dirty-rect history (2.2) | ✅ Implemented | `lib/core/history.ts`; `HISTORY_MAX_ENTRIES=50`/`HISTORY_MAX_BYTES=32MB` sourced from `constants/index.ts` `SPRITE_EDITOR_HISTORY` — no magic numbers inline |
| `ts-core.ts` dispatch engine (2.3–2.5) | ✅ Implemented | stroke begin/points/end, fill, frame.add/remove, doc.replace, undo/redo, layer/frame/selection non-undoable family — all present |
| `core.slice.ts` / `document-status.slice.ts` (2.6–2.7) | ✅ Implemented | `dispatch`/`undo`/`redo`/`exportDocument`/`importDocument`; `docRevision` bumped exactly once per document-changing dispatch, held flat on no-op dispatches |
| `useCanvasInteraction.hook.ts` stroke emission (2.8) | ✅ Implemented | verified via `rg`: `stroke.begin`→pointerdown, `stroke.points`→pointermove/down, `stroke.end`→pointerup/leave, `fill`→bucket (no begin/end) |
| `useDocumentPersistence`/controller: docRevision trigger (2.9) | ✅ Implemented | `document-persistence.controller.ts` subscribes on `docRevision` change, not reference identity |
| Phase 2b: single document copy (2b.1–2b.2) | ✅ Implemented | `DocSnapshot = {canvasWidth, canvasHeight, timeline}` only; `currentLayers`/`currentActiveLayerId` are reads of `timeline.frames[i]`; `layer.slice.ts`/`timeline.slice.ts`/`selection.slice.ts`/`clipboard.slice.ts` all route writes through `dispatch`; zustand `layers`/`activeLayerId` written only by `core.slice.ts` |
| Rust-surface shape unaffected (2b.3) | ✅ Implemented (no-op) | confirmed `layer.meta`/`region.clear` patches stay plain-data/whole-buffer, matches D6 |

---

### Coherence (Design)

| Decision | Followed? | Notes |
|---|---|---|
| D3 (core owns the document) | ✅ Yes (phase 2b closes the gap phase 2 left) | `design.md`'s own text documents this honestly — phase 2 relocated the duplication, phase 2b removed it |
| D4 (dirty-rect patches + structural snapshots) | ✅ Yes | `history.ts` |
| D6 (flat methods, no serde-shaped payloads) | ✅ Yes | `layer.meta`/`region.clear` payloads are small plain objects, not per-pixel calls |
| Command Undoability split (design.md addendum) | ✅ Yes | matches `commands.ts` header comment 1:1 |

No deviations found beyond the ones design.md/tasks.md already self-documents.

---

### Code Standards

| Check | Result |
|---|---|
| No `any` in changed files (`lib/core/*`, `services/*`, `hooks/*`, touched slices) | ✅ Pass (only false positives in prose comments: "any pending", "any point") |
| No `console.log` | ✅ Pass (only `console.error` in catch paths, per rules) |
| No magic values for history limits | ✅ Pass (`SPRITE_EDITOR_HISTORY.MAX_ENTRIES`/`MAX_BYTES` in `constants/index.ts`) |
| Zustand granular selectors | ✅ Pass (`useDispatch = () => useSpriteEditorStore((s) => s.dispatch)`) |
| Store consumed via hooks, not JSX directly | ✅ Pass (checked `useCanvasInteraction.hook.ts`) |
| Component = JSX only / logic in hooks | ✅ Pass — no component files touched in this phase |

---

### Issues Found

**CRITICAL**: None.

**WARNING**:
1. Hybrid persistence gap — `sdd/migrate-to-rust-core/apply-progress` in Engram (obs #666) only covers Phase 0+1; no Phase 2/2b update was pushed to Engram (hybrid mode requires both backends). `tasks.md` itself carries very thorough inline deviation notes so nothing is lost, but the Engram copy is now stale and will mislead a future session that trusts it over `tasks.md`. Recommend upserting `sdd/migrate-to-rust-core/apply-progress` with the Phase 2/2b summary before archive.

**SUGGESTION**:
1. `lib/core/ts-core.ts`'s `DispatchResult.changed` is `false` for `stroke.end` even though a history entry was pushed (only `stroke.points` bumps `revision`/`changed`). This is correct today (document pixels don't change again at `stroke.end`), but it's a subtle enough invariant that a one-line comment at the `stroke.end` case itself (not just the file header) would save the next reader from re-deriving it.
2. No coverage tool configured — fine for now, but phase 4+'s parity/bench work will want per-file coverage once `packages/core` lands, per the design's own Testing Strategy table.

---

### Verdict

**PASS**

Phase 2 and 2b are complete, typecheck/test/bench all green, every in-scope edit-history and pixel-core (persistence-adjacent) spec scenario has a passing test behind it, and the phase 2b deviation cleanup (single source of truth for `timeline.frames[i].layers`) was verified in code, not just claimed. One WARNING (stale Engram apply-progress) should be fixed before archive; nothing blocks proceeding to Phase 3.

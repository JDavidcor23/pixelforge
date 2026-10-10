# Verify Report — migrate-to-rust-core

## Phase 0

**Change**: migrate-to-rust-core
**Scope**: tasks 0.1–0.6 (0.7 commit intentionally excluded — commits forbidden by user)
**Mode**: Standard (Strict TDD disabled)
**Date**: 2026-10-09

---

### Completeness

| Metric | Value |
|--------|-------|
| Tasks in scope | 6 (0.1–0.6) |
| Tasks complete | 6 |
| Tasks incomplete | 0 (0.7 is out of scope by design) |

All of 0.1–0.6 are checked `[x]` in `tasks.md` and match the actual diff/untracked files.

---

### Build & Tests Execution

**Typecheck**: ✅ Passed — `pnpm run typecheck` (`tsc --noEmit`) exits 0, no output.

**Tests**: ✅ 131 passed / 0 failed / 0 skipped — `pnpm run test` (`vitest run`), 13 files, 791ms.

No build was run per orchestrator instruction.

**Coverage**: ➖ Not available (no coverage tool configured — out of scope for Phase 0).

---

### Spec Compliance Matrix (Phase 0 exit criteria)

No `openspec/specs/` directory exists yet (proposal.md confirms: "Modified Capabilities: None — no openspec/specs/ exist yet"). Phase 0 predates the spec-authoring phase for `pixel-core`/`edit-history`/`workspace-build`; only `core-parity-gate`'s two gate-level scenarios apply at this stage, taken from proposal.md/tasks.md as the spec-equivalent source.

| Requirement | Scenario | Evidence | Result |
|---|---|---|---|
| core-parity-gate | Baseline exists before a port starts | `baseline-bench.md` records repaint/flood-fill/undo-memory numbers; `history.undo-memory.baseline.test.ts` passes, asserting the exact byte formula | ✅ COMPLIANT |
| core-parity-gate | CI Enforces Tests, Benchmarks, and Drift Check (test+bench+typecheck part; drift check is phase-4 scope) | `.github/workflows/ci.yml` runs typecheck → test → bench on PR/push; all 3 scripts exist and pass locally | ✅ COMPLIANT (drift-check half N/A until phase 4) |

**Compliance summary**: 2/2 in-scope scenarios compliant.

---

### Correctness (Static — Structural Evidence)

| Item | Status | Notes |
|---|---|---|
| `test`/`bench`/`typecheck` scripts (0.1) | ✅ Implemented | Verified in `package.json` |
| `benchmark` config in vitest.config.ts (0.2) | ✅ Implemented | `include: ['**/*.bench.ts']`, `outputJson` set |
| Characterization tests for pixel-buffer/flood-fill/history/undo (0.3) | ✅ Implemented | 4 files, all describe CURRENT behavior with explicit "characterization, not aspirational" comments; includes the frozen `historyIndex<=0` undo no-op gotcha |
| Baseline bench: repaint, flood-fill, undo-memory (0.4) | ✅ Implemented | `canvas-renderer.bench.ts`, `flood-fill.bench.ts`, `history.undo-memory.baseline.test.ts`; numbers committed in `baseline-bench.md` |
| AGENTS.md stack versions (0.5) | ✅ Implemented | "Next.js 14" → "Next.js 16.2.3" + added "React 19.2.4"; matches `package.json` deps (`next: 16.2.3`, `react: 19.2.4`) exactly |
| `.github/workflows/ci.yml` (0.6) | ⚠️ Implemented with a gap | Runs test/bench/typecheck as required, but see CRITICAL below (pnpm version resolution) |

---

### Characterization Test Review

Confirmed these describe **current** behavior, not aspirational/future behavior:
- `pixel-buffer.test.ts`: documents today's `RgbaColor[][]` object-per-pixel model, row-major `buffer[y][x]` indexing, copy-on-write `setPixelInBuffer`.
- `flood-fill.test.ts`: documents today's BFS, 4-directional only, same-color no-op returning the *same* reference.
- `history.test.ts` / `history.slice.test.ts`: documents today's full-snapshot duplication (`layers` + `timeline.frames[i].layers` both cloned) and the `historyIndex<=0` undo-no-op gotcha — explicitly frozen, not fixed, consistent with "don't fix pre-existing bugs in Phase 0."
- `history.undo-memory.baseline.test.ts`: pure measurement, asserts the byte formula and that it exceeds the phase-2 1KB target — correctly framed as a baseline, not a pass/fail gate on the target.

No aspirational assertions (e.g., asserting flat-buffer or dispatch-based behavior) found in any Phase 0 test file.

---

### Coherence (Design)

| Decision | Followed? | Notes |
|---|---|---|
| Phase 0 File Changes table (design.md) | ✅ Yes | `package.json`, `*.test.ts` for the 4 named areas, `vitest.config.ts`, `.github/workflows/ci.yml`, `AGENTS.md` all present and match |
| "Absolute times are noisy on CI, compare ratios" framing (design.md) | ✅ Yes | `baseline-bench.md` explicitly states this and defers ratio comparison to phase 4's `scripts/check-bench.ts` |

---

### Issues Found

**CRITICAL** (must fix before archive):
- None remaining. One was found and fixed during this verification (see "Fixes Applied").

**WARNING** (should fix):
- None.

**SUGGESTION** (nice to have):
- `history.slice.test.ts` and the bench files define scenario constants (`CANVAS_SIZE`, `FRAME_COUNT`, `LAYER_COUNT`, `SIZE`) locally rather than importing from `src/constants/`. Acceptable for test/bench-local fixtures (not production code paths the "no magic values" rule targets), but if phase 2's dirty-rect budget constants (`HISTORY_MAX_ENTRIES`, `HISTORY_MAX_BYTES`) get introduced in `src/constants/`, consider having the Phase 0 baseline test import the same reference scenario constants to keep the two numbers mechanically linked instead of by comment reference only.
- `lint` is not part of the CI gate (by design, per tasks.md scope) — pre-existing lint errors in `sprites/features/canvas/hooks/useCanvasInteraction.hook.ts` (noted in apply-progress) remain unaddressed; out of Phase 0 scope but worth flagging for Phase 1 since that file is explicitly in Phase 1's touch list.

---

### Fixes Applied

- **CRITICAL (fixed)**: `.github/workflows/ci.yml` used `pnpm/action-setup@v4` with neither a `version` input nor a `packageManager` field in `package.json`. `action-setup@v4` requires one of the two to resolve which pnpm to install, and fails the job outright (`Unable to determine pnpm version to install...`) when both are absent — this would have made task 0.6's own exit criterion ("CI green on a no-op PR") fail on the very first run. Fixed by adding `"packageManager": "pnpm@10.6.5"` to `package.json` (pinned to the pnpm version used to produce the committed `pnpm-lock.yaml`, `lockfileVersion: '9.0'`, compatible with pnpm 9.x/10.x). Verified `package.json` is still valid JSON after the edit; re-ran `typecheck` and `test` — both still pass (this field doesn't affect either).

---

### Verdict

**PASS**

Phase 0 is complete, correct, and behaviorally verified: typecheck clean, 131/131 tests green, baseline numbers recorded and match the formula they claim, AGENTS.md versions match package.json exactly, and characterization tests genuinely freeze current (not aspirational) behavior. One CI-breaking gap (`pnpm/action-setup` version resolution) was found and fixed in place since it was a one-line, mechanical, trivial fix. Safe to proceed to Phase 1 once the user commits 0.7.

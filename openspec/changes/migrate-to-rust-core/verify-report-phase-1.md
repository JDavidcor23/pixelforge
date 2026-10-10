# Verify Report — migrate-to-rust-core

## Phase 1

**Change**: migrate-to-rust-core
**Scope**: tasks 1.1–1.25 (1.26 commit intentionally excluded — no commits from this phase)
**Mode**: Standard (Strict TDD disabled)
**Date**: 2026-10-09

---

### Completeness

| Metric | Value |
|--------|-------|
| Tasks in scope | 25 (1.1–1.25) |
| Tasks complete | 25 |
| Tasks incomplete | 0 (1.26 commit is out of scope by design) |

All of 1.1–1.25 are checked `[x]` in `tasks.md` and match the actual diff/untracked files.

---

### Build & Tests Execution

**Typecheck**: PASSED — `pnpm run typecheck` (`tsc --noEmit`) exits 0, no output.

**Tests**: PASSED — 155/155 tests, 18 files, `pnpm run test` (`vitest run`), 0 failed, 0 skipped.

**Bench**: PASSED — `pnpm run bench`:
- `renderPixelGrid` (full 256x256 repaint): mean 1.07ms (phase-0 baseline 4.20ms) → well under the 4ms budget, ~3.9x gain this run (task 1.11 recorded 5.58x on an earlier run; both comfortably clear the gate — bench variance is expected and the exit criterion is the ratio, not a pinned number).
- `floodFill`: mean 2.58ms vs 50.36ms baseline (~19.5x) — not a phase 1 gate, reference for phase 5.

No build was run (not required for this phase; no builds per CLAUDE.md).

**Coverage**: Not available (no coverage tool configured).

---

### Spec Compliance Matrix (pixel-core, phase 1 scope)

| Requirement | Scenario | Test | Result |
|---|---|---|---|
| Implementation-Agnostic Pixel Operations | Pixel write is readable back | `pixel-buffer.test.ts` | COMPLIANT |
| Full Canvas Repaint Performance | Repaint budget met (<4ms) | `canvas-renderer.bench.ts` | COMPLIANT |
| Local Draft Recovery | Draft restored after reload (byte-identical) | `document-repository.contract.test.ts` ("byte-equal Uint8Array") + `document-payload.test.ts` | COMPLIANT |
| Local Draft Recovery | Restore runs before autosave | `document-persistence.controller.test.ts` ("never calls save() for a store mutation that happened before restore finished") | COMPLIANT |
| Local Draft Recovery | Legacy localStorage draft is migrated once | `legacy-draft-migration.service.test.ts` ("converts RgbaColor[][] to a flat-buffer StoredDocument and saves it once", "removes the legacy key ONLY AFTER save() resolves") | COMPLIANT |
| Local Draft Recovery | Storage unavailable | `resolve-document-repository.service.test.ts` ("falls back to an in-memory repository when IndexedDB fails to open") | COMPLIANT |

**Compliance summary**: 6/6 in-scope scenarios compliant (flood-fill/quantize/downscale parity scenarios are phases 5–6 scope, not phase 1).

---

### Correctness — Focus Areas (static + behavioral)

**1. Stray `RgbaColor[][]`/`pixels[y][x]` consumers** — Searched all of `src` (`rg "RgbaColor\[\]\[\]|pixels\[y\]\[x\]|RgbaColor\[\]"`). Every remaining hit is either: a single-pixel `RgbaColor` (palette entries, primary/secondary color — correctly still object-shaped, never a buffer), a doc comment referencing the *old* shape, or the legacy migration path (`legacy-draft-migration.service.ts`, `pixel-codec.ts`) which must speak `RgbaColor[][]` by definition to read old localStorage data. **No live buffer consumer still uses the nested-array shape.** Clean.

**2. docStatus gate** — `startDocumentPersistence` (`services/document-persistence.controller.ts`) does `resolveRepository → migrateLegacyDraft → load → setState({docStatus:'ready'}) → THEN store.subscribe(...)`. The autosave subscription is created strictly *after* `ready`, so it is structurally impossible for a store mutation during restore to trigger a save (verified by a passing test that mutates mid-resolve and asserts `save` was never called). Legacy migration deletes the localStorage key only after `repository.save()` resolves (explicit test: `keeps the legacy key when save() fails, so the next load retries`). Migration channel mapping verified byte-exact (`RED {255,0,0,255}` → `Uint8Array([255,0,0,255])`).
 - WARNING found here — see Issues.

**3. IndexedDB adapter** — `indexeddb-document.repository.service.ts` uses `idb`'s typed `DBSchema` (no `any`), a single shared `openDB` promise reused across calls (no races with `upgrade`), and stores `StoredDocument` (with nested `Uint8Array` layer data) directly via structured clone — no base64/JSON encoding of pixel bytes anywhere in the path. Contract test (`document-repository.contract.test.ts`) runs the identical suite against IndexedDB (`fake-indexeddb/auto`) and InMemory, asserting byte-equal round-trip, revision increments, overwrite-by-id, and `null` for a missing id. Clean.

**4. Renderer correctness** — `lib/buffer-to-canvas.ts`: `imageSmoothingEnabled = false` set on every offscreen context; `canvas-renderer.ts`'s `renderLayers` also sets it on the main context before each `drawImage` and restores `globalAlpha = 1` after every layer (loop-scoped, so it can't leak into the next layer or caller). Channel order preserved end-to-end (verified `putPixel`/`getPixel`/`ImageData` all use r,g,b,a in that order, matching `ImageData`'s expected layout).
 - One real gap: `renderPixelsToCanvas` allocates a brand-new `document.createElement('canvas')` + `ImageData` on **every call**, with no reuse. In the Konva path (`SpriteLayers.tsx`, `SelectionOverlay.tsx`) this is memoized with `useMemo` keyed on `layer.pixels`/`selection`, so it only re-allocates when pixel data actually changes — fine. In `lib/canvas-renderer.ts`'s `renderLayers`/`renderPixelGrid`, there is no memoization, so a live caller would reallocate one canvas per layer per repaint. However: I confirmed (and apply-progress had already flagged) that `renderPixelGrid`'s only call chain — `useCanvasRenderer.hook.ts` via `useCanvasArea.hook.ts` — is **dead code**; nothing imports `useCanvasArea.hook.ts` (the app renders through the Konva `CanvasArea.tsx` instead). So this isn't a live perf bug today, but it's pre-existing dead code that was carried forward (rewritten, tested, benched) rather than removed. See Issues/Suggestions.

**5. Project standards** — `SpriteEditorLayout.tsx` diff is JSX-only (two new hook calls, conditional rendering, no inline logic); `useDocStatus` is a granular selector (`s => s.docStatus`); store is read only through hooks, never directly in JSX; no `console.log`/`console.warn` anywhere in the new code (`console.error` only, in `resolveDocumentRepository`'s catch); no `any` found in any new service/hook/type file; constants (`LOCAL_DRAFT_DOCUMENT_ID`, `DOCUMENT_AUTOSAVE_DEBOUNCE_MS`, `DOCUMENT_SCHEMA_VERSION`, `DOCUMENT_DB_NAME/VERSION/STORE_NAME`, `LEGACY_SPRITE_EDITOR_STORAGE_KEY`) all live in `constants/persistence.ts`, UPPER_SNAKE_CASE; `partialize` in `stores/index.ts` reduced to exactly `primaryColor`/`secondaryColor` per design D8. Clean.

**6. Behavior unchanged vs phase 0 characterization tests** — `pixel-buffer.test.ts`, `flood-fill.test.ts`, `history.test.ts`, `quantize.test.ts`, `downscale.test.ts`, `stores/layers.test.ts`, `stores/slices/history.slice.test.ts` were all updated to the flat-buffer shape and still pass (155/155), preserving the same observable pixel in/out behavior frozen in phase 0 (same BFS order, same COW semantics, same frozen `historyIndex<=0` undo no-op left untouched for phase 2). Clean.

---

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| D1 buffer shape `{w,h,data:Uint8ClampedArray}` | Yes | |
| D2 COW per batch | Yes | `setPixelsInBuffer` clones once per batch, confirmed in `pixel-buffer.ts` |
| D8/D12 IndexedDB local-first, Zustand persist pared to prefs only | Yes | |
| D13 `idb`, typed `DBSchema`, no base64 | Yes | |
| D14 persistence lands in phase 1 together with the flat buffer | Yes | |
| File Changes table (design.md, phase-1 row) | Yes | Every named file present; `DocumentPayload` deviation (kept per-frame `activeLayerId`) is documented in-code and in tasks.md as an intentional, justified deviation — correct call, the spec's "Draft restored after reload" scenario requires faithful frame restore |

---

### Issues Found

**CRITICAL** (must fix before archive):
- None.

**WARNING** (should fix):
- `startDocumentPersistence()` (and the migration `save()` inside it) has no top-level error handling beyond `resolveDocumentRepository`'s own try/catch around the IndexedDB *open*. If `migrateLegacyDraft`'s `repository.save()` rejects for any other reason (e.g. `QuotaExceededError` mid-migration), the whole promise chain rejects; `useDocumentPersistence.hook.ts`'s `.then(...)` has no `.catch(...)`, so `docStatus` never reaches `'ready'` and the user is stuck on "Restoring your draft…" indefinitely with only an unhandled-rejection console error, no user-facing notice. This is a real gap in the "restore failure path" the task brief asked about — it's exercised correctly by the unit test (`migrateLegacyDraft` rejecting is proven, and the legacy key is correctly preserved for retry), but nothing above it turns that rejection into a recoverable UI state. Recommend: wrap the `startDocumentPersistence(...).then(...)` in the hook with a `.catch()` that still sets a terminal/error `docStatus` (or falls back to in-memory + notice) instead of leaving the UI hung.

**SUGGESTION** (nice to have):
- `lib/canvas-renderer.ts`'s `renderLayers`/`renderPixelGrid` allocates a new offscreen canvas per layer per call with no memoization (unlike the Konva path, which memoizes via `useMemo`). Currently harmless because this call chain (`useCanvasArea.hook.ts` → `useCanvasRenderer.hook.ts`) is dead code (confirmed via `rg`: nothing imports `useCanvasArea.hook.ts`), first flagged in phase-1 apply-progress as out-of-scope. Since this phase touched and re-benched this file anyway, consider either deleting the dead `canvas-renderer.ts`/`useCanvasRenderer.hook.ts`/`useCanvasArea.hook.ts` chain in a cleanup task, or adding the same reuse/memoization it would need if it's ever revived.
- Bench numbers are inherently noisy run-to-run (932hz/1.07ms this run vs the 0.75ms recorded in tasks.md) — both comfortably clear the 4ms budget and the required ratio gain, so this is not a gate failure, just a note that CI should compare ratios (as design.md already specifies for phase 4's `scripts/check-bench.ts`), not pinned absolute numbers.

---

### Verdict

**PASS**

Phase 1 is complete, correct, and behaviorally verified: typecheck clean, 155/155 tests green, bench clears the 4ms repaint budget by a wide margin, no stray `RgbaColor[][]` consumers remain, the docStatus gate structurally prevents autosave-before-restore, the IndexedDB adapter stores binary natively with a passing byte-equal contract suite, and the legacy migration is proven idempotent and crash-safe (key removed only after save resolves). One WARNING (no top-level catch on the persistence-startup promise, so a mid-migration save failure hangs the UI on "Restoring your draft…" instead of degrading gracefully) should be fixed before this is fully production-hardened, but it does not block proceeding to Phase 2. One SUGGESTION flags pre-existing dead code (`canvas-renderer.ts`'s live call chain) that was carried forward rather than removed.

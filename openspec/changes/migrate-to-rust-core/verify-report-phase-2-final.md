# Verify Report — Phase 2 (final, after 2c/2d/2e) — Judge A, round 3

**Change**: migrate-to-rust-core
**Scope**: tasks.md sections 2, 2b, 2c, 2d, 2e; design.md "Command Undoability", "Phase 2d revision", "Phase 2e revision"
**Mode**: Standard (Strict TDD disabled)
**Role**: blind Judge A (round 3), read-only for source

---

## Execution evidence

| Command | Result |
|---|---|
| `pnpm run typecheck` | ✅ exit 0, no errors |
| `pnpm run test` | ✅ 224/224 tests passed, 22 test files, 1.63s |
| `pnpm run bench` | ✅ repaint mean **0.0892ms** (budget <4ms); flood-fill mean **2.93ms** |

Undo-memory metric (<1KB for a 1px stroke, 64x64/8-frame/4-layer) is asserted by `lib/core/ts-core.test.ts` / `lib/history.undo-memory.baseline.test.ts` (not re-measured independently this round; code path unchanged since 2e.8's confirmation).

## Completeness

All checklist items in tasks.md sections 2/2b/2c/2d/2e are checked `[x]` except the "Commit: ..." items at the end of each sub-phase, which are explicitly left unchecked per repo policy ("No build commands/commits unless the user asks") — not a gap.

## Spec compliance (edit-history, pixel-core)

- **Command-Based Mutation**: every document mutation routes through `dispatch()` (`lib/core/ts-core.ts`). Confirmed — no direct `set({layers})` writes remain in `layer.slice.ts`/`timeline.slice.ts`/`selection.slice.ts`/`clipboard.slice.ts`/`compound.slice.ts`.
- **Undo/Redo Correctness**: `ts-core.test.ts`, `ts-core.judgment-day.test.ts`, `ts-core.judgment-day-round2.test.ts` cover single/redo/multi-step round-trips, including the structural-entry and patch-entry paths. Passing.
- **Bounded Undo Memory / Retention**: `history.ts`'s `entryBytes`/`pushEntry` gives `layer.meta`/`layer.reorder` ~0 bytes, `layer.add/remove`/`frame.add/remove`/`frame.paste` only the affected record (not the whole document) — verified by reading `history.ts:165-187` and `ts-core.judgment-day-round2.test.ts` ("finding 4").
- **Pixel-core / Local Draft Recovery**: `document-persistence.controller.ts` correctly gates autosave subscription behind `docStatus==='ready'`, flushes on `stop()`, and the `isCancelled` checkpoints prevent a StrictMode double-start from touching real storage twice. Verified by reading the file end-to-end; matches its own tests.

## Adversarial findings (this round)

### WARNING (real, reproduced, narrow blast radius)

**`DispatchResult.contentChanged`/`contentRevision` are NOT refreshed on a dispatch that force-commits an open stroke but whose OWN command is a no-op (or is `stroke.begin` re-opening an already-open stroke).**

- File: `src/app/editor/lib/core/ts-core.ts:507-543` (`dispatchCommand`), specifically the early-return branch at line 516-521:
  ```ts
  if (!switchOutcome.result.changed) {
    return {
      state: switchOutcome.state,
      result: buildResult(switchOutcome.state, false, false, historyChanged, switchOutcome.result.dirty),
    }
  }
  ```
  `contentChanged` is hardcoded to `false` here regardless of `historyChanged`. The content-revision bump logic (`next.contentRevision = (next.contentRevision ?? 0) + 1`, line 524-527) lives entirely in the branch AFTER this early return, so it is skipped whenever the *current* command's own switch result is `changed:false` — even if that same dispatch just force-committed a real, history-pushing stroke via `STROKE_COMMIT_COMMANDS` (wrapper-level pre-commit, lines 508-511) or via `stroke.begin`'s own internal re-open commit (ts-core.ts:548-549, `endOpenStroke` inside the switch case itself, which is NOT covered by the wrapper's `STROKE_COMMIT_COMMANDS` set since `'stroke.begin'` isn't in it).

- **How confirmed**: reproduced directly against `ts-core.ts` with a throwaway test (`scratchpad/judgeA3/repro-strokebegin-contentrevision.test.ts`, run via `pnpm exec vitest run --config vitest.config.ts --root <scratch>`). Sequence: `stroke.begin` → `stroke.points` (writes 1px, confirms `contentRevision` bumps to 1) → `stroke.begin` again on the same layer *without* an intervening `stroke.end` (the exact "stroke.begin while a stroke is already open" recovery path `ts-core.ts:548` exists for). Result of the second `stroke.begin` call:
  ```json
  {"changed":false,"contentChanged":false,"historyChanged":true,"canUndo":true,"canRedo":false,"strokeOpen":true,"revision":2,"contentRevision":1,"dirty":[]}
  ```
  `historyChanged:true` and `canUndo:true` correctly reflect that a real patch entry was just pushed (confirms the task's specific "canUndo refresh" concern is fine), but `contentChanged` is `false` and `contentRevision` stayed at `1` (unchanged) despite a genuine document-content commit.

- **Is this reachable from the UI?** Yes — `useCanvasInteraction.hook.ts:191-194` dispatches `stroke.begin` unconditionally on every `pointerdown` for pencil/eraser, with no guard against an already-open stroke (a dropped `pointerup`/`pointercancel` event, e.g. from a second pointer or lost capture, can leave a stroke open when the next `pointerdown` fires).

- **Why it's WARNING and not CRITICAL**: in every path I could construct, by the time a stroke has any real content to force-commit, it must already have had at least one successful `stroke.points` dispatch — and `stroke.points` itself always takes the main (non-early-return) path when it writes anything, correctly bumping `contentRevision` at that time. So the content was already flagged dirty before the force-commit happens; `core.slice.ts`'s `dispatch()` (`docRevision: result.contentRevision`) ends up writing the *same* already-correct value, not a stale one. No observed autosave data-loss in the current call graph. This is a contract violation of phase 2e's own stated goal ("every field the store or any future consumer needs is computed HERE by the core, never by the caller re-deriving it") rather than a confirmed data-loss bug — but it is fragile: any FUTURE caller that reacts only to a single `dispatch()` return value (rather than the store's reactive `docRevision` subscription) would miss this content change, and the same early-return shape affects every command in `STROKE_COMMIT_COMMANDS` whenever that command's own effect happens to be a no-op (e.g. `layer.meta` with a redundant patch) while a real stroke is open.

- **Suggested fix** (not applied — read-only): compute `historyChanged` before the early-return check and OR it into `contentChanged` there too, e.g. `buildResult(switchOutcome.state, false, historyChanged, historyChanged, ...)`, or simply drop the early-return special case and let the normal `contentChanged = !NON_CONTENT_COMMANDS.has(cmd.type) || historyChanged` computation run unconditionally.

### Verified correct (no issues found) — per the requested adversarial checklist

- **`layerRevisions` bump correctness**: every pixel-changing path (`stroke.points`, `stroke.end`/`endOpenStroke`, `fill`, `selection.commit`, `region.clear`) returns a precise `dirty` rect that the wrapper (`ts-core.ts:529-540`) turns into a per-layer bump. Structural ops with no natural "rect" (`frame.add/remove`, `doc.replace`, `layer.add/remove/meta/reorder`, `undo`/`redo` of a structural entry) conservatively bump ALL layers of the post-dispatch current frame — safe (never stale), just not minimal. Onion-skin rendering (`SpriteLayers.tsx:79-99`) reads the same global `layerRevisions` map by stable layer id; since a layer's pixels can only change while its frame is current (dispatch always operates on `currentLayers`), a previous-frame layer's last-recorded revision is never stale when later shown as onion skin — traced through, no bug.
- **`DispatchResult.canUndo`/`canRedo`/`strokeOpen`**: always computed fresh from `state` in `buildResult` (`ts-core.ts:487-505`), independent of the `changed`/`contentChanged` branch — confirmed correct even in the buggy early-return path above.
- **Packed `u32` color round-trip**: `color-codec.ts`'s `packRgba`/`unpackRgba` — R highest byte, A lowest, `& 0xff` masking plus `>>> 0` on pack, `>>> shift & 0xff` on unpack. Round-trips exactly for any `0-255` RGBA tuple; no sign-extension bug (confirmed by reading the arithmetic, consistent with existing `color-codec` usage in `ts-core.ts`'s `stroke.points`/`fill`).
- **`Int32Array` stroke batches, odd length / out-of-bounds**: `ts-core.ts:577-588` loops `i += 2`; an odd-length array leaves a trailing `y = points[i+1] = undefined`, and `isInBounds(buffer, x, undefined)` (`pixel-buffer.ts:71-73`, `undefined >= 0` is `false`) safely rejects it — no crash, no corruption, consistent with "packPoints always produces even-length arrays" being an unenforced-but-harmless invariant.
- **`selection.commit` rect partially/fully outside canvas**: `ts-core.ts:908-913` validates `w/h > 0`, full in-bounds (`x+w<=layer.pixels.w`, `y+h<=layer.pixels.h`), and `pixels.byteLength === w*h*4` before touching anything — a partially-out-of-range rect is a clean no-op, never a throw or an out-of-bounds write.
- **`frame.paste` deep copy + fresh ids**: `serializedFrameToFrame` (`ts-core.ts:427-444`) always generates a fresh frame id and fresh layer ids via `nextId`, and `new Uint8ClampedArray(l.data)` copies bytes (never aliases the caller's buffer) — confirmed by reading the code; matches `ts-core.judgment-day-round2.test.ts` ("finding 6").
- **`doc.replace` copying**: `cloneBuffer(f.pixels)` on every incoming frame (`ts-core.ts:714`) — no aliasing of caller-owned buffers.
- **Core bootstrapping without `syncCore`**: `core.slice.ts`'s `ensureCore()` lazily bootstraps exactly once from `get()`'s initial state; `importDocument` unconditionally rebuilds `core` from scratch regardless of whether a prior bootstrap/dispatch already happened, so a stray early `dispatch()` before restore completes cannot permanently corrupt the restored document — traced through `useDocumentPersistence.hook.ts` → `document-persistence.controller.ts`'s restore-before-autosave ordering; no path found where a pre-restore dispatch's throwaway `core` instance survives past `importDocument`.
- **Boundary validation never throws**: walked every `Command` case in `dispatchCommandSwitch` (`ts-core.ts`) — unknown/out-of-range ids, indices and rects are consistently `noChange(state)` (a no-op), never a thrown exception; confirmed for `layer.setActive`, `frame.select`, `frame.remove`, `layer.remove/reorder/meta`, `frame.paste`'s clamped `at`, `selection.commit`'s rect, `timeline.setFrameSelection`'s indices.

### SUGGESTION (nice-to-have, not a defect)

- `src/app/editor/lib/core/core-config.ts:54` calls `console.error` outside a `catch` block (an `if (impl === 'wasm')` branch). The project rule is "no `console.log` — only `console.error` in catch blocks", but design.md explicitly specifies this exact log ("Wasm init failure falls back to TS and logs with `console.error`") as an intentional, designed behavior, not an oversight — recommend either a documented rule exception or moving the check into the one call site that would `try/catch` a real Wasm init failure once phase 4 lands.
- Structural-command `layerRevisions` bumps (layer CRUD, undo/redo of a structural entry) touch ALL current-frame layers rather than only the one actually added/removed/reordered — harmless (Konva just recomputes a few extra offscreen canvases per structural op), but not "minimal" per the design's stated intent; low priority given these ops are rare relative to pixel edits.

## Coherence (design.md)

- "Command Undoability" (phase 2c/2d/2e revisions): implementation matches the documented undoable/non-undoable split exactly — cross-checked `STROKE_COMMIT_COMMANDS`/`NON_CONTENT_COMMANDS` sets in `ts-core.ts` against design.md's lists; identical.
- "Phase 2d revision" (structural history memory, undo/redo focus, mid-stroke commands, autosave split, render contract, paste ids, validation): all present and traced to code as described.
- "Phase 2e revision" (`syncCore` removed, explicit `DispatchResult`, serializable command payloads, `PixelCore`/`TsPixelCore`, boundary validation, contract test suite): all present. The one documented, intentional deviation (`core.slice.ts` not yet routed through `PixelCore`/`TsPixelCore`) is called out in both design.md and the code's own comments — consistent, not silently dropped.

## Project rules

No `any` found in the touched core/persistence files (`rg ": any|<any>|as any"` — zero real hits, only comment text containing the word "any"). No un-granular `useSpriteEditorStore()` calls found. Magic values in the reviewed files route through named constants (`SPRITE_EDITOR_HISTORY`, `TRANSPARENT_COLOR`, `MS_PER_SECOND`, etc.).

## Verdict

**PASS WITH WARNINGS.** Typecheck/tests/bench all green (224/224, repaint 0.089ms, flood-fill 2.93ms — well within phase-2 budgets). One real-but-masked `DispatchResult.contentChanged`/`contentRevision` staleness bug found on the stroke-reopen/no-op-force-commit path (reproduced, not currently causing observed autosave data loss due to an unenforced upstream invariant) — recommend fixing before phase 3, since phase 3+ consumers (or a future Wasm core with different timing) may not share that invariant. No CRITICAL issues found.

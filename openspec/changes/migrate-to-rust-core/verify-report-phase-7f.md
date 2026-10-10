# Fix-Agent Report — Phase 7f (migrate-to-rust-core)

**Change**: migrate-to-rust-core
**Phase**: 7f (fix-agent pass against `verify-report-phase-7.md` (Judge A) + judges' A7/B7 repro material)
**Base commit**: `39ced9f` (phase 7, uncommitted working tree on top)
**Mode**: Standard (Strict TDD disabled)
**Status**: PARTIAL-GREEN — CRITICAL #1 and #2 fully fixed and tested; WARNING items #5 and #6 partially fixed; WARNING #3, #4, #7, #8 not reached (stopped at a coherent green point per the given priority order).

---

## Executive summary

The orchestrator's two CRITICAL findings were both confirmed real and fixed. (1) The `pf:core`/`VITE_PIXEL_CORE=wasm` flag never actually activated in any session — `core.slice.ts`'s lazily-memoized core always bootstrapped before the background Wasm module load could finish, so `resolveCore()` always got `null` back and silently stayed on `TsPixelCore` forever. Fixed by awaiting a new `waitForWasmModule()` inside the existing `docStatus: 'loading'` startup gate, only on the `'wasm'` path — the `'ts'` default is untouched. (2) A real trap (reproduced with a new test-only `debug_force_trap` export — a genuine Rust panic, not a simulated error) leaves the Wasm object's wasm-bindgen borrow flag stuck forever, so every call after the first — including the trapped core's own `exportDocument()`, which phase 7's recovery design called — throws a plain `Error`, never another `RuntimeError`. Rewrote `TrapSafePixelCore` to treat any exception as poison and recover from the caller's own last-good state instead of calling back into the dead object. Both fixes are proven end-to-end against the real built `.wasm`, not a mock, in `stores/slices/core.slice.real-trap.test.ts`. Also fixed, partially: an unchecked overflow in `Document::new` (WARNING #1/#5) and a confirmed ~1MB-per-call memory leak in `WasmPixelCore.importDocument` (WARNING #6). WARNING #3 (NUL-name wire corruption, confirmed real via re-running the judges' repro but not fixed), #4, #7 (store-loop performance — the single highest-priority remaining item), the rest of #5, the rest of #6, and #8 were not reached this session.

---

## Per-finding table

| # | Finding | Severity | Status | Where |
|---|---|---|---|---|
| 1 | Flag is dead — `core` bootstraps before the Wasm module loads | CRITICAL | **FIXED** | `document-persistence.controller.ts`, `wasm-pixel-core-resolver.ts` (`waitForWasmModule`) |
| 2 | Trap bricks the core, including its own recovery path | CRITICAL | **FIXED** | `wasm-pixel-core-resolver.ts` (`TrapSafePixelCore`), `core.slice.ts`, `document-persistence-flush-bus.service.ts` (new), `bindings.rs`/`wasm-document-core.ts` (`debug_force_trap`) |
| 3 | `importDocument` robustness (NUL names, frameMs mismatch, dup ids) | WARNING | **NOT FIXED** — confirmed real (re-ran judges' repro) | `wasm-document-core.ts` (`encodeDocumentPayload`/`encodeDocSnapshot`), `document.rs` (`from_payload`/`meta_layer_names`) |
| 4 | `frame.paste` clamping, numeric validation parity, fractional-index bug, extended fuzz | WARNING | **NOT FIXED** | — |
| 7 | Store-loop performance (Wasm slower than TS end-to-end through the real store) | WARNING | **NOT FIXED** — highest-priority remaining item | `core.slice.ts`, `wasm-document-core.ts` |
| 5 | Raw Rust API hardening (checked math) | WARNING | **PARTIAL** — `Document::new` fixed; rest of crate not audited | `document.rs` |
| 6 | Memory: free the previous `WasmDocument` on import/replace/disposal | WARNING | **PARTIAL** — `importDocument` fixed; no-dispose-path-for-first-doc still open | `wasm-document-core.ts` |
| 8 | Unbounded `layer_revisions`/id-map growth | WARNING | **NOT FIXED** | — |

---

## What was fixed, in detail

### 1. CRITICAL — the flag was dead

**Root cause** (confirmed by reading the code, not assumed): `core.slice.ts`'s `ensureCore()` memoizes `core` exactly once per store lifetime. `resolveCore()` must stay synchronous (every caller depends on it), so `wasm-pixel-core-resolver.ts`'s `tryResolveWasmPixelCore` returned a real `WasmPixelCore` ONLY if the module happened to already be cached — otherwise it kicked off a background load and returned `null`, expecting a LATER call to pick it up. But there is no later call: `core` is only ever resolved once. The very first `ensureCore()` call of every session always ran before `loadWasmModule()`'s promise could possibly have settled, so `pf:core=wasm` never did anything observable, in any session, ever.

**Fix**: new `waitForWasmModule(): Promise<void>` in `wasm-pixel-core-resolver.ts` (resolves once the module has loaded or failed — never rejects). `services/document-persistence.controller.ts`'s `startDocumentPersistence` — which already gates `docStatus: 'loading' → 'ready'` on migration + draft restore — now awaits it, but only when `resolveCoreImpl() === 'wasm'`, placed before `store.importDocument(stored.payload)` (which itself would trigger `ensureCore()`) and before the `docStatus: 'ready'` flip (which is what makes the canvas interactive and lets the user's first `dispatch` trigger `ensureCore()` if there was no stored draft). The `'ts'` path never calls `waitForWasmModule()` at all — zero behavior change, zero added latency.

**Tests**:
- `document-persistence.controller.wasm-gate.test.ts` (new, 3 cases): `'ts'` never calls `waitForWasmModule`; `'wasm'` blocks `docStatus` at `'loading'` until it resolves; a stored draft is only imported after it resolves.
- `stores/slices/core.slice.real-trap.test.ts` (new): against the REAL built `.wasm` (not mocked), mirrors the production gate exactly and proves a real `WasmPixelCore` is constructed and used by the store.

### 2. CRITICAL — trap bricks the core, including its own recovery path

**Root cause**, confirmed with a REAL trap (new test-only `WasmDocument::debug_force_trap()` / `WasmPixelCore.debugForceTrap()` — a genuine Rust `panic!`, which this crate's `panic = "abort"` release profile compiles to a real Wasm `unreachable` instruction, i.e. a genuine `WebAssembly.RuntimeError` the first time): wasm-bindgen's generated glue sets a "this object is currently borrowed" flag before entering any `&self`/`&mut self` method and clears it only on a normal return. A trap skips that cleanup, so the flag sticks forever. Every call on the SAME JS handle after that — including the object's own `exportDocument()`, which phase 7's `TrapSafePixelCore.demoteToTs` called to recover the last-good document — throws a plain `Error: recursive use of an object detected which is already borrowed`, never another `RuntimeError`. Phase 7's design had two independent bugs as a result: (a) gating trap detection on `instanceof WebAssembly.RuntimeError` missed every follow-on call, which is the common case; (b) the recovery path itself was guaranteed to also throw.

**Fix**: `TrapSafePixelCore.guard()` now treats ANY exception as fatal-poison on first occurrence (not only `RuntimeError`); once demoted, a later exception from the recovered `TsPixelCore` propagates as-is (not mistaken for a new trap). Recovery no longer calls `this.wasm.exportDocument()` at all — it rebuilds a `TsPixelCore` from a caller-supplied `getRecoverySnapshot(): DocSnapshot` callback. `core.slice.ts` supplies this from its OWN current zustand state (the metadata + pixel cache written back after the last successful dispatch) — never touching the trapped instance again. `core.slice.ts`'s `dispatch` now has a try/catch: on a poisoned-core exception it resyncs the store from the recovered core (`canUndo`/`canRedo` reset to `false` — undo history is unavoidably dropped, since the abandoned Wasm instance was its sole owner), calls the new `document-persistence-flush-bus.service.ts`'s `requestImmediateFlush()` so the preserved pre-trap content is saved immediately rather than waiting out the autosave debounce, and returns a safe no-op `DispatchResult` instead of letting the exception escape (there is still no `ErrorBoundary` anywhere in `apps/editor` — console.error is the only user-facing signal today, tracked as a follow-up, not silently dropped).

**Tests**:
- `wasm-pixel-core-resolver.test.ts` (rewritten, 7 cases): poison-on-any-exception (including a plain `Error`, not just `RuntimeError`), recovery via `getRecoverySnapshot` with a `FakeWasmPixelCore` whose `exportDocument()` throws loudly if ever called (proving recovery never touches it), undo history dropped, post-demotion errors propagate normally.
- `stores/slices/core.slice.real-trap.test.ts` (new, 2 cases) — against the REAL built `.wasm`: a real `debugForceTrap()` call on the exact instance the store uses, then asserts: the failing command throws nothing out of the store action; pre-trap pixel content is intact (no data loss); `canUndo` is `false` (history dropped); the flush bus was called (autosave triggered immediately); the NEXT dispatch succeeds and runs on TS.

### 3–4, 7, 8 (not reached)

Not attempted this session, in order of what was skipped: WARNING #3's NUL-name corruption was **re-confirmed real** by re-running the judges' `nul.jb.test.ts` against this session's rebuilt `pkg/` (see Results below) but not fixed — it needs a real re-encoding of the `layerNames` wire field (currently `\u0000`-joined, which desyncs every name after one containing `\u0000`) in both `wasm-document-core.ts` and `document.rs`. WARNING #4 (numeric validation parity / fractional-index bug / extended fuzz), #7 (store-loop performance — the real store's per-dispatch `snapshot()` + dirty-layer-copy cost; this was the item flagged as highest priority if confirmed, and was NOT re-measured this session), and #8 (unbounded `layer_revisions`/id-map growth) were not attempted.

### 5 (partial) — `Document::new` overflow

`Document::new`/`WasmDocument::new` was the one constructor in the crate doing unchecked `canvas_w * canvas_h * CHANNELS` multiplication (Judge A's WARNING #1) — the same overflow class fixed for `downscale`/`quantize` in phase 6f. Now `checked_mul`s identically to `from_payload`/`doc_replace`, degrading to a safe 1x1 canvas on overflow instead of under-allocating. New Rust test: `document::tests::new_degrades_to_a_safe_1x1_canvas_instead_of_overflowing_the_allocation`. The rest of WARNING #5's scope (checked math in `layer_add`, `frame_add`, paste counts, other `Vec::with_capacity` sums elsewhere in `document.rs`) was not audited.

### 6 (partial) — `importDocument` memory leak

Re-ran judges' `mem.jb.test.ts` against the rebuilt `pkg/` (see Results) and confirmed: 300 sequential `importDocument` calls on the same long-lived `WasmPixelCore` grew Wasm linear memory by ~1MB EACH (start 1MB → 303MB after 300 calls), with zero reclamation visible even after settling delays (no `--expose-gc` available in that run, so this is "at least this bad," not necessarily a true permanent leak — but the linear-in-call-count growth DURING the loop itself, before any GC pass could even be attempted, is the confirmed defect). Root cause: `importDocument` replaced `this.doc` by reference without ever calling `.free()` on the outgoing `WasmDocument` — correct reliance on GC + `FinalizationRegistry` for a `WasmPixelCore`'s FIRST/only document (confirmed fine by verify-report-phase-7), wrong for this method's actual replace-in-place usage pattern. Fixed: `this.doc.free()` is called synchronously before building the replacement, in both the success and corrupted-payload-fallback branches. New regression test in `packages/core/src-ts/wasm-document-core.test.ts` — verified it actually FAILS without the fix (21.3MB growth over 80× 256KB imports vs a 1MB budget) and passes with it. Not fixed: an explicit dispose/teardown path for the FIRST `WasmDocument` a `WasmPixelCore` ever holds (still GC/`FinalizationRegistry`-only, which remains fine for today's one-core-per-session pattern).

---

## Results

**Typecheck**: clean (`packages/core`, `packages/tokens`, `apps/editor`, `apps/landing`).

**Tests** (`pnpm run test`):
```
packages/tokens:  5 passed (5)
packages/core:    4266 passed (4266)   [+1 vs phase 7: new overflow test + new memory test = +2, net reported above is cargo-side; see cargo below for the Rust-side count]
apps/editor:      311 passed (311)     [+8 vs phase 7: 3 resolver rewrite net-new + 3 wasm-gate + 2 real-trap]
```
(`packages/core`'s vitest suite covers `wasm-document-core.test.ts`'s new memory test; the `document.rs` overflow test is covered by `cargo test` below, not vitest.)

**Rust**: `cargo fmt --check` clean. `cargo clippy --all-targets -- -D warnings` clean. `cargo test`: **88/88** passed (was 87 — +1 new overflow test), 0 failed, 0 ignored. `cargo deny check`: advisories ok, bans ok, licenses ok, sources ok (same 5 harmless pre-existing "license-not-encountered" warnings as every prior phase).

**Bench** (`pnpm run bench` / `pnpm run check-bench`): all suites ran, no regressions vs phase 7's numbers (wasm stroke ~1.95x, fill ~2.08x, undo+redo ~4.02x, structural op ~1.89x faster than TS at the `PixelCore` level). `check-bench`: all 7 gated ratios within budget. **Not added this session**: the store-LOOP-level bench judges' `store-loop.bench.ts` targets (WARNING #7) — the existing bench still measures only the raw core call, not the store's real per-dispatch `snapshot()`/cache-copy overhead. This remains the single most important open question before any default-flip conversation.

**Differential fuzz**: unchanged from phase 7 (300 seeds × 60 steps, all passing) — not extended to ≥400 seeds or the judges' adversarial generator modes this session (WARNING #4, not reached).

**Judges' repro re-runs this session** (against the rebuilt `pkg/`, scratchpad `judgeB7`):
- `nul.jb.test.ts`: **reproduces the bug** — `["x","y","B"]` reported for layers `[A(renamed to "x\u0000y"), B, C]` (expected `["x\u0000y","B","C"]`) — confirms WARNING #3 is real and unfixed.
- `mem.jb.test.ts`: reproduced the ~1MB-per-`importDocument`-call growth (1MB → 303MB over 300 calls) **before** this session's fix; re-run not repeated after the fix via the judge's own script (the new in-repo `wasm-document-core.test.ts` test covers the fixed behavior instead, with a tighter, deterministic bound).
- `trap.jb.test.ts` / `store.jb.test.ts` (OOM-based real-trap and store-reachability repros): superseded by this session's own deterministic `debug_force_trap`-based tests (`core.slice.real-trap.test.ts`, `wasm-pixel-core-resolver.test.ts`), which exercise the identical real post-trap behavior without the OOM approach's slowness/flakiness risk — not separately re-run.

**Wasm reproducibility**: two consecutive `build-wasm.mjs` runs produced byte-identical output (SHA-256 compared, all 5 `pkg/` files) and a clean host-path scan. Gzip of `pixelforge_core_bg.wasm`: **41,364 bytes** (~27.6% of the 150KB budget; was 41,234/41,509 in phase 7's two prior measurements — the delta is the new `debug_force_trap` export plus the `Document::new` checked-math branch).

**Store-loop bench TS vs Wasm**: NOT produced this session (WARNING #7, not reached) — still an open question, flagged as the highest-priority remaining item.

---

## Deviations from the orchestrator's brief

- Stopped after items 1, 2, and partial 5/6 — did not reach 3, 4, 7 (full), 8, per the explicit "stop at a coherent green point" instruction once the two CRITICAL items and two cheap, well-scoped WARNING fixes were solid and fully tested.
- Used a test-only `debug_force_trap`/`debugForceTrap` Rust/TS export (a deliberate panic) rather than a genuine OOM repro for the "real trap" requirement — matches the brief's explicitly offered alternative ("a debug-only test export that panics"), chosen over OOM because it is deterministic, fast (~1ms vs. a potentially multi-GB allocation loop), and reproduces the EXACT real-world symptom (stuck borrow flag, plain-`Error` follow-on calls) that matters for this fix, without the risk of crashing the test process outright on a true OOM.
- Did not implement a secondary "else from the store's pixel cache" trap-recovery fallback as phase 7's original design envisioned (`tasks.md` 7.13) — superseded entirely by the `getRecoverySnapshot` redesign, which makes that secondary path unnecessary (there is only one recovery source now, and it's the correct one). Documented in `design.md`'s new "Phase 7f" section and `tasks.md` 7.13 (marked closed, with an explanation of why the plan changed).
- `verify-report-phase-7.md` (Judge A's report) was left untouched — this report is a separate file (`verify-report-phase-7f.md`) so as not to overwrite/lose the judge's findings.

## Risks

- **Highest**: WARNING #7 (store-loop performance) is unverified this session. If the real store loop is still slower with Wasm than TS (as a prior measurement suggested), that is directly relevant to any future default-flip decision and should be measured before that conversation happens.
- WARNING #3's NUL-name corruption is a confirmed, real data-corruption bug (layer names, not pixels) reachable today via `layer.meta` with an adversarial/corrupted name — low real-world likelihood (requires a name containing a literal NUL character) but zero mitigation exists; should be fixed before `pf:core=wasm` sees any real usage beyond manual testing.
- The trap-recovery UX gap verify-report-phase-7 flagged (console.error-only, no toast/`ErrorBoundary`) is now LOWER risk than before (the failure mode is graceful — no uncaught exception, no silent full-gesture no-op — but still has zero positive user-facing signal). Unchanged from phase 7, not addressed this session (out of scope — UI work, not core logic).
- `Document::layer_revisions`/handle-id bimaps remain unbounded (WARNING #8) — unchanged risk profile from phase 7, documented intentional tradeoff.

## Skill resolution

`injected` (sdd-apply skill loaded via the `Skill` tool at the start of this session; "Project Standards (auto-resolved)" block was present in the orchestrator's launch prompt).

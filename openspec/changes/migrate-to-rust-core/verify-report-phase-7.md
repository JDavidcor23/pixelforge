# Verify Report — Phase 7 (Rust `Document`/history as `WasmPixelCore`)

**Change**: migrate-to-rust-core
**Phase**: 7 (Rust `Document` + `History` behind `pf:core`/`VITE_PIXEL_CORE`, default `ts`)
**Commit verified**: `39ced9f` (2026-10-09 21:14:07 -0500)
**Judge**: Judge A (blind), Sonnet, scratch `judgeA7`
**Mode**: Standard (Strict TDD disabled)

---

## Executive Summary

Phase 7 is implemented correctly and the default genuinely stays `ts` everywhere
I checked (`resolveCoreImpl`, `kernels.ts`, `sprite-pipeline.ts` all gate on the
same override chain). All claimed numbers reproduce: `pnpm run
typecheck`/`test`/`bench`/`check-bench` green (4265+303+5 tests), `cargo
fmt`/`clippy -D warnings`/`test` (87/87)/`deny check` clean, and an independent
rebuild of the `.wasm` into a scratch dir is byte-identical (SHA-256) to the
committed `pkg/`, all 5 files. However I found two real gaps the team's own
HANDOFF/design.md did not disclose: (1) `Document::new`/`WasmDocument::new`
does unchecked `w*h*4` multiplication — the exact overflow class already fixed
elsewhere in this crate (phase 6f's W-A) — though today's only call site uses a
safe hardcoded `32x32` fallback, so it is not currently exploitable; (2) the
trap-recovery path's documented "only the one trapped command is lost" is an
understatement — the entire rest of an in-flight stroke gesture silently
no-ops after a trap, and the exception propagates uncaught to the UI with zero
user-facing signal (console.error only, no error boundary, no toast). Phase 7
also shipped as a single 5,939-line commit against its own stated exit bar of
"PR <300 LOC per step." None of this blocks the already-correct decision to
keep the default on `ts`.

**Verdict: PASS WITH WARNINGS** (no CRITICAL confirmed against the *default*
user experience; the findings above matter before 7.9 flips the default).

---

### Completeness (Phase 7 tasks, `tasks.md` lines 273-293)

| Metric | Value |
|---|---|
| Phase 7 tasks total | 15 (7.1–7.15) |
| Complete `[x]` | 8 (7.1–7.8) |
| Incomplete `[ ]` | 7 (7.9–7.15) |

All 7 incomplete items are explicitly documented, deliberate deferrals (7.9/7.10:
flipping the default + commit, left for the user; 7.11–7.15: known follow-ups
with exact file pointers) — none silently dropped. This matches what I found
reading the code: nothing claims to be done that isn't.

---

### Build & Tests Execution (re-run by me, this session)

**Typecheck**: ✅ `pnpm run typecheck` — clean (`packages/core`, `packages/tokens`, `apps/editor`, `apps/landing`).

**Tests**: ✅ all green
```
packages/tokens:  5 passed (5)
packages/core:    4265 passed (4265)
apps/editor:      303 passed (303), 40 test files
```
No `.skip`/`.only`/`xit`/`xdescribe` found in any phase-7 test file. The two
"(skip notice)" `describe` blocks (`wasm-pixel-core.differential.fuzz.test.ts`,
`wasm-pixel-core.undo-memory.baseline.test.ts`) are NOT skips — they are
always-passing sentinel tests that only `console.warn` if `packages/core/pkg/`
isn't built. I confirmed `pkg/` exists and `describe.runIf(pkgAvailable)`
evaluated to `true`, so the real 300-seed×60-step fuzz and the undo-memory
baseline both actually executed (not silently skipped).

**Rust**: ✅ `cargo fmt --check` clean. ✅ `cargo clippy --all-targets -- -D
warnings` clean. ✅ `cargo test`: 87 passed; 0 failed; 0 ignored. ✅ `cargo deny
check`: advisories ok, bans ok, licenses ok, sources ok (5 harmless
"license-not-encountered" warnings for allow-listed-but-unused licenses, not
failures).

**Bench**: ✅ `pnpm run bench` — all suites ran; this machine's numbers are in
the same ballpark as `baseline-bench.md`'s claims (e.g. wasm stroke 2.05x
faster, fill 2.07x, undo+redo 4.74x [claimed 3.01x — run-to-run variance,
still clearly >1x], structural op 1.93x; flood-fill/quantize/downscale ratios
all close to the documented numbers). ✅ `pnpm run check-bench`: "all checked
ratios are within budget" (7/7 `PixelKernels` gates pass — this gate is
`PixelKernels`-scoped, not `PixelCore`-scoped, confirmed consistent with
`tasks.md` 7.15's open follow-up to add a `PixelCore`-level gate).

**Wasm reproducibility** (done independently, not trusting the handoff's
claim): rebuilt `packages/core` into a scratch out-dir using the exact
`build-wasm.mjs` RUSTFLAGS/remap/post-processing logic, then SHA-256-compared
every file in the rebuilt `pkg/` against the committed one:
```
pixelforge_core_bg.wasm     : byte-identical (sha256 04607217a4…)
pixelforge_core.js          : byte-identical
pixelforge_core.d.ts        : byte-identical
pixelforge_core_bg.wasm.d.ts: byte-identical
package.json                : byte-identical
```
Gzip of the committed `.wasm`: 41,509 bytes (claimed 41,234 — gzip-tool
variance, not a discrepancy of substance), ~27.7% of the 150KB budget.

---

### Spec Compliance Matrix

| Requirement | Scenario | Test | Result |
|---|---|---|---|
| edit-history: Command-Based Mutation | Mutation via dispatch is observable | `ts-core.test.ts` (ts) + `wasm-document-core.test.ts`/differential fuzz (wasm) | ✅ COMPLIANT |
| edit-history: Undo/Redo Correctness | single undo / redo / multi-step round-trip | `ts-core.test.ts`, `document.rs::push_then_undo_then_redo_roundtrips`, differential fuzz (undo/redo in command pool) | ✅ COMPLIANT |
| edit-history: Bounded Undo Memory | 1px stroke stays <1KB | `wasm-pixel-core.undo-memory.baseline.test.ts` (8 bytes), `document.rs::undo_memory_reference_scenario_a_single_pixel_stroke_retains_8_bytes` | ✅ COMPLIANT |
| edit-history: Bounded History Retention | long session respects memory ceiling | `history.rs::eviction_enforces_max_entries`, `eviction_drops_oldest_first_once_budget_exceeded` (Rust-only); `history.test.ts` (TS-only) | ⚠️ PARTIAL — each engine is unit-tested independently for eviction; the cross-engine differential fuzz never exercises `HISTORY_MAX_BYTES` eviction (all 300 seeds use a 2-5px canvas, far below the 32MB budget), only entry-count eviction plausibly fires. See SUGGESTION below. |
| pixel-core: Implementation-Agnostic Pixel Operations | pixel write readable back / flood-fill matches | `wasm-document-core.test.ts`, differential fuzz (stroke/fill compared ts vs wasm every step + byte-identical export every 7th step) | ✅ COMPLIANT |
| pixel-core: Full Canvas Repaint Performance | repaint budget met (<4ms) | `buffer-to-canvas.bench.ts` (0.0878ms mean, this run) | ✅ COMPLIANT (phase 1 scope, re-confirmed) |
| pixel-core: Flood-Fill Performance | ≥3x faster than TS, <5ms | `check-bench` gate | ⚠️ PARTIAL, pre-existing — this run measured wasm/ts ratios of 0.78x (full fill) and 0.45x (maze/holes); the spec literally requires ≤0.333x ("at least 3x faster"). `thresholds.json` intentionally gates at the lower, measured-reality bar per phase 5f's own disclosed deviation — not a phase 7 regression, but the literal spec requirement is still unmet as of this commit. |
| pixel-core: Lossless Pixel Round-Trip | quantize/downscale channel range | quantize/downscale fuzz suites (phase 6 scope) | ✅ COMPLIANT (re-verified green this session) |
| pixel-core: Local Draft Recovery | draft restore scenarios | phase 1 tests (untouched by phase 7) | ✅ COMPLIANT (out of phase 7 scope, still green) |
| core-parity-gate: Parity Tests Gate Default Implementation | failing parity blocks promotion | Phase 7 default stays `ts`; full parity suite (87 cargo tests + 16 wasm-document-core tests + 300×60 differential fuzz) passes | ✅ COMPLIANT |
| core-parity-gate: Baseline Benchmarks Recorded Before Porting | baseline exists before port | `baseline-bench.md`'s Phase 7 section | ✅ COMPLIANT |
| core-parity-gate: CI Enforces Tests/Benchmarks/Drift Check | PR triggers full gate | GitHub Actions CI itself did NOT run this session (per `tasks.md` 7.8, disclosed); I independently reproduced the drift check's intent via a from-scratch rebuild + SHA-256 compare (byte-identical) | ✅ COMPLIANT in intent (manually re-verified), ⚠️ actual CI execution not exercised — consistent with every prior phase's verify reports, not a new gap |

**Compliance summary**: 10/12 scenarios fully compliant, 2 pre-existing/partial (not phase-7 regressions).

---

### Focus-Area Findings (per the orchestrator's brief)

#### 1. Is the default really `ts` everywhere?

Confirmed, by direct code reading, not inference:
- `apps/editor/src/lib/core/core-config.ts:43` — `resolveCoreImpl()` returns
  `readLocalStorageOverride() ?? readEnvOverride() ?? 'ts'`.
- `apps/editor/src/lib/core/kernels.ts:53,82` — both kernel-resolution
  functions `if (resolveCoreImpl() !== 'wasm') return tsKernels` BEFORE
  touching the wasm loader at all.
- `apps/editor/src/lib/sprite-pipeline.ts` — routes through `kernels.ts`'s
  gated accessor (phase 6f's kill-switch fix), not a direct
  `@pixelforge/core` import.
- `resolveCore()` (`core-config.ts:80-93`) only constructs `WasmPixelCore` when
  `impl === 'wasm'`, and even then only if the module happens to already be
  loaded (`tryResolveWasmPixelCore`), else falls back to `TsPixelCore` and logs
  once.

No path silently uses the Wasm document core without the override explicitly set.

#### 2. Spec scenarios on BOTH cores / contract suite truly parameterized?

No — confirmed NOT a literal `describe.each(['ts','wasm'])` parameterized
suite, exactly as the team's own HANDOFF.md states. Coverage is via three
separate suites: `ts-core.test.ts` (TS alone), `packages/core/src-ts/
wasm-document-core.test.ts` (16 cases, Wasm alone against the real `.wasm`),
and the differential fuzz (both, side by side). This is an honest
self-disclosure, not a hidden gap — I verified it's actually true rather than
taking the claim at face value.

No skipped tests anywhere in the phase-7 test files (see Build & Tests section above).

#### 3. Differential fuzz quality

`apps/editor/src/lib/core/wasm-pixel-core.differential.fuzz.test.ts`:
- **Every command kind**: confirmed — the `pool` array (lines 89-124) covers
  all 20 `Command` variants (stroke.begin/points/end, fill, region.clear,
  selection.commit, layer.add/remove/meta/reorder/setActive,
  frame.add/remove/select/paste, doc.replace, undo, redo,
  timeline.setFps/toggleLoop/setFrameSelection/togglePlayback).
- **Undo/redo**: in the pool, exercised every run.
- **Ids with seed**: `setIdSeed('fuzz')`/`setWasmIdSeed('fuzz')` called
  identically per seed iteration (line 151/153) — confirmed both cores mint
  the same ids.
- **Dirty/evicted pairs, revisions**: `assertResultsMatch` (lines 128-139)
  compares `changed`, `contentChanged`, `historyChanged`, `canUndo`,
  `canRedo`, `strokeOpen`, `dirty`, `evicted`, `layerRevisions` every step —
  but does **NOT** directly compare `DispatchResult.revision`/
  `contentRevision` (fields that exist on the type but are absent from this
  assertion list). I verified whether this is a real gap by reading both
  bump rules: TS's `dispatchCommand` (`ts-core.ts:768-770`,
  `contentChanged = !NON_CONTENT_COMMANDS.has(cmd.type) || historyChanged`,
  bump iff true) and Rust's `finish()` (`document.rs:687-689`, identical
  rule: `content_changed = !non_content || history_changed`, bump iff true).
  Since `contentChanged`/`historyChanged` ARE asserted every step and both
  counters start at 0 and bump by the same rule, the two counters cannot
  currently diverge — the missing assertion is redundant today, not a live
  bug. Still a SUGGESTION: assert it directly so a future refactor that
  decouples the bump rule from `contentChanged` doesn't silently break
  autosave's trigger (`core.slice.ts:233`, `docRevision: result.contentRevision`).
- **Eviction under byte budget**: NOT exercised cross-engine — see the
  Bounded History Retention row above (SUGGESTION, not a confirmed bug: both
  engines have dedicated, passing, SAME-side unit tests for byte-budget
  eviction).

#### 4. Trap fallback — real risk assessment

Read `wasm-pixel-core-resolver.ts` end to end plus its test file plus every
call site in `core.slice.ts`/`useCanvasInteraction.hook.ts`. Findings:

- **CONFIRMED by the resolver's own test** (`wasm-pixel-core-resolver.test.ts:177`,
  `expect(() => core.dispatch(...)).toThrow(WebAssembly.RuntimeError)`):
  `TrapSafePixelCore.guard()` (`wasm-pixel-core-resolver.ts:90-99`) demotes
  internally to a recovered `TsPixelCore` but then **re-throws** the trapping
  error to the caller — by design, documented in the class doc.
- **CONFIRMED gap, not previously documented**: `core.slice.ts`'s `dispatch`
  action (line 173-175, `const result = c.dispatch(cmd)`) has **no try/catch**.
  `rg` across `apps/editor/src` found **zero** `ErrorBoundary` components. A
  mid-session trap therefore throws uncaught out of the Zustand action, up
  through the calling pointer-event handler (`useCanvasInteraction.hook.ts`,
  also no try/catch at any of its 6 `dispatch(...)` call sites) — React does
  not use error boundaries for event-handler exceptions, so the app does not
  crash, but the user gets **zero UI feedback**, only a `console.error` from
  inside `demoteToTs`. The store's `isStrokeOpen`/`layers`/`canUndo`/`canRedo`
  stay stale (the throwing call never reaches `set(...)`) until the next
  *successful* dispatch overwrites them.
- **CONFIRMED amplification HANDOFF.md/design.md do not mention**: HANDOFF's
  wording ("the ONE call that trapped is not retried — its effect is lost,
  not replayed... every mutation BEFORE the trap is preserved") reads as if
  only the single trapped command's edit is lost. In practice, for a trap
  during `stroke.points` mid-gesture, the recovered `TsPixelCore` never
  received the `stroke.begin` that opened the now-abandoned Wasm core's
  stroke — confirmed via `ts-core.ts:818-819`
  (`if (!stroke) return noChange(state)`). Every subsequent `stroke.points`/
  `stroke.end` call for the **rest of that same pointer-drag** silently
  no-ops on the recovered core until the user releases the pointer and starts
  a new gesture. So the real blast radius is "the rest of the in-progress
  gesture," not just the one call — worth updating the documentation, and
  worth adding a user-facing notice (even a console-only one undersells this
  to anyone debugging a future manual `pf:core=wasm` test session).
- The documented secondary gap (7.13, "else from the store's pixel cache" not
  implemented) is accurately described — confirmed, `demoteToTs`
  (`wasm-pixel-core-resolver.ts:74-88`) only has the primary
  `exportDocument()`-based recovery.

**Net assessment**: real risk is LOW today only because `wasm` is opt-in and
not the default; before flipping 7.9, this needs: (a) a try/catch at the
`core.slice.ts` dispatch boundary, (b) a user-visible notice, (c) corrected
documentation of the actual blast radius.

#### 5. Rust safety

- **No unsafe anywhere** in `packages/core/src/*.rs` — confirmed via `rg
  "unsafe"`, only hit is a comment stating the invariant.
- **Domain free of wasm-bindgen** — confirmed: `document.rs`, `history.rs`,
  `quantize.rs`, `downscale.rs` all explicitly comment "no `wasm_bindgen`
  import here"; grep confirms zero matches.
- **CONFIRMED, previously-undisclosed finding**: `Document::new`
  (`document.rs:385-392`) does unchecked
  `(canvas_w as usize) * (canvas_h as usize) * CHANNELS as usize` to size the
  initial layer's `Vec<u8>` — no `checked_mul`, no `MAX_*` bound, unlike:
  - `Document::from_payload` (`document.rs:484-486`, uses `checked_mul`
    chained with `?`),
  - `Document::doc_replace` (`document.rs:1713-1718`, `checked_mul` +
    exact-length match against the caller-supplied buffer),
  - `downscale`/`quantize`'s `MAX_DOWNSCALE_DIMENSION`/`MAX_QUANTIZE_COLORS`
    bounds (phase 6f's W-A fix — the SAME overflow class: on wasm32 (32-bit
    `usize`), a `canvas_w * canvas_h * 4 ≥ 2^32` wraps to a small number,
    producing an undersized allocation; any later write assuming the nominal
    (unwrapped) canvas size indexes past the real buffer and panics →
    `WebAssembly.RuntimeError`).
  - This constructor is exported as `#[wasm_bindgen(constructor)]`
    (`bindings.rs:247-252`) — part of the crate's public FFI surface, legally
    callable as `new wasmModule.WasmDocument(w, h)` from any JS.
  - **Exploitability today**: LOW. I grepped the entire workspace for every
    call site of this constructor. `WasmPixelCore`'s own constructor
    (`wasm-document-core.ts:282`) never calls it — always goes through the
    checked `from_payload` path. The **one** production call site
    (`wasm-document-core.ts:608`, `importDocument`'s corrupted-payload
    recovery) uses a hardcoded `FALLBACK_CANVAS_SIZE = 32` constant
    (`wasm-document-core.ts:44`), never externally influenced. So no current
    code path can trigger the overflow. If a trap DID somehow occur here, the
    enclosing `TrapSafePixelCore` would still catch it (mitigation, not a
    fix). Rated **WARNING** (real code defect, inconsistent with the crate's
    own established convention, zero current exploit path) rather than
    CRITICAL.
- Spot-checked `fill`, `layer_reorder`, `frame_select`, `doc_replace` for
  index-out-of-bounds risk on externally-supplied ids/indices: all use
  `.position()`/`.get()`/explicit `< len` guards before indexing — no panic
  risk found in the paths I checked.
- **Memory growth over long sessions**: `Document.layer_revisions`
  (`HashMap<u32, u64>`, `document.rs:135`) and the TS facade's 4 handle↔id
  bimaps (`wasm-document-core.ts`) are deliberately never pruned (confirmed
  via `rg` — no `.remove()`/`.retain()` call on `layer_revisions` anywhere),
  by design, so undo can resurrect an old layer/frame id after removal. This
  means an extremely long session with many layer/frame add+undo+redo+remove
  cycles grows these maps unboundedly for the life of the page. Documented as
  an intentional tradeoff in `LEARNING.md` §29, but not flagged anywhere as a
  memory-growth risk, and no test characterizes real-world growth under a
  long churn session. SUGGESTION, not a bug.
- **Freeing `WasmDocument`**: wasm-bindgen auto-generates a
  `FinalizationRegistry`-based cleanup (`pkg/pixelforge_core.js:682-684`,
  `new FinalizationRegistry(ptr => wasm.__wbg_wasmdocument_free(ptr, 1))`) —
  no explicit `.free()` call is required anywhere in the TS facade; GC
  reclaims Wasm-side memory automatically when the JS wrapper is collected.
  This is standard, safe behavior for a single long-lived document instance
  per session (which is the actual usage pattern — `ensureCore()` memoizes
  one core for the page's lifetime).

#### 6. Project rules + LEARNING accuracy

- Spot-checked LEARNING.md §25-§32 (Phase 7 section) against the actual code:
  all claims verified accurate (20 separate `WasmDocument` methods due to the
  wasm-bindgen no-serde ABI constraint — confirmed; `HashMap<u32,u64>` for
  `layer_revisions` — confirmed type at `document.rs:135`; `Vec<Layer>`
  nested in `Vec<Frame>`, no arena — confirmed structure;
  `Option<Self>` not `Result` for `from_payload` — confirmed signature; the
  §32 fuzz-found bug mechanism — confirmed against `focus_structural`'s
  actual code).
- No `any` in phase 7 production TS files; the one
  `eslint-disable @typescript-eslint/no-explicit-any` (`wasm-pixel-core.
  differential.fuzz.test.ts:37`, for a dynamically-`import()`ed wasm glue
  module with no static type) is isolated to a test harness and justified —
  not a rule violation.
- **New finding, process/governance**: Phase 7's exit criterion in
  `tasks.md:274` reads "PR <300 LOC per step." The actual commit
  (`39ced9f`) is a single commit of **5,939 insertions across 24 files**
  (`document.rs` alone is 2,289 lines), not split into <300-LOC steps. Not a
  runtime defect, but a confirmed miss against the phase's own stated exit
  bar — worth noting for the record since no earlier verify report for this
  phase flagged it.

---

### Issues Found

**CRITICAL**: None confirmed against the current default (`ts`) user experience.

**WARNING (real)**:
1. `Document::new`/`WasmDocument::new` (`packages/core/src/document.rs:385-392`,
   exported via `packages/core/src/bindings.rs:247-252`) performs unchecked
   `canvas_w * canvas_h * 4` multiplication — the same overflow class fixed
   for `downscale`/`quantize` in phase 6f (W-A) — with no `checked_mul`/
   `MAX_*` bound, unlike every sibling constructor in this crate. Not
   reachable today (only call site uses a hardcoded safe `32x32`,
   `packages/core/src-ts/wasm-document-core.ts:44,608`), but it is public FFI
   surface and should get the same defense-in-depth before 7.9/7.14.
2. `TrapSafePixelCore`'s mid-session recovery (`apps/editor/src/lib/core/
   wasm-pixel-core-resolver.ts:65-136`) re-throws into `core.slice.ts`'s
   `dispatch` (`apps/editor/src/stores/slices/core.slice.ts:173-175`), which
   has no try/catch, and no `ErrorBoundary` exists anywhere in `apps/editor/src`
   (confirmed via `rg`). A trap silently fails the user's current action with
   console-only feedback, and for a mid-stroke trap, the rest of that drag
   gesture silently no-ops (confirmed via `apps/editor/src/lib/core/
   ts-core.ts:818-819`) — a larger blast radius than HANDOFF.md's "only the
   one trapped command" wording suggests. Needs a catch + user notice +
   corrected documentation before manual `pf:core=wasm` testing (7.9's
   prerequisite) is considered complete.

**WARNING (theoretical)**:
3. `Document.layer_revisions` (Rust `HashMap`) and `WasmPixelCore`'s 4
   handle↔id bimaps are never pruned (by design, for undo-id resurrection) —
   unbounded growth over an extremely long session with heavy layer/frame
   churn. No test characterizes this. Documented intent (`LEARNING.md` §29),
   undocumented as a growth risk.
4. The differential fuzz's canvas is always 2-5px per seed — `HISTORY_MAX_BYTES`
   (32MB) eviction is never exercised cross-engine (only same-engine, via
   separate Rust/TS unit tests). A low-cost addition (one or two larger-canvas
   seeds) would close this for true cross-engine parity.

**SUGGESTION**:
5. `assertResultsMatch` in the differential fuzz doesn't directly assert
   `DispatchResult.revision`/`contentRevision` — verified harmless today (the
   bump rule on both sides is identical and gated by the already-asserted
   `contentChanged`), but asserting it directly would make the invariant
   explicit and catch a future refactor that decouples the two.
6. Phase 7 landed as one 5,939-line commit against its own "PR <300 LOC per
   step" exit bar (`tasks.md:274`) — not fixable retroactively, noted for the
   record.
7. HANDOFF.md/design.md's trap-safety wording should be updated to reflect
   finding #2's actual blast radius (whole in-flight gesture, not one command).

---

### Verdict

**PASS WITH WARNINGS.** The default-`ts` guarantee holds everywhere I checked,
all automated gates (typecheck/test/bench/check-bench/clippy/fmt/cargo
test/cargo deny/wasm reproducibility) are green and independently
re-confirmed, and the differential fuzz is well-built and genuinely caught a
real bug on its first run (phase 7's own §32 finding, re-verified against the
code). The two WARNING(real) findings above are new, confirmed-by-reading
gaps the team's own handoff did not surface — worth closing before 7.9 (flip
the default) is attempted, but neither affects anyone using the shipped,
default `ts` experience today.

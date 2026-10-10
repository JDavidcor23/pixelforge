# Handoff — migrate-to-rust-core

Last updated: 2026-10-09 (Phase 7f session). Branch: `feat/migrate-to-rust-core` (nothing committed yet — user commits manually).

## How to resume
1. Read this file, then `tasks.md` (checkboxes are the source of truth), `design.md`, `baseline-bench.md`, and the `verify-report-*.md` files in this folder.
2. Engram (project `game-builder`): `sdd/migrate-to-rust-core/{proposal,spec,design,tasks,apply-progress,verify-report}`, plus decisions `architecture/undo-model`, `architecture/persistence-model`, `architecture/rust-wasm-migration`, `workflow/model-split`.
3. Mode: SDD hybrid store, execution mode AUTO (user asked to implement all phases).

## Rules agreed with the user
- No commits/push, no Vercel project creation/deploy, no app builds (`next build`/`vite build`). `wasm-pack build` for packages/core is allowed.
- Model split: sdd-apply = Sonnet; sdd-verify = Sonnet; judgment-day = 2 blind judges (Sonnet + Opus) on critical phases (2, 4–7). Fable only if the main session runs on Fable.
- `/gp-init` (good-practice plugin) runs WITH the user after all implementation; then create a `rust-wasm` stack adapter for good-practice.
- Final deliverable: a detailed but non-technical summary for the user (problems found, how solved, lessons).
- Progress notices go out via the claude-relay stop hook (user tells Albus "me voy"); WhatsApp replies open NEW sessions, they don't reach this one.

## Status
- Phase 0 (gates, CI, characterization tests): DONE, verified.
- Phase 1 (flat Uint8ClampedArray buffer, putImageData render, IndexedDB DocumentRepository + autosave + legacy migration): DONE, verified.
- Phase 2 (+2b/2c/2d/2e/2f: command dispatch core, dirty-rect undo, all doc mutations undoable, stable ids, Aseprite-style undo focus, PixelCore boundary, fuzz property test): DONE, 3 judgment-day rounds.
- Phase 3 (pnpm monorepo: apps/landing Next, apps/editor Vite, packages/tokens, api/ Vercel Functions): DONE, verified. Pending for the user: 3.9 Vercel projects, 3.13 manual parity checklist (`editor-feature-parity-checklist.md`), 3.14 bundle key scan (needs build), 3.15 real AI routes, 3.16 HMR, 3.17 deploy.
- Phase 3 cleanup pending: dead root `vitest.config.ts`; single env config module in apps/editor (supabase.ts + core-config.ts); `any` in useCanvasPanning/useCanvasZoom hooks.
- Phase 4 (packages/core Rust crate + wasm pkg + PixelKernels facade + parity + bench + CI job + LEARNING.md; metadata-only snapshot + pixel cache via readLayer; setIdSeed): IMPLEMENTED, judgment-day findings FIXED (phase 4f, this session). Judge B (Opus) verdict was FAIL:
  - C1 pixel cache poisoned (0-byte buffer) when frame.add runs mid-stroke: slice assumes dirty layers belong to current frame. **FIXED**: `DispatchResult.dirty` now carries its own `frameId` per pair; `core.slice.ts` refreshes by `(frameId, layerId)` pair, never a "current frame" guess. A second, previously-undiscovered instance of the same bug class in `frame.select` was also found and fixed. Permanent regression test: `stores/slices/core.slice.cache.test.ts` (8 cases incl. a 300-seed fuzz over the real store).
  - W1 drift check fails on Linux CI (Windows paths embedded in .wasm panic strings; untracked files ignored by git diff). **FIXED**: `scripts/build-wasm.mjs` does `--remap-path-prefix` (absolute paths) + a narrow post-build byte substitution normalizing the embedded crate-relative `src\...` paths to forward slashes (verified: two consecutive builds byte-identical, binary scan finds zero backslash/host-path matches, down from 1). CI drift check also runs `git status --porcelain packages/core/pkg`.
  - W2/W3 Rust panics/silent u32 wraps on bad lengths/negative coords; leaks memory per trap; TS reference shares negative-rx bug. **FIXED**: every `pixels/mod.rs` function validates buffer length (`valid_buffer`) and uses checked arithmetic (`checked_add`/`checked_mul`) for all rect/coordinate math; mirrored in the TS parity reference and defensively in `apps/editor`'s `pixel-buffer.ts`. 20/20 `cargo test` (7 new adversarial cases), 4 new parity cases.
  - W4 duplicate ids on restore / seed reuse; W5 frame.paste/doc.replace don't check data.byteLength, empty layers allowed. **FIXED**: `createCoreState` scans for the highest existing id suffix under its seed; `idSeedOverride` consumed once (no sticky global); `payloadToDoc` de-duplicates ids; `frame.paste`/`doc.replace` validate byte length per layer, `frame.paste` rejects zero-layer frames.
  - W6 production wasm loader untested, editor doesn't depend on @pixelforge/core yet. **FIXED**: `apps/editor` now depends on `@pixelforge/core` (workspace); `loadWasmModule` takes an injectable init strategy so a test exercises the real production loader under Node; runtime traps (`WebAssembly.RuntimeError`) are caught, logged, and demote the session to TS kernels.
  - W7 bench gate fails open. **FIXED**: `check-bench.ts` now fails closed on a missing group/row or zero checked cases (verified via 3 synthetic fixtures); the meaningless per-call `put_pixel` gate is replaced with a gate on a batched `putPoints` call.
  - W8 undo refreshes every layer of every frame. **FIXED**: `dirtyAndEvictedOf(entry, direction)` computes exact pairs per `HistoryEntry` kind — no more full sweep except for the one documented exception (`doc.replace`, a genuine whole-document swap).
  - T1 (also addressed this pass, from the orchestrator's fix list): removed per-pixel `getPixel`/`putPixel` from the public `PixelKernels` facade, added a batched `putPoints` kernel.
  - LEARNING.md has false claims (§1 copy semantics, §2 in_bounds, §3 panics, §4 slowdown cause) — **FIXED**, all 4 corrected with the actual mechanism and evidence.
  - Phase 3 cleanups (dead root vitest.config.ts, env config module, `(e:any)` in canvas hooks): **DONE**. `.env.example` per app: **NOT DONE** — sandbox permissions refuse writing any `.env*` file even values-free; names documented in `tasks.md` 4f.11 instead.
  Full monorepo `pnpm run typecheck`/`test`/`bench`/`check-bench` green (apps/editor 271/271, packages/core 29/29, packages/tokens 5/5); `cargo fmt`/`clippy -D warnings`/`test` (20/20)/`cargo deny check` (4/4) all clean.
- Phase 5 (Rust flood-fill, `packages/core/src/flood_fill.rs` — 4-connected, stack-based, no recursion, boundary-validated): DONE, with one open item. `PixelKernels.floodFill` wired (tsKernels reference + wasm kernel + runtime-trap fallback, same pattern as every other kernel). **First phase that actually wires a Rust kernel into `apps/editor`'s live dispatch path**: new `lib/core/kernels.ts` bridges `dispatchCommand`'s sync requirement with `resolveKernels()`'s async load (honors the same `pf:core`/`VITE_PIXEL_CORE` override chain, default stays `'ts'`); `ts-core.ts`'s `fill` case now calls `getActiveKernels().floodFill(...)` instead of the old hardcoded TS import, undo semantics unchanged. **Open item (honestly reported, not hidden)**: bench shows Wasm well under the <5ms absolute budget (~0.92-0.97ms both the full-fill and maze/holes cases) but does NOT reach the proposal's ≥3x-faster-than-TS target — measured ~2.3x-2.6x, stable across repeated runs. One optimization was tried (dropping the `visited` bool array) and measured as a NET REGRESSION (~1.3x-1.7x only) — reverted; documented in `flood_fill.rs`'s module doc, `LEARNING.md`'s new Phase 5 section (§7-12), and `baseline-bench.md`. `packages/core/bench/thresholds.json` gates both flood-fill cases at the measured reality (0.45/0.48), not the aspirational 3x, via an explicit `_comment_flood_fill` key. Tests: `packages/core` 172/172 (9 new parity cases + a new 126-case deterministic fuzz suite comparing ts/wasm byte-for-byte on random mazes); `apps/editor` 276/276 (271 prior + 5 new: `kernels.test.ts` + `ts-core.kernels-wiring.test.ts`, the latter proving via a fake-kernel mock that `dispatchCommand` genuinely calls the resolved kernel, not just that the default TS path still works). `.wasm` gzip 11,769 bytes (~7.7% of the 150KB budget); two consecutive `build:wasm` runs confirmed byte-identical (reproducibility). `cargo test` 30/30, `cargo fmt`/`clippy -D warnings`/`cargo deny check` all clean. Full monorepo `pnpm run typecheck`/`test`/`bench`/`check-bench` green. **UPDATE (phase 5f, this session)**: the "open item" above is addressed — see the "Phase 5f" section below for the scanline rewrite, the corrected FFI-copy finding, and the re-measured (still-below-3x, but now re-confirmed and better-understood) ratio.

## Next steps
~~Phase 7 (Rust Document/history, full `PixelCore`)~~ — **IMPLEMENTED this session** (see "Phase 7" section below). DEFAULT STAYS `ts` — flipping it is the user's call after manual browser testing, not something this session did. Remaining before the final non-technical summary + `/gp-init`:
1. **Manual browser testing of `pf:core = 'wasm'`** (this agent had no browser) — open the editor with `localStorage.setItem('pf:core','wasm')`, exercise draw/undo/redo/layers/frames/save-reload, confirm it feels right, THEN decide whether to flip the default (`tasks.md` 7.9) and remove the override dance. This is the one thing that genuinely could not be verified by an agent without a browser.
2. Phase 7 follow-ups, UPDATED after phase 7f (`tasks.md` 7.11-7.15): `frame.paste`'s pasted-frame active-layer default (always first layer, not the original selection) — still open; `importDocument`'s coarser corrupted-payload recovery (one fallback empty doc, not per-layer repair) — still open; the trap-safety wrapper's secondary fallback — CLOSED in 7f, but by replacing the whole recovery design (see "Phase 7f" section below), not by building the originally-planned "else the store's pixel cache" branch; hoisting `Command`/`DispatchResult`/`PixelCore` into `@pixelforge/core` as a true shared type — still open; wiring a bench gate for `wasm-pixel-core.bench.ts`'s numbers — still open (now also needs a STORE-LOOP-level gate, not just a `PixelCore`-level one — see "Phase 7f" section's open items).
3. Remaining follow-ups from phase 4f: `.env.example` per app (blocked by sandbox permissions this session — try again in an unrestricted environment); confirm whether `vite-plugin-wasm`/`vite-plugin-top-level-await` are actually removable for `--target web` by running a real `vite build`/`vite dev` (this agent could not — no app builds allowed).
4. Then final non-technical summary + `/gp-init` with the user.

~~Phase 6 judge findings (W-A overflow, W-B loader race) + kill-switch bypass + the WRONG "FFI-copy dominated" downscale diagnosis~~ — **ADDRESSED in phase 6f** (fix-agent pass, this session): downscale is now measured 2.8x FASTER than TS (was 1.18x slower) once the real cost (a per-cell HashMap allocation, not the FFI copy) was found and fixed. See "Phase 6f" section below for the full list.
~~Open item from Phase 5: flood-fill's Wasm/TS ratio (~2.3x-2.6x) is below the proposal's 3x target~~ — **ADDRESSED in phase 5f** (fix-agent pass): rewrote flood-fill to a scanline span-fill algorithm (both Rust and the TS reference) and switched `opt-level` to `3`. CORRECTION to this note's old guess: the "per-call FFI whole-buffer copy" was NOT the bottleneck — measured directly at ~1.6% of total time (`judgeB5/decomp.mts`), not worth chasing. The real lever was compute (per-pixel -> per-span). Result: absolute time improved substantially (Wasm mean ~0.32-0.39ms, down from ~0.9-1.0ms), but the Wasm/TS RATIO actually moved further from 3x (~1.3x-2.0x now vs ~2.3x-2.6x before) — a faster algorithm can narrow the ratio while making both sides faster (LEARNING.md §15 explains the mechanism). Thresholds re-set to the new measured reality with margin (`thresholds.json`). See `baseline-bench.md`'s "Phase 5f" section for full numbers.

## Phase 7 (Rust `Document` + history — the full, stateful `PixelCore`)

The hardest port, landed last per D5 ("two seams"). Full detail in
`tasks.md`'s "Phase 7" section (source of truth), `design.md`'s new "Phase 7"
subsection (encoding + fallback design decisions), and `LEARNING.md`'s new
Phase 7 section (§25-§32, plain-English Rust walkthrough). Summary:

- **What exists now**: `packages/core/src/document.rs` (`Document`: frames,
  layers, pixel buffers owned in Wasm linear memory, stroke lifecycle, id
  handles, the FULL `Command` surface — stroke/fill/region.clear/
  selection.commit/layer CRUD/frame CRUD/`doc.replace`/`frame.paste`/undo/
  redo/timeline.*) + `packages/core/src/history.rs` (byte-budget undo stack,
  9 entry kinds, mirrors `history.ts`) + `bindings.rs`'s `WasmDocument`
  wasm-bindgen class + `packages/core/src-ts/wasm-document-core.ts`'s
  `WasmPixelCore` (implements the SAME `PixelCore` interface `TsPixelCore`
  does, via a flat numeric wire format — no JSON, no serde, see `bindings.rs`'s
  module doc) + `apps/editor/src/lib/core/wasm-pixel-core-resolver.ts`
  (sync-if-loaded resolution + a `TrapSafePixelCore` wrapper that recovers
  from a mid-session Wasm trap by exporting the trapped core's last-good
  state and rebuilding a `TsPixelCore` from it). `core-config.ts`'s
  `resolveCore()` now actually constructs a Wasm core when `pf:core`/
  `VITE_PIXEL_CORE` is `'wasm'` — **DEFAULT STAYS `ts`**, per the
  orchestrator's explicit decision (no browser available this session; real
  user data at stake). To test manually: `localStorage.setItem('pf:core',
  'wasm')` in the browser console, or `VITE_PIXEL_CORE=wasm` in
  `apps/editor`'s env.
- **Parity gate**: a 300-seed x 60-step differential fuzz
  (`apps/editor/src/lib/core/wasm-pixel-core.differential.fuzz.test.ts`)
  comparing `TsPixelCore` and `WasmPixelCore` on the identical random command
  sequence — every `DispatchResult` field every step, byte-identical
  `exportDocument()` every 7th step. Runs in well under a second. This fuzz
  FOUND a real bug on its first run (seed 92, step 26): `focus_structural`
  (undo/redo's "which frame becomes current" resolution) read a STALE array
  index after `self.frames` had already been mutated by an insert/remove —
  fixed by capturing the previous current-frame id BEFORE any mutation,
  mirroring how `ts-core.ts`'s equivalent reads it off the UNMUTATED `doc`
  argument. Full mechanism in `baseline-bench.md`'s "Phase 7" section and
  `LEARNING.md` §32 — a genuine example of a differential fuzz catching
  something no hand-written unit test in `document.rs` happened to exercise.
- **Tests**: `cargo test` 87/87 (55 prior + 32 new: `document.rs`/`history.rs`
  unit tests covering the full command surface, undo/redo, id-collision-
  after-import, the undo-memory reference scenario). `packages/core`
  4,265/4,265 (4,249 + 16 new: `wasm-document-core.test.ts`, against the real
  compiled `.wasm`). `apps/editor` 303/303 (294 + 9: `core-config.test.ts`
  rewritten for the now-real wasm wiring, `wasm-pixel-core-resolver.test.ts`'s
  4 trap-safety cases, the differential fuzz, the undo-memory baseline).
  `cargo fmt --check`/`cargo clippy --all-targets -- -D warnings` clean. Two
  consecutive `build:wasm` runs byte-identical (SHA-256 compare via Node's
  `crypto` — `cmp`/`sha256sum` unavailable in this shell). Gzip `.wasm`:
  41,234 bytes (~27.5% of the 150KB budget), up from 12,619 bytes at the end
  of phase 6f — the expected cost of the full `Document` surface (~20 new
  wasm-bindgen methods), still comfortably under budget.
- **Bench** (honest numbers, `apps/editor/src/lib/core/wasm-pixel-core.
  bench.ts`, NOT wired into a pass/fail gate — `packages/core/bench/
  thresholds.json`'s gate is `PixelKernels`-scoped): stroke (60-point batch)
  1.95x faster on Wasm, fill 2.06x faster, undo+redo 3.01x faster, a
  structural op pair (layer.add+remove) 1.94x faster. Full table in
  `baseline-bench.md`'s "Phase 7" section.
- **Known, documented deviations** (none affect the default `ts` experience
  — `tasks.md` 7.11-7.15 have the full list and exact file pointers):
  `frame.paste`'s pasted-frame active-layer always defaults to the first
  layer; `importDocument`'s corrupted-payload recovery is one coarse
  fallback-to-empty-document branch (not `payloadToDoc`'s finer per-layer
  repair); the trap-safety wrapper's secondary "else the store's pixel
  cache" fallback isn't implemented (only the primary, export-based
  recovery); `Command`/`DispatchResult`/`PixelCore` types are a structural
  duplicate in `@pixelforge/core` (`document-types.ts`) rather than a shared
  import — the `PixelKernels` precedent this phase did not extend; the bench
  numbers above have no pass/fail gate yet.
- **Not done, by explicit instruction**: flipping `VITE_PIXEL_CORE`'s
  default to `wasm` (7.9) and the final commit (7.10) — both left for the
  user/orchestrator.

- Phase 6 (Rust quantize + downscale, `packages/core/src/{quantize,downscale}.rs`): DONE, verified; **superseded by phase 6f below** for the downscale perf numbers and the editor-wiring kill-switch (phase 6's original claims are kept here for history, corrected inline). `quantize` ported as a flat-buffer weighted k-means-style palette reducer (no `w`/`h` needed — spatially agnostic); `downscale` ports ONLY `downscaleTo` (majority-vote + anti-alias defringe) — `resizeNearest` intentionally out of scope (not named by tasks.md, not covered by the pixel-core spec scenario; `apps/editor` keeps calling it directly). Both wired into `PixelKernels` (`types.ts`, `ts-core.ts`, `wasm-core.ts`, `resolve-core.ts`'s `withRuntimeTrapFallback`) with the same `isValidU32` boundary-number-validation convention every other kernel argument gets (phase 5f.5). **Editor wiring**: `apps/editor/src/lib/sprite-pipeline.ts`'s `quantizeIfNeeded`/`downscaleViaKernels` now route through `resolveKernels()` (same override chain + automatic TS fallback every other caller uses) — covers both the file-import pipeline AND the AI sprite pipeline (`retro-diffusion-utils.ts`'s `decodeGeneratedSprite` calls `decodeToPixels` directly), with the original oracle kept as a defensive (never-triggered) fallback. **Parity**: `cargo test` 50/50 (20 new: 9 quantize + 11 downscale); `pixel-parity.test.ts` +14 ts/wasm cases; new `quantize-downscale.fuzz.test.ts` (2,000 randomized ts/wasm cases EACH for quantize and downscale, deterministic LCG, 0 failures); two new `apps/editor` oracle-parity suites (`quantize.oracle-parity.test.ts`, `downscale.oracle-parity.test.ts`, mirroring `flood-fill.oracle-parity.test.ts`'s pattern) — 2,000 randomized cases EACH vs the ORIGINAL untouched oracle files, plus dedicated edge-case and boundary-number-validation tests, 0 failures. Full monorepo `pnpm run typecheck`/`test` green (`packages/core` 4,244 tests, `apps/editor` 289 tests). **Bench** (honest numbers, `baseline-bench.md`'s "Phase 6" section): quantize is COMPUTE-HEAVY and Wasm wins decisively (~3.4x-3.65x faster than TS at 16/32 colors on a 64x64 buffer); downscale is FFI-copy-dominated (whole 512x512 source buffer copied per call, same cost class as `extractRect`/`writeRect`/batched `put_points`) and Wasm is measured ~1.17x-1.18x SLOWER than TS — recorded honestly, no spec requirement violated (the pixel-core spec's 3x/5ms performance budget names only flood-fill). `thresholds.json` gates both at measured reality with margin (0.4 for quantize, 1.4 for downscale). `cargo fmt`/`clippy -D warnings`/`cargo deny check` all clean. Two consecutive `build:wasm` runs byte-identical; post-build host-path scan clean; gzip `.wasm` 14,647 bytes (~9.8% of the 150KB budget, up from 10,273 bytes at the end of phase 5f). `LEARNING.md` gained a new "Phase 6" section (§17-22): `f64`/JS `number` bit-identical parity, the `127.5` fallback-threshold float, iterators vs index loops, `Vec::with_capacity`, why NOT sorting/deduping the vote buckets (insertion-order tie-break), and why quantize/downscale's wasm-bindgen return needs none of flood-fill's tuple-packing machinery.

## Phase 5f (fix-agent pass — Judge A5/B5 findings on phase 4f/5)

Fixed, with a permanent regression test ported from each judge's confirmed
repro (fail before, pass after — not just inference):
1. **Dirty-pair cache full-sweep bug** (`core.slice.ts`): a command that
   force-commits an open stroke AND deletes that exact (frameId, layerId)
   pair in the same dispatch (`layer.remove`/`frame.remove`/`doc.replace`)
   used to trigger a `console.error` + expensive full-document cache sweep,
   even though nothing was actually wrong. Fixed: `dirty` pairs also present
   in `evicted` are dropped before the refresh loop runs — evicted always
   wins, never falls back to a full sweep for this case.
2. **`setIdSeed` silently discarded on `importDocument`** (CRITICAL,
   `ts-core.ts`'s `payloadToDoc`): the minter that consumes the one-shot
   seed override is now LAZY — only constructed when a payload actually
   needs a fallback layer or duplicate-id repair, so a healthy payload never
   burns the override before `createCoreState` sees it. The W4a regression
   test (which passed before for the wrong reason — a random fallback seed
   trivially avoids collision) now asserts the core's actual seed directly.
3. **Flood-fill scanline rewrite + `opt-level = 3`** — see "Next steps" #2
   above and `baseline-bench.md`'s "Phase 5f" section.
4. **`bench`/`check-bench` flake**: root `bench` script now runs
   `pnpm -r --workspace-concurrency=1 bench` (was `pnpm -r bench`) —
   proven with 3 consecutive clean runs from the repo root.
5. **Rust/TS boundary number validation**: `extractRect`/`writeRect`/
   `diffRect` (`packages/core/src-ts/ts-core.ts`) and their `wasm-core.ts`
   wrappers now reject NaN/fractional/out-of-u32-range inputs identically,
   via a shared `isValidU32` guard, BEFORE any arithmetic or a Wasm call —
   DECISION: reject on the TS facade so wasm-bindgen's own numeric
   coercion is never reached for these inputs.
6. **`build-wasm.mjs` reproducibility hardening**: also remaps `$CARGO_HOME`
   and `$RUSTUP_HOME` (not just the crate dir), and now FAILS the build
   (`process.exit(1)`) if a post-build scan finds any leftover host path or
   backslash-style `.rs` path in the compiled `.wasm` — fail-closed instead
   of trusting the substitution silently worked.
7. **`core-config.ts`'s misleading log**: "no Wasm implementation exists
   yet" read as a claim about the whole package (false since phase 5's
   kernels); reworded to scope the TS-only fact to `PixelCore` specifically
   and name `PixelKernels` as the exception, logged once per session.

Full monorepo `pnpm run typecheck`/`pnpm run test`/`pnpm run bench`/
`pnpm run check-bench` all green; `cargo fmt --check`/
`cargo clippy --all-targets -- -D warnings`/`cargo test` (30/30) all clean.

## Phase 6f (fix-agent pass — Judge A6/B6 findings on phase 6, plus the orchestrator's own fix list)

Fixed, each with a permanent regression test ported from the judge's
confirmed repro (fail before, pass after) or a new test added for the
orchestrator-listed item:

1. **Kill-switch bypass (CRITICAL-adjacent, orchestrator's item #1)**:
   `sprite-pipeline.ts`'s `quantizeIfNeeded`/`downscaleViaKernels` imported
   `@pixelforge/core`'s `resolveKernels()` directly — that function has NO
   knowledge of the `pf:core`/`VITE_PIXEL_CORE` override, so every
   quantize/downscale call attempted to load Wasm regardless of the flag.
   Fixed: both now call a new `lib/core/kernels.ts` export,
   `getActiveKernelsAsync()` — honors the SAME override chain
   `getActiveKernels()` (the sync accessor every other kernel caller uses)
   does, but AWAITS the real resolution (an async caller can afford to)
   instead of racing past it to `tsKernels`. Default confirmed unchanged
   (`'ts'`, per `core-config.ts`'s `resolveCoreImpl`). Tests:
   `kernels.test.ts` (2 new cases: `'ts'` never starts a resolution,
   `'wasm'` resolves to a working kernel), `sprite-pipeline.test.ts` (new
   file, 2 routing cases + 1 fallback-logging case).
2. **`resolveKernels()`/`loadWasmModule()` race (W-B)**: the
   check-then-await-then-set race — two concurrent first callers (e.g.
   `Promise.all`-ing several AI animation frames) each independently
   re-imported/re-instantiated the Wasm module. Fixed: `loadWasmModule`
   now memoizes the IN-FLIGHT promise itself (`loadPromise`), not just the
   resolved module, so concurrent callers share one instantiation. Also
   caches a FAILED load for the session (`hasLoadFailed`/`loadFailure`) —
   no retry storm — and `resolveKernels()` logs the failure via
   `console.error` at most ONCE per session (`hasLoggedLoadFailure`), not
   once per call. Tests: `resolve-core.test.ts` (2 new cases: concurrent
   `loadWasmModule` calls share one `initWasm` invocation; a second
   `resolveKernels()` call after a failure neither retries nor re-logs).
   Plus 3 new `pixel-parity.test.ts` cases directly asserting ts/wasm
   reject the new `MAX_DOWNSCALE_DIMENSION`/`MAX_QUANTIZE_COLORS` bounds
   identically (including the exact 32768x32768 repro, now a clean reject
   with a working post-reject sanity call on the same instance).
3. **Downscale overflow (W-A, CONFIRMED by direct execution against the
   real `.wasm`)**: `downscale(data_1x1, 1, 1, 32768, 32768)` — each of
   `target_w`/`target_h` individually a "valid" `u32`, but
   `target_w*target_h*4 == 2**32`, which wraps to `0` on a 32-bit `wasm32`
   `usize` and trapped the Wasm instance (`RuntimeError: unreachable`).
   Fixed: `MAX_DOWNSCALE_TARGET_DIMENSION` (8192, Rust) /
   `MAX_DOWNSCALE_DIMENSION` (8192, TS — numerically identical, same
   "reject on both sides" convention 5f.5 established) rejects an absurd
   target outright, PLUS `u64`-widened, range-checked arithmetic
   (`downscale.rs`'s new `cell_range` helper and the allocation-size check)
   so the per-cell `ty*src_h`/`tx*src_w` math and the output allocation
   size can never wrap even if the bound were ever raised. Bundled the
   SAME treatment for `quantize`'s `colors` (`MAX_QUANTIZE_COLORS`, 4096
   both sides) — same "individually valid, globally absurd" input class.
   Tests: `cargo test` (3 new: MAX-bound rejection, the exact adversarial
   32768/65536 repro now a clean reject + post-reject sanity call, a
   `cell_range` test simulating wasm32-scale widths without needing to
   actually allocate a multi-GB buffer) + 1 quantize MAX-bound case.
4. **Downscale's perf diagnosis was WRONG, not just unmet (bundled per
   orchestrator instruction)**: phase 6's handoff claimed "FFI-copy
   dominated" — same mistaken-diagnosis pattern phase 5's flood-fill
   handoff made before phase 5f corrected it. The REAL cost:
   `dominant_color` allocated a fresh `HashMap<u32,BucketStats>` (SipHash
   hashing + a heap allocation per unique color bucket) PER CELL, repeated
   `target_w*target_h` times per call. Fixed by adopting a flat-table
   approach (judge B6's confirmed-faster, confirmed-identical patch):
   `slot: Vec<u32>` (one entry per possible bucket key) + `stats:
   Vec<BucketStats>`, both allocated ONCE per `downscale` call and reused
   across every cell (reset only for the entries a cell actually touched,
   not a full sweep) — same vote-counting and first-seen tie-break
   semantics, zero hashing, zero per-cell heap allocation. Verified
   byte-identical: the existing 2,000-case fuzz suite, both oracle-parity
   suites, AND a one-off 20,000-case run (seeds bumped locally, run once,
   reverted to 2,000 for the committed file) all pass unchanged. Bench:
   downscale is now Wasm **2.8x FASTER** than TS (was 1.18x SLOWER) —
   `thresholds.json`'s gate tightened `1.4` -> `0.45`. The false
   "FFI-copy dominated" claim is removed from `baseline-bench.md` and this
   file; see `baseline-bench.md`'s "Phase 6f" section for full numbers.
5. **Avoidable JS-side copy (orchestrator's item #3, bundled with #4)**:
   `sprite-pipeline.ts` did `new Uint8Array(pixels.data)` before every
   kernel call — an `O(buffer size)` COPY (not a view) of a
   `Uint8ClampedArray` into a `Uint8Array`, even though both kernels take
   `data` strictly read-only. Replaced with a zero-copy `Uint8Array` VIEW
   over the SAME underlying `ArrayBuffer` (`new Uint8Array(data.buffer,
   data.byteOffset, data.byteLength)`).
6. **`.gitattributes` added** (SUGGESTION #2 from `verify-report-phase-6.md`
   — no corruption existed, but nothing made the `pkg/` CRLF/LF contract
   explicit/version-controlled): `packages/core/pkg/*.wasm binary`,
   `eol=lf` for the generated `*.js`/`*.d.ts`/`package.json` sidecars.
7. **`design.md`'s stale `PixelKernels` interface snippet** (Coherence
   finding, present since phase 4f) updated to the real flat-buffer-call
   shape, covering `putPoints`/`floodFill`/`cloneBuffer`/`diffRect`/
   `extractRect`/`writeRect`/`bytesEqual`/`quantize`/`downscale` — not the
   phase-4-era `PixelBuffer`/`QuantizeOptions`-object sketch.

Full monorepo `pnpm run typecheck`/`pnpm run test`/`pnpm run bench`/
`pnpm run check-bench` all green (`packages/core` 4,249/4,249, `apps/editor`
294/294, `packages/tokens` 5/5); `cargo fmt --check`/`cargo clippy
--all-targets -- -D warnings`/`cargo test` (55/55)/`cargo deny check` all
clean. Two consecutive `build:wasm` runs byte-identical (all 5 `pkg/`
files); gzip `.wasm` 12,619 bytes (~8.4% of the 150KB budget, DOWN from
14,647 bytes — the flat-table rewrite compiles to less code than
`HashMap`'s generic machinery). No commits made (per instruction).

## Phase 7 status (one-line summary — full writeup earlier in this file)

IMPLEMENTED this session. Default stays `ts`; `'wasm'` is fully wired
(trap-safe) behind the existing `pf:core`/`VITE_PIXEL_CORE` override. Parity
verified by a 300-seed x 60-step differential fuzz (found and fixed one real
bug on its first run — see the "Phase 7" section above). `cargo test`
87/87, `packages/core` 4,265/4,265, `apps/editor` 303/303, gzip `.wasm`
41,234 bytes. No commits made (per instruction).

## Phase 7f (fix-agent pass — verify-report-phase-7 (Judge A) + judges' A7/B7 repro material)

Full detail: `verify-report-phase-7f.md`. Priority order worked:
CRITICAL #1 → CRITICAL #2 → (partial) #5 → #6, then stopped at a coherent
green point — WARNING #3/#4/#7/#8 (remainder) were NOT reached this session.

### How to try the Wasm core now (unchanged mechanism, now actually works)

1. Browser console: `localStorage.setItem('pf:core', 'wasm')` and reload —
   OR set `VITE_PIXEL_CORE=wasm` in `apps/editor`'s env.
2. As of this session, the editor's existing "Restoring your draft…" /
   `docStatus: 'loading'` screen now genuinely waits for the Wasm module to
   finish loading (or fail) BEFORE the canvas becomes interactive — so by the
   time you can draw, `pf:core=wasm` has either taken effect or cleanly
   fallen back to `ts` with one `console.error`. Before this session, setting
   the flag did NOTHING OBSERVABLE, ever (see CRITICAL #1 below) — this is
   the first session where manual browser testing of `pf:core=wasm` is
   actually meaningful to do.
3. If the Wasm core traps mid-session (should be rare — the parity fuzz is
   clean — but possible on inputs it hasn't seen), the editor keeps working:
   the failing action is silently dropped, undo history resets, and
   everything drawn before the trap is safe and gets saved immediately. The
   ONLY signal today is a `console.error` in devtools — there is no toast/
   banner (tracked as a follow-up, no `ErrorBoundary` exists anywhere in
   `apps/editor` yet).

### What changed (CRITICAL, confirmed and fixed)

1. **"The flag was dead."** Re-reading the actual code path (not assumed)
   showed `core.slice.ts`'s `core` is memoized once per session, and the
   FIRST time anything ever touched it always ran before the background
   `loadWasmModule()` had a chance to resolve — so `pf:core=wasm` never
   constructed a real `WasmPixelCore`, in ANY session, ever, before this fix.
   Fixed by awaiting a new `waitForWasmModule()` inside the EXISTING
   `docStatus: 'loading'` startup gate (`services/
   document-persistence.controller.ts`) — only on the `'wasm'` path; `'ts'`
   is byte-for-byte unchanged. Proven against the real built `.wasm` end to
   end: `stores/slices/core.slice.real-trap.test.ts`.
2. **Trap bricks the core, including its own recovery path.** A real trap
   (reproduced with a new test-only `WasmDocument::debug_force_trap()` /
   `WasmPixelCore.debugForceTrap()` — a genuine Rust panic, which this
   crate's `panic = "abort"` profile turns into a real `unreachable` Wasm
   trap) leaves wasm-bindgen's "this object is borrowed" flag stuck forever —
   EVERY later call on that same instance throws a plain `Error`, not another
   `RuntimeError`. Phase 7's recovery design called `exportDocument()` on the
   TRAPPED instance to recover — which, per the above, was ALSO guaranteed to
   throw. Rewritten: `TrapSafePixelCore` treats any exception as fatal-poison
   and rebuilds a `TsPixelCore` from `core.slice.ts`'s OWN last-good state,
   never touching the dead instance again. Undo history is dropped (stated
   plainly, not hidden); the document content itself is NOT lost. `core.
   slice.ts`'s `dispatch` now has a try/catch and requests an immediate
   autosave flush (new `services/document-persistence-flush-bus.service.ts`)
   instead of letting the exception escape uncaught (there is still no
   `ErrorBoundary` anywhere in this app).

### What changed (WARNING, partial)

3. `Document::new`/`WasmDocument::new` now `checked_mul`s its canvas-size
   allocation like every sibling constructor (was the one unchecked one in
   the crate — never reachable today, defense-in-depth).
4. `WasmPixelCore.importDocument` now `.free()`s the OUTGOING `WasmDocument`
   before replacing it — judges' `mem.jb.test.ts` re-run against this
   session's rebuilt `pkg/` confirmed ~1MB of Wasm linear memory leaked PER
   `importDocument` call on a long-lived core (300 calls -> ~303MB, zero
   reclamation in a tight synchronous loop). Fixed and regression-tested
   (verified the new test actually fails without the fix: 21.3MB growth over
   80 calls vs a 1MB budget).

### What's still open (honest list, in the priority order given)

- **WARNING #3** (`importDocument` robustness parity with `TsPixelCore`):
  the NUL-in-layer-name corruption is CONFIRMED real (judges'
  `nul.jb.test.ts`, re-run this session) — `layerNames.join('\u0000')`/
  `.split('\u0000')` desyncs every layer's reported name after one whose name
  contains `\u0000`. Needs a real escaping scheme (e.g. JSON) for the wire
  format — a cross-cutting Rust+TS change, not attempted this session.
  `frameMs` length mismatch / duplicate frame-layer ids on malformed drafts
  were not separately re-audited this session either.
- **WARNING #4** (numeric command-field validation parity, `frame.paste`
  clamping, the pre-existing fractional-index no-op bug in BOTH cores,
  extended differential fuzz ≥400 seeds) — not attempted this session.
- **WARNING #7** (store-loop performance: the real store calls `snapshot()`
  and copies dirty layers after every dispatch; prior sessions measured Wasm
  end-to-end ~1.95x SLOWER than TS through that loop even though the raw
  `PixelCore`-level bench shows Wasm faster) — not attempted this session.
  `wasm-pixel-core.bench.ts` (existing) still only measures the raw core
  call, not the store's per-dispatch `snapshot()`/cache-copy overhead judges'
  `store-loop.bench.ts` targets. **This is the single most important
  remaining item before any default-flip conversation**, since it directly
  contradicts the "Wasm is faster" headline if confirmed in the real loop.
- **WARNING #5** (remainder): checked math elsewhere in `document.rs`
  (`layer_add`, `frame_add`, paste counts, other `Vec::with_capacity` sums)
  was not audited this session beyond `Document::new` (item 3 above).
- **WARNING #6** (remainder): no explicit dispose/teardown path exists for
  the FIRST `WasmDocument` a `WasmPixelCore` ever holds — still relies on GC +
  `FinalizationRegistry`, which verify-report-phase-7 confirmed is fine for
  today's "one long-lived core per session" usage pattern, but would need
  revisiting if a caller starts discarding whole `WasmPixelCore` instances at
  a high rate.
- **WARNING #8** (`layer_revisions`/handle-id-map eviction for
  removed layers/frames) — not attempted this session; still the documented,
  intentional-but-unbounded tradeoff from phase 7 (`LEARNING.md` §29).

### Results this session

`pnpm run typecheck`/`test` all green: `packages/core` 4,266/4,266 (+1),
`apps/editor` 311/311 (+8), `packages/tokens` 5/5. `pnpm run bench`/
`check-bench` green, no regressions (store-LOOP bench not added — see
WARNING #7 above). `cargo fmt --check`/`clippy --all-targets -D warnings`/
`cargo test` 88/88 (+1)/`cargo deny check` all clean. Two consecutive
`build:wasm` runs byte-identical (SHA-256, all 5 `pkg/` files); host-path
scan clean. Gzip `.wasm`: 41,364 bytes (~27.6% of the 150KB budget, was
41,234 — the one-method `debug_force_trap` addition). No commits made (per
instruction).

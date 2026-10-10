# Verify Report — Phase 4f + Phase 5 (migrate-to-rust-core)

**Verifier**: sdd-verify, blind Judge A (scratchpad `judgeA5`)
**Scope**: tasks 4f.1–4f.13, 5.1–5.8 (packages/core Rust flood-fill, pixel-cache
dirty-pair fix, id-seed fix, Rust/TS boundary hardening, build-wasm OS
reproducibility, check-bench fail-closed, editor kernel wiring)
**Mode**: Standard (Strict TDD disabled)

---

## Status: **PASS WITH WARNINGS**

Everything the task list claims was implemented, tested and benched is real
and reproduces under live execution — with two caveats found by adversarial
testing that the prior apply/verify passes did not catch: (1) a real
contract-violation bug in the id-seed override path through `importDocument`,
which makes the regression test written specifically to guard the 4f.3/W4a
fix pass for the wrong reason, and (2) an intermittent, reproducible flake in
the `bench` → `check-bench` CI pipeline itself (fails closed, never silently
passes, but redness is non-deterministic). No evidence of flood-fill
behavioral drift between the TS reference, Wasm, and the original editor
implementation — the three algorithms are byte-for-byte identical by
construction and this was confirmed, not just read.

---

## Executive summary (≤8 lines)

Flood-fill parity holds: Rust, the from-scratch TS kernel mirror, and the
ORIGINAL `apps/editor/src/lib/flood-fill.ts` are algorithmically identical
(4-connected, stack-based, visited-array, alpha-sensitive, same-color no-op) —
verified by direct line-by-line comparison, not inference. Full suite re-run
live: `typecheck` green (4/4 packages), `cargo fmt/clippy -D warnings/test`
30/30 clean, `pnpm run test` 172/172 (core) + 276/276 (editor) + 5/5 (tokens),
`pnpm run bench` reproduces the ~2.3-2.6x documented ratio, wasm rebuilt into
a scratch dir is byte-identical to committed `pkg/`. Found: (1) `setIdSeed()`
is silently discarded on the `importDocument()` path because `payloadToDoc`
unconditionally burns the one-shot override before `createCoreState` ever
sees it — the dedicated W4a regression test passes for the wrong reason; (2)
`pnpm run bench && pnpm run check-bench` at the repo root is flaky — one
bench file's groups can be dropped from the aggregated `core-results.json`
under `pnpm -r`'s concurrent execution, reproduced on attempt 1, gone on
attempt 2. Everything else (dirty-pair cache, Rust/TS boundary hardening,
build-wasm path substitution, kernel wiring, LEARNING.md) checks out.

---

### Completeness

| Metric | Value |
|---|---|
| Phase 4f tasks | 13/13 marked done (4f.13 commit intentionally left, per every prior phase's convention) |
| Phase 5 tasks | 8/8 marked done (5.8 commit intentionally left, same convention) |
| Tasks incomplete | None outside the documented no-commit convention |

### Build & Tests Execution (re-run live by this verifier, not trusted from prior reports)

**Typecheck**: PASSED — `pnpm run typecheck` (4 of 5 workspace projects: packages/core, packages/tokens, apps/landing, apps/editor) all `Done`, zero errors.

**Rust**: PASSED — `cargo fmt --check` clean, `cargo clippy --all-targets -- -D warnings` clean, `cargo test` **30/30** passing (9 pixels + 21 flood_fill/pixels-hardening, matches HANDOFF's "20/20" phase-4f count plus the 10 new flood-fill cases = 30, consistent). No `unsafe`, no `.unwrap()`/`.expect()` outside `#[cfg(test)]` blocks (confirmed via `rg`). `src/pixels/mod.rs` and `src/flood_fill.rs` have zero `wasm_bindgen` imports — only `src/bindings.rs` does (hexagonal split holds).

**Tests**: PASSED — `pnpm run test`: packages/tokens 5/5, packages/core 172/172, apps/editor 276/276. Matches the numbers claimed in `baseline-bench.md`/HANDOFF.md exactly.

**Bench**: PASSED (numbers reproduce), but see CRITICAL-adjacent flake below. Flood-fill wasm/ts ratio on this run: full-fill 0.38-0.39x (~2.5-2.6x faster), maze/holes 0.38-0.42x (~2.3-2.6x faster) — consistent with the documented "NOT MET 3x, MET <5ms absolute" conclusion. `putPoints` batched ~1.27-1.29x slower, `extractRect`/`writeRect` ~1.0-1.1x — matches phase-4f numbers.

**check-bench**: FAILED on first live run, PASSED on second identical run — see WARNING-real #2.

**Wasm reproducibility**: PASSED — rebuilt `packages/core` into a scratch out-dir (`wasm-pack build --target web --release` with the same `--remap-path-prefix` RUSTFLAGS `build-wasm.mjs` uses, plus the same post-build backslash→forward-slash substitution logic applied manually), and the resulting `pixelforge_core_bg.wasm`, `.js` glue and `.d.ts` are **byte-identical** to the committed `packages/core/pkg/` (verified via `cmp`/`diff`, not just size comparison).

---

## Adversarial findings

### CRITICAL — `setIdSeed()` is silently discarded on the `importDocument()` path; the W4a regression test for this exact scenario passes for the wrong reason

**Where**: `apps/editor/src/lib/core/ts-core.ts:1497-1503` (`payloadToDoc`, unconditional `const minter = makeLocalIdMinter()`), `ts-core.ts:1434-1436` (`makeLocalIdMinter` consumes+nulls the module-level `idSeedOverride`), `ts-core.ts:194-196` (`createCoreState`'s own `idSeedOverride ?? randomIdSeed()`), `apps/editor/src/lib/core/pixel-core.ts:141-142` (`importDocument(doc) { this.state = createCoreState(payloadToDoc(doc)) }`), test: `apps/editor/src/lib/core/ts-core.ids-and-validation.test.ts:49-63`.

**Scenario**: `setIdSeed('s')` is meant to make the *next* `CoreState` constructed mint ids under prefix `s`. But `TsPixelCore.importDocument(doc)` evaluates `payloadToDoc(doc)` **before** `createCoreState(...)` runs (ordinary JS argument-evaluation order — `createCoreState(payloadToDoc(doc))`). `payloadToDoc` calls `makeLocalIdMinter()` **unconditionally**, on every invocation, regardless of whether the payload actually has any duplicate/corrupted ids needing repair — and that call alone consumes and nulls `idSeedOverride` (the exact "consumed once" mechanism 4f.3 introduced to fix W4a). By the time `createCoreState` runs immediately after, `idSeedOverride` is already `null`, so it falls through to `randomIdSeed()` — a fresh UUID-based prefix, **not** `s`.

**How confirmed**: Traced the exact call chain and JS evaluation order in the source (not inferred) — `payloadToDoc`'s minter construction at line 1503 happens unconditionally inside the `try` block, before any duplicate-check logic that would actually use it. Then re-read `ts-core.ids-and-validation.test.ts:56-59`:
```
setIdSeed('s')                 // consumed immediately by `new TsPixelCore(makeDoc())` on the next line
const b = new TsPixelCore(makeDoc())
b.importDocument(payload)      // idSeedOverride is already null here — payloadToDoc/createCoreState both fall back to a random seed
b.dispatch({ type: 'frame.add' })
```
The test's own comment ("re-seeds `b`'s internal core from `payload`, still under seed 's'") does not match what the code does: `b`'s seed after `importDocument` is a random UUID prefix, not `'s'`. The test still passes — but only because a random prefix trivially avoids colliding with `'s'`-prefixed ids already in the payload, not because the `highestIdSuffix` collision-scan logic the fix introduced was ever meaningfully exercised under a real same-seed collision through the `importDocument` path (the ONLY path production code uses to restore a stored draft).

**Impact**: Not a live production bug today — production never calls `setIdSeed` (confirmed: only test files reference it), and the random-per-instance-seed + `highestIdSuffix` scan still makes collisions practically impossible in production regardless. But it is a real, confirmed contract violation against design.md's own stated guarantee ("Parity tests that need two independently-constructed cores to mint the SAME id sequence call `setIdSeed(sameSeed)` before constructing each one") for exactly the path (`importDocument`) that path exists for, and it means the specific regression test written to cover 4f.3/W4a's `importDocument` collision scenario provides **false confidence** — it would not catch a regression to the pre-4f.3 bug in the `importDocument` path specifically, because it never actually exercises a same-seed collision there. This also silently sets up a future failure: phase 7's TS↔Wasm parity suite (`pixel-core.contract.test.ts`'s own pattern, `describe.each(['ts','wasm'])`) will need `setIdSeed` + `importDocument` to produce deterministic, comparable id sequences across two independently-constructed cores — today it can't.

**Fix direction (not applied — read-only verification)**: either make `payloadToDoc` lazily construct its minter only when it's actually about to mint an id (fallback layer / duplicate repair), or have `TsPixelCore.importDocument` capture `idSeedOverride` once itself before calling `payloadToDoc`, and thread it through explicitly instead of relying on a shared mutable module-level flag with two unordered consumers.

---

### WARNING-real — `pnpm run bench` → `pnpm run check-bench` is flaky at the repo root; reproduced live

**Where**: `packages/core/vitest.config.ts:10` (`benchmark.outputJson: '../../bench/core-results.json'`), interaction with root `package.json`'s `"bench": "pnpm -r bench"`.

**Scenario**: Ran the documented CI sequence twice, back to back, with no code changes in between:
- Run 1: `pnpm run bench` (root) → `pnpm run check-bench` → **FAILED**. `bench/core-results.json` contained only `flood-fill.bench.ts`'s 2 groups; `pixel-kernels.bench.ts`'s 3 groups (including the 2 gated ones, `put_points batched x2000...` and `extractRect + writeRect...`) were missing from the file entirely, even though the console output for that same run clearly printed all 5 benchmark groups having run successfully.
- Run 2: identical commands, same machine, no changes → **PASSED**, all 4 gates present and within budget.
- Isolation test: running `cd packages/core && pnpm run bench` directly (not via the root's `pnpm -r bench`) consistently produced a complete `core-results.json` with all 5 groups.

**How confirmed**: Directly reproduced via live execution (not reported secondhand) — `bash` output of both attempts is reproducible in this session's history; inspected `bench/core-results.json`'s actual JSON content with a small Node script after each run to confirm which groups were present.

**Root cause (not fully diagnosed, flagged for follow-up)**: likely a race in Vitest's (self-described "experimental") benchmark `outputJson` writer when `packages/core`'s own two bench files run as part of the same `vitest bench --run` invocation under the additional CPU/scheduling contention `pnpm -r bench` introduces by also running `apps/editor`'s bench concurrently — the aggregated JSON write for one bench file can clobber or fail to merge with the other's.

**Impact**: `check-bench`'s fail-closed design (4f.8/W7) does its job here — it never silently passes on missing data, so this flake shows up as a hard CI failure, not a silent false green. But it means the "CI Enforces Tests, Benchmarks, and Drift Check" gate (core-parity-gate's own requirement) is **non-deterministically red** for reasons unrelated to any actual code regression, which erodes trust in the gate and will generate spurious re-run requests on real PRs. Not mentioned in HANDOFF.md, baseline-bench.md, or any prior verify report — this is a new finding.

---

### WARNING-theoretical — none found rising to this level beyond the two above (the build-wasm substitution logic, inspected specifically for false-positive byte corruption per the task brief, has no overlap risk: exactly 4 `.rs` files exist in `packages/core/src` — `lib.rs`, `bindings.rs`, `flood_fill.rs`, `pixels/mod.rs` — none of whose relative paths is a substring of another's, and the backslash-containing search string is specific enough that an accidental match elsewhere in a release-optimized Wasm binary is not a realistic risk)

---

### SUGGESTION

- Consider asserting, in a future regression test, that `b.snapshot()`'s (or the internal `CoreState.idSeed`, if exposed for testing) seed after `importDocument()` actually equals the `setIdSeed` value passed immediately before — this would have caught the CRITICAL finding above directly instead of requiring a full evaluation-order trace.
- Consider pinning/serializing `pnpm -r bench` (e.g., `pnpm -r --workspace-concurrency=1 bench`) or giving `packages/core`'s benchmark config a per-file output path merged afterward, to remove the check-bench flake instead of relying on fail-closed to merely convert it into a visible (but spurious) CI failure.

---

## Correctness (Static — Structural Evidence)

| Requirement | Status | Notes |
|---|---|---|
| Flood-fill matches across implementations (pixel-core) | COMPLIANT | Rust (`flood_fill.rs`), TS reference (`packages/core/src-ts/ts-core.ts:184-230`) and the ORIGINAL editor TS (`apps/editor/src/lib/flood-fill.ts`) are line-for-line the same algorithm: 4-connected, `Vec`/array-as-stack, `visited` array, alpha-sensitive color compare, same-color seed no-op. 9 parity cases + 126-case fuzz suite in `packages/core`, 2 dedicated wiring tests in `apps/editor`. |
| Flood-Fill Performance (<5ms, ≥3x) | PARTIAL (honestly reported, not a gate violation) | <5ms met with large margin (~1ms); ≥3x NOT met (~2.3-2.6x) — `thresholds.json` gates the measured reality, not the spec's aspirational number, which is itself worth the orchestrator/product owner re-confirming is acceptable to ship, since it's a literal gap against the `pixel-core` spec's stated requirement. |
| Rust/TS boundary hardening (W2/W3) | COMPLIANT | `valid_buffer`/`checked_add`/`checked_mul` in every `pixels::*` function; mirrored with explicit sign checks in TS (`tsKernels`) and `apps/editor/src/lib/pixel-buffer.ts`'s `isValidRect`. 7 new adversarial `cargo test` cases pass live. |
| Pixel-cache dirty-pair contract (C1/W8) | COMPLIANT | `DispatchResult.dirty`/`.evicted` carry explicit `(frameId, layerId)` pairs; `core.slice.ts`'s refresh is driven entirely by them; `frame.select`'s own instance of the bug is fixed identically to `stroke.begin`'s. |
| Id-seed collisions on direct construction (W4a) | COMPLIANT | `highestIdSuffix` scan in `createCoreState` works correctly for `new TsPixelCore(doc)` / direct `createCoreState(doc)` calls. |
| Id-seed override through `importDocument` (W4a) | **NOT COMPLIANT** (see CRITICAL above) | `setIdSeed` + `importDocument` does not propagate the override; regression test passes for an unrelated reason. |
| `frame.paste`/`doc.replace` byte-length validation (W5/4f.4) | COMPLIANT | Live tests pass (`ts-core.ids-and-validation.test.ts:111-156`), confirmed by direct read of `payloadToDoc`'s `isValidLayerPayload` gate and the command-level rejections. |
| Reproducible `pkg/` across OS (W1) | COMPLIANT | Verified independently by this review: scratch rebuild byte-identical to committed `pkg/`. |
| check-bench fails closed (W7) | COMPLIANT in design, but see WARNING-real above for the underlying pipeline flake it is correctly catching |
| Editor fill wiring (sync/async bridge, runtime-trap fallback) | COMPLIANT | `kernels.ts`'s `getActiveKernels()` correctly stays synchronous, defaults to `tsKernels`, honors the `pf:core`/`VITE_PIXEL_CORE` chain re-read on every call; `resolve-core.ts`'s `withRuntimeTrapFallback` + module-level `demotedToTsForSession` flag correctly demotes every caller on a real trap. Undo entry/dirty-pair shape in the `fill` case is unchanged from pre-phase-5 behavior. |

## Coherence (Design)

| Decision | Followed? | Notes |
|---|---|---|
| Stack-based, no-recursion flood fill (design.md Phase 5) | Yes | `Vec<usize>` explicit stack, confirmed via code + the `bounded_stack_handles_a_large_fully_connected_canvas` test. |
| `visited` array kept, not dropped (the reverted optimization) | Yes | Confirmed in both `flood_fill.rs` and `tsKernels.floodFill`; documented honestly in `LEARNING.md` §12 and `baseline-bench.md`. |
| Dirty-pair cache contract replacing the old "current frame" guess | Yes | `core.slice.ts` matches the design.md "Phase 4f" section's description exactly. |
| `PixelKernels` facade narrowed (no per-pixel `getPixel`/`putPixel`) | Yes | Confirmed via `resolve-core.ts`'s `PixelKernels` shape — no `getPixel`/`putPixel`. |

## LEARNING.md accuracy (Phase 5, §7-12)

Read in full and cross-checked against the actual `flood_fill.rs`/`bindings.rs` line references it cites — all accurate: `Vec` as a stack (§7), `while let Some(p) = pending.pop()` (§8), the no-recursion stack-overflow math (§9), `u32` RGBA packing (§10), the `Option<(u32,u32,u32,u32)>` → `Option<Box<[u32]>>` tuple-bridging explanation (§11), and the reverted-optimization honesty note (§12). No factual errors found this pass.

## Verdict

**PASS WITH WARNINGS.** No CRITICAL blocks the ship-as-is-Wasm-fallback-remains-optional state of phase 5 (the `setIdSeed`/`importDocument` bug is a test-integrity and future-parity-gate risk, not a live user-facing defect, since production never calls `setIdSeed`). The bench-pipeline flake is operational, not behavioral. Recommend: fix `payloadToDoc`'s eager minter construction (or thread the seed explicitly) before phase 7 adds a real `WasmCore` that needs `setIdSeed` + `importDocument` determinism for its own parity suite, and investigate/pin the `pnpm -r bench` concurrency issue before relying on CI's bench gate for every future PR.

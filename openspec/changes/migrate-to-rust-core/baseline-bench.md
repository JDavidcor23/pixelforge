# Phase 0 baseline — TS implementation (pre-port reference)

Recorded 2026-10-09, local dev machine (win32, Node v24.14.1, Vitest 4.1.4),
via `pnpm run bench` (`vitest bench --run`) and the undo-memory baseline test.
Per design.md: "absolute times are noisy on CI" — later phases compare the
**ratio** between Wasm and TS measured in the same run (`scripts/check-bench.ts`
in phase 4), not these absolute numbers directly. These numbers exist to
satisfy core-parity-gate "Baseline exists before a port starts" and as a
sanity reference.

## Full canvas repaint — 256x256, 1 fully-opaque layer
`src/app/editor/lib/canvas-renderer.bench.ts`

Current implementation: one `fillRect` draw call per opaque pixel
(`RgbaColor[][]`), run against a no-op `CanvasRenderingContext2D` stub (no
real browser canvas exists in the Vitest `node` environment — this isolates
the render-loop's own JS cost, not real paint time).

| Metric | Value |
|---|---|
| mean | 4.20 ms |
| min / max | 4.05 ms / 5.94 ms |
| p99 | 5.55 ms |
| samples | 120 |

Phase 1 exit criterion: full 256x256 repaint under 4ms AND >=5x gain over
this baseline (pixel-core "Full Canvas Repaint Performance"). Caveat: a real
browser `fillRect` loop costs more than this no-op stub, so the real-world
gain from switching to `putImageData` should be larger than this number alone
suggests.

## Flood-fill — full 256x256 canvas, single uniform region
`src/app/editor/lib/flood-fill.bench.ts`

Current implementation: BFS over `RgbaColor[][]` with a `Set<string>`
visited-key per pixel and object allocation per filled pixel.

| Metric | Value |
|---|---|
| mean | 50.36 ms |
| min / max | 45.06 ms / 55.82 ms |
| p99 | 55.82 ms |
| samples | 10 |

Phase 5 exit criterion: Rust flood-fill under 5ms AND at most 1/3 of this
baseline's duration (pixel-core "Flood-Fill Performance") — i.e. Rust must
land at or below ~16.8ms-equivalent-ratio of this run's TS baseline, re-measured
against the phase-5 TS baseline at that time.

## Undo memory — one `pushHistory()` entry
`src/app/editor/lib/history.undo-memory.baseline.test.ts`

Reference scenario (per design.md edit-history budget): a 1px stroke on a
64x64 canvas, 8 frames, 4 layers. Measured in raw RGBA channel bytes
(`w * h * 4` per layer buffer) — the same unit phase 2's dirty-rect patches
are measured in, not V8 object/array overhead.

Today's `pushHistory()` snapshots the ENTIRE document per entry: the top-level
`layers` array AND every frame's own `layers` (duplicated), regardless of how
small the actual edit was.

| Metric | Value |
|---|---|
| Retained bytes per entry | 589,824 bytes (576.0 KB) |
| Formula | `(4 layers + 8 frames * 4 layers) * 64 * 64 * 4` |

Phase 2 exit criterion: dirty-rect history keeps a 1px stroke on this same
scenario under 1 KB (edit-history "Bounded Undo Memory") — roughly a
**576x** reduction target vs. today's full-snapshot approach.

## Phase 2 result — dirty-rect history entry (same reference scenario)

Recorded 2026-10-09, measured directly via
`lib/history.undo-memory.baseline.test.ts` and
`lib/core/ts-core.test.ts` against `lib/core/ts-core.ts`'s dispatch engine
(`stroke.begin` -> `stroke.points` (1 point) -> `stroke.end`) on the
identical 64x64/8-frame/4-layer scenario.

| Metric | Value |
|---|---|
| Retained bytes per entry | 8 bytes (4 bytes `before` + 4 bytes `after`, one 1x1 RGBA patch) |
| vs. phase 0/1 baseline | 589,824 bytes -> 8 bytes — **73,728x** reduction |
| Budget (<1 KB) | PASSED |

The entry size is independent of frame/layer count (confirmed by the same
test using `makeDoc(64,64,8,4)`): the dirty-rect design only ever retains
the bytes a command actually touched, not the whole document.

## Phase 2 result — full canvas repaint (live render path)

`src/app/editor/lib/buffer-to-canvas.bench.ts` (replaces the deleted
`canvas-renderer.bench.ts` — see carry-over item C; the old bench targeted
`renderPixelGrid`, confirmed dead code, never reached by the live Konva
renderer). Same 256x256 fully-opaque-layer scenario, now measuring
`renderPixelsToCanvas` from `lib/buffer-to-canvas.ts` directly (the function
the live `SpriteLayers.tsx`/`SelectionOverlay.tsx` actually call per layer).

| Metric | Value |
|---|---|
| mean | 0.0756 ms |
| min / max | 0.0240 ms / 1.7679 ms |
| p99 | 0.4719 ms |
| samples | 6611 |

Well under the 4ms repaint budget.

## Phase 3 — monorepo split: dev-server budgets + regression check

Recorded 2026-10-09, same machine, after moving the editor into
`apps/editor` (Vite 6.4.4 + React 19.2.4 + react-konva 19.2.3, pnpm workspace).
Method: `pnpm --filter @pixelforge/editor dev` (or `pnpm exec vite`), reading
Vite's own self-reported `ready in Xms` line for cold start; for HMR, a file
write's wall-clock delta to the dev server's `hmr update` log line (an
approximation — no browser client was attached to measure the actual
re-render, since this agent has no browser/screenshot tool available this
run).

| Metric | Budget | Measured | Result |
|---|---|---|---|
| Dev cold start | < 2 s | 337 ms – 663 ms (3 separate runs) | PASSED |
| HMR (file write -> server `hmr update` log line) | < 200 ms | ~1 s wall-clock in this sampling harness (includes a deliberate 1s sleep before reading the log — see note) | Not independently confirmed sub-200ms; Vite's own HMR push is well-documented as sub-100ms once a client is connected. **Needs re-measurement with a real browser client** (e.g. Playwright) attached to get a trustworthy number — tracked as a follow-up, not silently passed. |

Regression check — same two benches re-run unchanged, now under
`apps/editor/vite.config.ts` instead of the old root `vitest.config.ts`:

| Bench | Phase 2 (pre-move) | Phase 3 (post-move) | Regression? |
|---|---|---|---|
| Full canvas repaint (mean) | 0.0756 ms | 0.0807 ms – 0.0826 ms (2 runs) | No — within noise |
| Flood-fill (mean) | not a phase-3 gate (phase 5 reference) | 2.58 ms – 2.68 ms (2 runs) | No — consistent with prior measurements |

Full test suite: 252/252 passing (242 pre-existing + 10 new
`apps/editor/api/ai/{retro-diffusion,elevenlabs}.test.ts` Vercel Function
smoke tests), `tsc --noEmit` clean in all 3 packages (`apps/landing`,
`apps/editor`, `packages/tokens`).

**Explicitly NOT measured this phase (needs a real build, forbidden this
pass per instruction)**: production bundle size per app, and confirming no
Retro Diffusion/ElevenLabs key string appears in the client bundle (task
3.14) — measure on the first allowed `pnpm --filter @pixelforge/editor build`.

## Phase 4 — packages/core Rust scaffold (pixel-buffer kernels)

`.wasm` size budget (workspace-build "Wasm Artifact Size Budget", <150KB
gzip), `wasm-pack build --target web --out-dir pkg --release`:

| Artifact | Raw | Gzip | Budget | Result |
|---|---|---|---|---|
| `pixelforge_core_bg.wasm` | 22,998 bytes (~22.5 KB) | 10,527 bytes (~10.3 KB) | 153,600 bytes (150 KB) | PASSED, ~7% of budget |

Wasm vs TS kernel bench (`packages/core/bench/pixel-kernels.bench.ts`,
`vitest bench`, this machine, Wasm built with `--release`) — **honest
numbers, not cherry-picked**: at phase-4 granularity (simple get/set
kernels, not yet the compute-heavy flood-fill/quantize kernels phases 5-6
port), Wasm does **not** win, and in the worst case it loses by three
orders of magnitude:

| Case | TS mean | Wasm mean | Wasm/TS ratio | Note |
|---|---|---|---|---|
| `put_pixel` x2000, one JS↔Wasm call per point | 0.0982 ms | 145.52 ms | **~1481x slower** | Worst case for Wasm: the JS↔Wasm marshalling cost (copy `&mut [u8]` in, copy it back out — see `LEARNING.md` §4) is paid on EVERY call; calling a kernel once per pixel pays that cost 2000 times. This is exactly why production code never will — `stroke.points` (design D6/D7) batches a whole drag gesture into one `Int32Array` + one dispatch. |
| `extractRect` + `writeRect`, one whole-128x128-rect call each way (64KB patch) | 0.1179 ms | 0.1578 ms | ~1.34x slower | Best case this phase can show: the marshalling cost is paid ONCE per call, amortized over 64KB. Wasm still loses here — these are trivial memcpy-shaped kernels where V8's JIT is already near-optimal; the kernels expected to actually win (flood-fill's graph traversal, quantize's per-pixel color math) land in phase 5/6. |

**Conclusion for phase 4 (documented, not spun)**: the Rust/Wasm port does
not pay for itself yet — that is expected and consistent with design.md's
placement of flood-fill/quantize/downscale (compute-bound kernels) in
phases 5-6, after this scaffold. `packages/core/bench/thresholds.json`'s
budgets are set just above these measured ratios (not an aspirational
target), so CI's `check-bench` documents a regression against THIS
baseline without re-litigating a known, expected characteristic of
per-call Wasm boundary cost. Batch size where Wasm would plausibly start
winning, per the "amortize the fixed per-call cost" pattern above: once a
single call's compute cost exceeds the ~145ms/2000 ≈ 0.073ms per-call
marshalling overhead by a wide margin AND the kernel does real work per
byte (not a near-memcpy) — flood-fill's seed-fill graph walk and
quantize's per-pixel color-distance search are the first candidates,
measured for real in phases 5/6.

`cargo test`: 9/9 passing (`packages/core/src/pixels/mod.rs`, pure-Rust
domain, no Wasm runtime). `cargo fmt --check`/`cargo clippy --all-targets -- -D warnings`:
both clean. `packages/core` TS suite (`pixel-parity.test.ts`,
`describe`/`it.each` over `['ts','wasm']`): 12/12 passing — both
implementations agree byte-for-byte on every case.

## Phase 4f — judgment-day fixes (C1/W1-W8/T1 boundary hardening + batched kernel)

T1 removed the per-pixel `getPixel`/`putPixel` from the public `PixelKernels`
facade and replaced the old meaningless per-call `put_pixel x2000` CI gate
(W7) with a gate on a BATCHED operation instead — `putPoints` writing all
2000 points in ONE call. The old per-call shape still runs as an
*informative* (non-gating) bench row, now built on `putPoints` called once
per point (no raw `putPixel` left in the facade to call it with).

`.wasm` size budget, rebuilt after W2/W3 hardening (checked arithmetic) + T1
(`put_points` kernel) + W1 (OS-independent build — `--remap-path-prefix` +
source-path normalization, see `scripts/build-wasm.mjs`):

| Artifact | Raw | Gzip | Budget | Result |
|---|---|---|---|---|
| `pixelforge_core_bg.wasm` | 24,240 bytes (~23.7 KB) | 10,960 bytes (~10.7 KB) | 153,600 bytes (150 KB) | PASSED, ~7% of budget |

Wasm vs TS kernel bench (this machine, Wasm `--release`), re-measured after the refactor:

| Case | TS mean | Wasm mean | Wasm/TS ratio | Gated? |
|---|---|---|---|---|
| `putPoints` x2000, one call PER point (informative) | 0.2185 ms | 68.27 ms | ~312x slower | No — informative row only, no `thresholds.json` entry (W7) |
| `putPoints`, 2000 points in ONE call (the real batch gate) | 0.1012 ms | 0.1295 ms | ~1.28x slower | Yes — budget 2.0x |
| `extractRect` + `writeRect`, one whole-128x128-rect call each way | 0.0962–0.1161 ms | 0.1127–0.1279 ms | ~1.07–1.3x slower | Yes — budget 3.0x (unchanged) |

**Conclusion**: batching the SAME 2000-point workload into one call instead
of 2000 drops the Wasm/TS ratio from ~312x to ~1.28x — the marshalling cost
is now paid once instead of 2000 times, exactly the effect design D6/D7
predicted. Still TS-favored (expected at this granularity — these remain
near-memcpy kernels; real Wasm wins are still expected from phase 5's
flood-fill). `check-bench.ts` (W7) now fails closed on a missing bench
group/row or zero checked cases, instead of silently passing — verified via
synthetic fixtures (missing group, empty results, zero gate entries all now
exit 1).

`cargo test`: 20/20 passing (9 original + 7 new W2/W3 boundary-hardening
cases + 4 new `put_points` cases). `cargo fmt --check`/`cargo clippy
--all-targets -- -D warnings`: both clean. `cargo deny check` (advisories,
bans, licenses, sources — W1 widened from licenses-only): all four pass.
`packages/core` TS suite: 29/29 passing (12 original, rewritten around
`putPoints`/`extractRect` instead of the removed `getPixel`/`putPixel` + 8
new W2/W3 parity cases + 9 new W6 production-loader/fallback/runtime-trap
cases). `apps/editor` suite: 271/271 passing (252 original + 15 C1/W4/W5
regression tests + 4 pixel-buffer hardening tests). Full monorepo
`pnpm run test`/`pnpm run typecheck`/`pnpm run bench`/`pnpm run check-bench`:
all green.

## Phase 5 — Rust flood-fill (first compute-heavy kernel; first real editor wiring)

`.wasm` size budget, rebuilt with `flood_fill`/`put_points` (phase 4f)/all prior kernels:

| Artifact | Raw | Gzip | Budget | Result |
|---|---|---|---|---|
| `pixelforge_core_bg.wasm` | 26,284 bytes (~25.7 KB) | 11,769 bytes (~11.5 KB) | 153,600 bytes (150 KB) | PASSED, ~7.7% of budget |

Reproducibility (D9): two consecutive `pnpm run build:wasm` runs on this
machine produced byte-identical `.wasm` output (`cmp` exit 0); a binary scan
for the Windows-style `src\pixels` path (the W1 bug class) found zero matches
in the rebuilt artifact.

**Wasm vs TS flood-fill bench** (`packages/core/bench/flood-fill.bench.ts`,
this machine, Wasm `--release`, 3 repeated runs to confirm stability) — two
cases per design.md's phase-5 exit criterion: a full 256x256 fill (worst-case
reachable area) and a 256x256 "maze/holes" canvas (a grid of 1px walls with
gaps, a more realistic bucket-fill shape):

| Case | TS mean | Wasm mean | Wasm/TS ratio | Absolute (<5ms)? | ≥3x faster? |
|---|---|---|---|---|---|
| Full fill (run 1/2/3) | 2.45 / 2.45 / 2.48 ms | 0.976 / 0.975 / 0.962 ms | 0.399 / 0.398 / 0.387 (~2.5-2.6x faster) | PASSED (well under 5ms) | **NOT MET** (target ≤0.333, i.e. ≥3x) |
| Maze/holes (run 1/2/3) | 2.11 / 2.11 / 2.15 ms | 0.918 / 0.906 / 0.907 ms | 0.434 / 0.429 / 0.421 (~2.3-2.4x faster) | PASSED (well under 5ms) | **NOT MET** (target ≤0.333, i.e. ≥3x) |

**Conclusion (honest, not spun): the absolute-time target is met with room
to spare, the ≥3x-faster-than-TS target from the proposal is NOT met.**
Flood-fill is the first kernel where Wasm wins outright (every phase-4
kernel lost or barely broke even), confirming design.md's phase-4 prediction
that a compute-heavy, per-byte-real-work kernel is where the FFI boundary's
fixed whole-buffer-copy cost finally gets amortized over enough actual
compute to pay for itself — but it lands at ~2.3x-2.6x, not 3x.

**One optimization was tried, measured, and reverted** (documented in
`flood_fill.rs`'s module doc and `LEARNING.md`'s Phase 5 §12, not silently
dropped): removing the separate `visited` bool array, relying instead on
"a pixel just filled can never again match the target color" as an implicit
visited check, to save one `w*h`-sized allocation per call. Measured result:
a NET REGRESSION, not a win —

| Variant | Full-fill ratio | Maze/holes ratio | Verdict |
|---|---|---|---|
| With `visited` (kept) | ~0.39-0.43 (~2.3-2.6x faster) | ~0.42-0.43 | Faster |
| Without `visited` (reverted) | ~0.74 (~1.35x faster) | ~0.81 (~1.24x faster) | Slower — regression |
| Without `visited`, deferred div/mod fix | ~0.6-0.77 (~1.3-1.7x faster, noisy) | ~0.6-0.65 | Still slower than WITH `visited` |

Root cause: `visited[p]` is a single cheap byte read that rejects a stale
duplicate stack entry immediately; the color-check-only approach needs 4 byte
reads every time a duplicate is popped, and a 4-connected fill produces up to
4 duplicate stack entries per pixel — the extra per-duplicate cost outweighed
the allocation saved. Reverted to the `visited`-array version (the
honestly-faster one) in both the Rust and TS implementations.

**Open item, not silently loosened**: `packages/core/bench/thresholds.json`
gates both flood-fill cases at `maxWasmToTsRatio` 0.45 (full fill) and 0.48
(maze/holes) — set just above the measured reality (~0.39-0.43), not the
proposal's aspirational 0.333 (3x). A `_comment_flood_fill` key in that file
records this gap explicitly so a future pass trying to close it (e.g. a
scanline algorithm, or reducing the per-call FFI copy some other way) has
the real baseline to beat, not a faked one.

`cargo test`: 30/30 passing (20 prior + 10 new `flood_fill` cases: full fill,
wall/hole stop, diagonal-leak rejection, out-of-bounds seed, same-color
no-op, transparent-vs-opaque, short-buffer rejection, zero-sized-canvas
rejection, maze-shape hole preservation, bounded-stack large-canvas
sanity). `cargo fmt --check`/`cargo clippy --all-targets -- -D warnings`/
`cargo deny check`: all clean. `packages/core` TS suite: 172/172 passing
across 3 files — `pixel-parity.test.ts` (41, including 8 new
`it.each(['ts','wasm'])` `floodFill` parity cases x 2 implementations plus
one single-case ts/wasm byte-for-byte maze comparison = 17 new cases this
phase), the new `flood-fill.fuzz.test.ts` (126: a 100-seed random-maze
suite, a 20-seed out-of-bounds/same-color suite, and 6 adversarial-short-
buffer cases), and the pre-existing `resolve-core.test.ts` (5, untouched
this phase). `apps/editor` suite: 276/276 passing (271 confirmed before this
phase's editor-wiring changes + 3 new `kernels.test.ts` cases + 2 new
`ts-core.kernels-wiring.test.ts` cases). Full monorepo `pnpm run typecheck`/
`pnpm run test`/`pnpm run bench`/`pnpm run check-bench`: all green.

## Phase 5f — fix-agent pass: scanline span fill, `opt-level = 3`, warm bench methodology

Two blind judges (scratchpad `judgeA5`/`judgeB5`) found that phase 5's
"next steps" guess (chase the per-call FFI whole-buffer copy) was wrong —
`judgeB5/decomp.mts` isolated that cost on its own (a `put_points` call with
zero points on the same 256KB buffer) and measured it at **~1.6% of a full
flood-fill call's time**. The real lever was compute: the OLD per-pixel
stack algorithm did one 4-byte color check PER PIXEL (including rejected
duplicate pops); the NEW scanline span-fill algorithm (`flood_fill.rs` +
`ts-core.ts`'s `tsKernels.floodFill`, both rewritten together) does one per
contiguous RUN instead. `judgeB5/scancheck.mts` independently verified a
scanline Rust prototype against the TS kernel byte-for-byte on 20,000
randomized cases before this rewrite was committed to the real source.

**`.wasm` size, rebuilt with the scanline algorithm + `opt-level = 3`:**

| Artifact | Raw | Gzip | Budget | Result |
|---|---|---|---|---|
| `pixelforge_core_bg.wasm` (opt-level 3, scanline) | 22,291 bytes | **10,273 bytes** | 153,600 bytes (150 KB) | PASSED, ~6.7% of budget |
| same source, opt-level "z" (A/B comparison, scratch build) | 26,521 bytes | 11,833 bytes | — | Larger — see LEARNING.md §16 for why |

`opt-level` switched from `"z"` (size) to `3` (speed) in `Cargo.toml` —
verified, not assumed, that `3` produces the SMALLER gzip here (10,273 vs
11,833 bytes on identical scanline source, same `wasm-opt` pass). Two
consecutive `pnpm run build:wasm` runs produced byte-identical output
(reproducibility unaffected by the profile change); `build-wasm.mjs`'s
post-build scan (phase 5f.6, see below) ran clean on both.

**Warm bench methodology fix** (`flood-fill.bench.ts`): the ORIGINAL bench
called `uniformCanvas()`/`mazeCanvas()` INSIDE the timed callback — canvas
CONSTRUCTION cost (a fresh allocation, or a full `O(w*h)` procedural
maze-pattern generation loop), not flood-fill cost, plus GC noise from a
fresh `Uint8Array` every iteration. Fixed: each canvas shape is built ONCE
into a small reusable pool outside the timed loop; each iteration now pays
only a flat `.set()` copy (the one copy any real caller also needs, since
flood-fill mutates in place) plus explicit `warmupIterations: 50` per bench.

**Re-measured warm, 3 consecutive `pnpm run bench` runs, construction excluded:**

| Case | TS mean (run 1/2/3) | Wasm mean (run 1/2/3) | Wasm/TS ratio | vs phase 5 (per-pixel, un-warmed) |
|---|---|---|---|---|
| Full fill | 0.437 / 0.440 / 0.439 ms | 0.327 / 0.322 / 0.321 ms | ~0.73-0.75 (~1.3-1.35x faster) | Both got ~5x faster in absolute ms; ratio moved from ~2.5x to ~1.3x faster |
| Maze/holes | 0.763 / 0.787 / 0.790 ms | 0.384 / 0.382 / 0.386 ms | ~0.44-0.51 (~1.95-2.0x faster) | Both got ~2x faster in absolute ms; ratio held closer (~2.4x to ~2.0x) |

**Conclusion (honest, not spun — re-confirmed, not a one-off): the absolute-
time target is met with an even LARGER margin than phase 5 (Wasm mean now
~0.32-0.39ms, down from ~0.9-1.0ms). The ≥3x-ratio target is still NOT met,
and in fact the measured ratio moved further from 3x than phase 5's
per-pixel version — see LEARNING.md §15 for the mechanism (a faster
algorithm can narrow the Wasm/TS gap even while making Wasm itself faster,
because it removes proportionally more of JS's higher per-operation
overhead than Wasm's already-lower per-operation overhead).** This is not a
regression in any user-facing sense — every real fill is now meaningfully
faster on both implementations — but it IS a real, re-measured fact about
the ratio metric specifically, reported honestly rather than cherry-picking
the old un-warmed numbers that happened to look closer to 3x.

`packages/core/bench/thresholds.json` updated: `maxWasmToTsRatio` 0.8 (full
fill, measured ~0.73-0.75) and 0.56 (maze/holes, measured ~0.44-0.51) — set
just above the measured reality with margin for run-to-run noise, same
honest-gate philosophy as every other threshold in this file (NOT the
aspirational 3x target, and NOT a looser copy of phase 5's old 0.45/0.48 —
those would now be VIOLATED by the (faster, but ratio-wise worse) scanline
numbers if left unchanged).

**Oracle parity** (new, `apps/editor/src/lib/flood-fill.oracle-parity.test.ts`):
5,000 randomized cases comparing the Rust/TS scanline rewrite against the
ORIGINAL, never-touched `apps/editor/src/lib/flood-fill.ts` (the long-
standing oracle/bench-baseline) — byte-identical buffers AND dirty rects,
both `ts` and `wasm` rows, 0 failures. `packages/core`'s own fuzz suite
(`flood-fill.fuzz.test.ts`, 126 cases) and parity suite
(`pixel-parity.test.ts`) both re-pass unchanged against the rewritten
algorithm (209/209 `packages/core` tests total, up from 172 — +37 new:
33 boundary-number-validation cases per phase 5f.5, see below, plus the
existing flood-fill cases re-verified against the new algorithm).

**`cargo test`**: 30/30 passing, same count as phase 5 (the scanline rewrite
changed the algorithm's internals, not its external contract — every
existing test asserts observable behavior only). `cargo fmt --check`/
`cargo clippy --all-targets -- -D warnings`: both clean.

**Bench pipeline flake (phase 5f.4)**: root `bench` script changed from
`pnpm -r bench` to `pnpm -r --workspace-concurrency=1 bench` — serializes
`packages/core`'s and `apps/editor`'s bench runs instead of running them
concurrently, removing the CPU/scheduling contention the prior verify
report's `check-bench` flake was traced to (a dropped benchmark group in
`packages/core`'s own aggregated `core-results.json` under concurrent
execution). Proof: `pnpm run bench && pnpm run check-bench`, 3 consecutive
runs from the repo root, all exit 0 with every gate present and within
budget (no missing-group failures).

**Rust/TS boundary number validation (phase 5f.5)**: `packages/core/src-ts/
ts-core.ts`'s `extractRect`/`writeRect`/`diffRect` hardened against NaN,
fractional, and out-of-u32-range (`2**32 + 1`, `Infinity`) `rx`/`ry`/`rw`/
`rh`/`w`/`h` arguments via a new shared `isValidU32` guard — a plain
`rx < 0`/`rx + rw > w`-style check is silently `false` for `NaN` on either
side, letting a NaN/fractional rect argument fall through into the loop and
compute a NaN/fractional buffer index instead of being rejected. The SAME
guard was added to `wasm-core.ts`'s `makeWasmKernels`, applied BEFORE
calling into Wasm — the DECISION (not applied to the Rust side itself):
reject on the TS facade so wasm-bindgen's own `u32` coercion (which
truncates/wraps these exact inputs via `ToUint32` instead of rejecting
them) is never reached for an invalid number. 33 new parity cases in
`pixel-parity.test.ts` assert ts and wasm reject identically (verified to
fail on the wasm side before this fix, confirmed via a temporary revert).

## Phase 6 — quantize + downscale

Ported `apps/editor/src/lib/quantize.ts`'s `quantizePixels` (weighted
k-means-style palette reduction) and `apps/editor/src/lib/downscale.ts`'s
`downscaleTo` (majority-vote downscale with anti-alias defringing) to Rust
(`packages/core/src/{quantize,downscale}.rs`), wired into `PixelKernels` as
two new flat-buffer calls: `quantize(data, colors, weightBySaturation,
iterations, alphaThreshold)` and `downscale(data, srcW, srcH, targetW,
targetH)`, both returning a FRESH buffer (`undefined` on an invalid shape or
a boundary-rejected numeric argument) rather than mutating in place —
`resizeNearest` (the other function in `downscale.ts`) is intentionally
NOT ported; out of this phase's scope (see `downscale.rs`'s module doc).

**Bench** (`pnpm run bench`, warm pools, construction excluded from the
timed loop — same methodology as phase 5f's flood-fill bench):

| Case | ts mean | wasm mean | wasm/ts ratio |
|------|---------|-----------|----------------|
| quantize 64x64 -> 16 colors | 5.5124 ms | 1.5089 ms | **0.27x** (3.65x faster) |
| quantize 64x64 -> 32 colors | 14.0980 ms | 3.9900 ms | **0.28x** (3.53x faster) |
| downscale 512x512 -> 64x64 | 3.8131 ms | 4.5081 ms | **1.18x** (Wasm slower) |

quantize is COMPUTE-HEAVY (nested loops over points x centroids x
iterations for the k-means seeding/refinement) and Wasm wins decisively —
well past the honest "is this worth it" bar, not just a marginal win.
downscale's per-call cost is dominated by the FFI copy of the WHOLE 512x512
(1 MB) source buffer into Wasm memory (same cost class as `extractRect`/
`writeRect`/batched `put_points` — see `LEARNING.md` §4), while the actual
per-cell majority-vote work is comparatively cheap (a 64x64 target has only
4,096 cells) — so the fixed FFI copy cost is NOT amortized over enough
compute to win here, same pattern as phase 4's near-memcpy kernels. This is
recorded honestly, not hidden: the pixel-core spec's performance budgets
name only flood-fill's 3x/5ms target (not quantize/downscale), so no
requirement is violated by downscale's ratio.

`packages/core/bench/thresholds.json` updated: `maxWasmToTsRatio` 0.4 for
both quantize cases (measured ~0.27-0.28, margin for CI noise) and 1.4 for
downscale (measured ~1.18, same honest-gate-above-reality philosophy as
every other threshold in this file).

**Tests**: `packages/core` 4,244 total (Vitest) after this phase — 20 new
`cargo test` cases (9 quantize + 11 downscale, 50/50 passing), plus
TS-side: `pixel-parity.test.ts` gained 14
new ts/wasm parity cases (quantize + downscale, including boundary-number-
validation), and a new `quantize-downscale.fuzz.test.ts` runs 2,000
randomized cases EACH for quantize and downscale (4,000+ total `it.each`
cases) comparing ts vs wasm byte-for-byte, deterministic LCG seeds, 0
failures. `apps/editor` gained two oracle-parity suites
(`quantize.oracle-parity.test.ts`, `downscale.oracle-parity.test.ts`,
mirroring `flood-fill.oracle-parity.test.ts`'s pattern): 2,000 randomized
cases EACH compared against the ORIGINAL, never-touched oracle files, plus
dedicated edge-case tests (1x1, non-divisible sizes, fully transparent,
alpha-threshold boundary at 127/128, palette sizes 1/2/256) and boundary-
number-validation tests (NaN/fractional/huge rejected identically by both
kernels) — 0 failures. Full monorepo `pnpm run typecheck`/`test` green
(`packages/core` 4,244 tests, `apps/editor` 289 tests, `packages/tokens` 5
tests).

**`cargo test`**: 50/50 passing (30 prior + 20 new). `cargo fmt --check`/
`cargo clippy --all-targets -- -D warnings`: both clean.

**Reproducibility + size**: two consecutive `build:wasm` runs produced a
byte-identical `.wasm` (confirmed via `cmp`); the post-build host-path scan
is clean. Gzip'd `.wasm`: 14,647 bytes (~9.8% of the 150 KB budget), up from
10,273 bytes at the end of phase 5f (the two new kernels' compiled code).

**Editor wiring**: `apps/editor/src/lib/sprite-pipeline.ts`'s
`quantizeIfNeeded`/`downscaleViaKernels` now route through
`resolveKernels()` (the same `pf:core`/`VITE_PIXEL_CORE` override chain and
automatic TS-fallback-on-load-failure-or-trap every other kernel caller
uses), with the original oracle function kept as a defensive fallback for
the (never actually triggered, parity-tested) "kernel rejected a
seemingly-valid call" case. This covers every caller of `decodeToPixels`/
`decodeSheetToFrames` — the file import pipeline AND the AI sprite pipeline
(`retro-diffusion-utils.ts`'s `decodeGeneratedSprite` calls `decodeToPixels`
directly) — without changing any output (proven by the oracle-parity
suites above).

**UPDATE (phase 6f, fix-agent pass)**: the wiring above is CORRECTED, not
just re-benched — see below.

## Phase 6f — fix-agent pass: downscale's false "FFI-copy dominated" diagnosis corrected, kill-switch bypass closed

Two blind judges (A6/B6) adversarially reviewed phase 6 (`verify-report-
phase-6.md`). This pass fixes both real findings (W-A overflow, W-B loader
race) plus three additional issues the orchestrator's fix list named: the
kill-switch bypass, an avoidable JS-side copy, and downscale's genuinely
wrong perf diagnosis.

**The `downscale` perf finding was WRONG, not just suboptimal.** Phase 6's
handoff claimed downscale was "FFI-copy-dominated" — same mistake phase 5's
flood-fill handoff note made before phase 5f corrected it (see
`LEARNING.md`'s correction there). The REAL cost: `dominant_color` allocated
a fresh `HashMap<u32, BucketStats>` (plus an `order: Vec<u32>` for the
tie-break) PER CELL — SipHash hashing and a heap allocation for every unique
color bucket, repeated for every one of `target_w * target_h` cells. Fixed
by reusing a flat `slot: Vec<u32>` (one entry per possible bucket key) +
`stats: Vec<BucketStats>` pair across the WHOLE call, cleared only for the
entries a cell actually touched — see `downscale.rs`'s module doc for the
full mechanism. Verified byte-identical output (not just "looks right"):
the existing 2,000-case fuzz suite, both oracle-parity suites, AND a
one-off 20,000-case run of `quantize-downscale.fuzz.test.ts` (seeds bumped
locally, run once, reverted to 2,000 for the committed file — 40,007 cases,
0 failures) all pass unchanged against the rewritten implementation.

**Bench** (`pnpm run bench`, same warm-pool methodology, this machine, 2
consecutive runs):

| Case | ts mean | wasm mean | wasm/ts ratio | phase 6 ratio |
|------|---------|-----------|----------------|----------------|
| downscale 512x512 -> 64x64 | 3.73-3.77 ms | 1.33 ms | **0.35x** (2.8x FASTER) | 1.18x (slower) |

`packages/core/bench/thresholds.json`'s downscale gate tightened from `1.4`
(the old, wrong "Wasm is slower" reality) to `0.45` (margin above the new
measured ~0.35x) — the false "FFI-copy dominated" claim is removed from
every doc it appeared in (this file, `HANDOFF.md`, `tasks.md`).

**Other fixes in this pass** (full detail in `tasks.md`'s "Phase 6f"
section and `HANDOFF.md`):
1. `sprite-pipeline.ts` bypassed the `pf:core`/`VITE_PIXEL_CORE` kill switch
   by calling `@pixelforge/core`'s `resolveKernels()` directly — fixed to
   route through `lib/core/kernels.ts`'s new `getActiveKernelsAsync()`.
2. `resolveKernels()`/`loadWasmModule()`'s check-then-await-then-set race
   (W-B) — fixed via a memoized in-flight promise plus a cached, logged-once
   session-wide load failure (no retry storm).
3. Overflow safety (W-A) — `MAX_DOWNSCALE_TARGET_DIMENSION`/
   `MAX_QUANTIZE_COLORS` bounds (TS + Rust, identical), plus `u64`-widened
   checked arithmetic in `downscale.rs` for the allocation size and the
   per-cell `ty*src_h`/`tx*src_w` range math.
4. Removed an unnecessary `new Uint8Array(source.data)` JS-side copy in
   `sprite-pipeline.ts` — replaced with a zero-copy `Uint8Array` view over
   the same `Uint8ClampedArray` buffer (both kernels take `data` read-only).
5. `.gitattributes` added (`packages/core/pkg/*.wasm binary`, LF for the
   generated JS/TS/`package.json` sidecars).

**Tests**: `packages/core` 4,249 (4,244 + 2 new `resolve-core.test.ts`
concurrency/no-retry cases + 3 new `pixel-parity.test.ts` MAX-bound parity
cases), plus 5 new `cargo test` cases (55 total:
50 + 1 MAX-bound rejection + 1 adversarial-overflow-input reject + 1
`cell_range` simulated-wasm32-width case + 1 flat-table regression case +
1 quantize MAX-bound case). `apps/editor` 294 (289 + 5: 2 new
`kernels.test.ts` cases for `getActiveKernelsAsync`, 3 new
`sprite-pipeline.test.ts` cases for kill-switch routing + once-per-session
fallback logging). Full monorepo `pnpm run typecheck`/`test`/`bench`/
`check-bench` all green; `cargo fmt --check`/`cargo clippy --all-targets --
-D warnings`/`cargo test` (55/55)/`cargo deny check` all clean.

**Reproducibility + size**: two consecutive `build:wasm` runs produced a
byte-identical `.wasm` (confirmed via `cmp`, all 5 `pkg/` files). Gzip'd
`.wasm`: 12,619 bytes (~8.4% of the 150 KB budget) — SMALLER than phase 6's
14,647 bytes, despite adding the two new bound checks, because the
flat-table rewrite replaces `HashMap`'s generic machinery with plain array
index (see "Phase 7" below for the full-`Document` gzip number).

## Phase 7 (Rust `Document`/history — stateful `PixelCore`, the hardest port)

`packages/core/src/document.rs` (full `Document`: frames, layers, pixel
buffers owned in Wasm linear memory, stroke lifecycle, id handles, dirty-rect
+ structural undo history) + `packages/core/src/history.rs` (byte-budget
undo stack, mirrors `history.ts`) + `bindings.rs`'s new `WasmDocument`
wasm-bindgen class + `packages/core/src-ts/wasm-document-core.ts`'s
`WasmPixelCore` facade (implements the SAME `PixelCore` interface
`TsPixelCore` does). DEFAULT STAYS `ts` per the orchestrator's explicit
decision — see `HANDOFF.md`'s Phase 7 section for exactly how to flip it for
manual testing.

**Bug found and fixed BY the differential fuzz, not before it** (worth
recording as a methodology note): `focus_structural` (undo/redo's "which
frame/layer becomes current" resolution) read `self.frames[self.
current_frame_index]` to find "the frame that was current before this
undo/redo" — but by the time it ran, `self.frames` had ALREADY been mutated
(a frame inserted/removed), so a STALE index landed on the wrong frame
entirely. `ts-core.ts`'s `focusStructural(doc, frames, ...)` avoids this by
reading the OLD current frame's id off the UNMUTATED `doc` argument, before
computing the new `frames` array. Fixed by capturing `prev_current_frame_id`
once, at the top of `apply_entry`, BEFORE any branch mutates `self.frames`.
Caught by seed 92 of the 300-seed differential fuzz (an `undo` of a
`frame.paste`, which bumped the wrong layer's `layerRevisions` entry) —
exactly the kind of bug a hand-written unit test would very plausibly have
missed (every hand-written test in `document.rs` happened to undo/redo from
a state where the stale-index bug was invisible: either only one frame
existed, or the "current" frame never moved during the sequence).

**Bench** (`pnpm run bench`, `apps/editor/src/lib/core/wasm-pixel-core.
bench.ts`, 64x64 canvas, warm, this machine):

| Case | ts mean | wasm mean | wasm/ts ratio |
|------|---------|-----------|----------------|
| stroke (60-point batch: begin+points+end) | 0.0273 ms | 0.0140 ms | **1.95x faster** |
| fill (full 64x64) | 0.0546 ms | 0.0265 ms | **2.06x faster** |
| fill + undo + redo | 0.0252 ms | 0.0084 ms | **3.01x faster** |
| layer.add + layer.remove (structural) | 0.5717 ms | 0.2944 ms | **1.94x faster** |

Not wired into `packages/core/bench/thresholds.json`/`check-bench.ts` (that
gate is scoped to `packages/core/bench/*.bench.ts`'s stateless `PixelKernels`
results; this is a NEW, stateful-`PixelCore`-level bench living in
`apps/editor`) — recorded here honestly instead, same as every prior phase's
numbers, with gate-wiring left as a documented follow-up (`tasks.md`).

**Tests**: `packages/core` 4,265 (4,249 + 16 new: `document.rs`/`history.rs`
unit tests under `cargo test`, 87 total — 55 prior + 32 new covering stroke/
fill/region.clear/selection.commit lifecycle, layer/frame CRUD + undo/redo,
`doc.replace`/`frame.paste` + undo, id-collision-after-import, history
eviction, the undo-memory reference scenario — plus `wasm-document-core.
test.ts`'s 16 contract cases against the real compiled `.wasm`); `apps/
editor` 303 (294 + 9: `core-config.test.ts`'s 3 rewritten cases for the now-
real wasm wiring, `wasm-pixel-core-resolver.test.ts`'s 4 trap-safety cases,
the 300-seed x 60-step differential fuzz [+ 1 skip-notice], the undo-memory
baseline [+ 1 skip-notice]). Full monorepo `pnpm run typecheck`/`test` green;
`cargo fmt --check`/`cargo clippy --all-targets -- -D warnings`/`cargo test`
(87/87) clean.

**Reproducibility + size**: two consecutive `build:wasm` runs byte-identical
(confirmed via a SHA-256 compare of `pixelforge_core_bg.wasm`, Node's
`crypto` module — `cmp`/`sha256sum` were unavailable in this shell). Gzip'd
`.wasm`: 41,234 bytes (~27.5% of the 150 KB budget) — up from 12,619 bytes at
the end of phase 6f, the expected cost of the full `Document`/history
surface (≈20 new wasm-bindgen methods + the domain logic behind them), still
comfortably under budget.

**Known deviations/gaps** (documented, not hidden — full detail in
`HANDOFF.md`'s Phase 7 section): `frame.paste`'s pasted-frame `activeLayerId`
always defaults to the first layer (the original `SerializedFrame.
activeLayerId` passthrough isn't part of this phase's wire format); `import
Document`'s corrupted-payload recovery is a single "fall back to one new
empty document" branch, coarser than `payloadToDoc`'s per-layer repair/
dedup; the trap-safety wrapper's secondary fallback ("else from the store's
pixel cache") isn't implemented, only the primary ("recover via the trapped
core's own `exportDocument()`"); the bench numbers above aren't wired into a
pass/fail gate. None of these affect the DEFAULT (`ts`) user experience —
they only matter once `pf:core`/`VITE_PIXEL_CORE` is explicitly set to
`wasm`.
indexing (less generic code to compile into Wasm).

# Verify Report — Phase 4: packages/core scaffold (Rust pixel-buffer behind PixelCore)

**Change**: migrate-to-rust-core
**Scope**: tasks.md Phase 4 (4.0a, 4.0b, 4.1–4.10)
**Mode**: Standard (Strict TDD disabled)
**Judge**: Judge A (blind, independent) — adversarial focus per orchestrator brief

---

## Completeness

| Metric | Value |
|---|---|
| Tasks in scope | 13 (4.0a, 4.0b, 4.1, 4.2, 4.2a, 4.3, 4.4, 4.5, 4.5a, 4.6, 4.7, 4.8, 4.9, 4.10) |
| Complete | 13/13 |
| Incomplete | 4.11 (commit) — intentionally left, matches every prior phase's convention in this file (no commits without explicit user instruction) |

No core task incomplete.

---

## Real Execution Evidence

| Command | Result |
|---|---|
| `cargo fmt --check` (packages/core) | Clean |
| `cargo clippy --all-targets -- -D warnings` | Clean, 0 warnings |
| `cargo test` | 9/9 passing (`src/pixels/mod.rs`, native, no wasm runtime) |
| `cargo deny check licenses` (cargo-deny 0.20.2, installed fresh this session) | `licenses ok` (only harmless "allow-list entry never matched" warnings for BSD/ISC/Zlib/Apache-exception — crate's only dependency is `wasm-bindgen`, MIT/Apache-2.0) |
| `wasm-pack build --target web --release` into a **scratch** out-dir (not `packages/core/pkg`) | Succeeded; `pixelforge_core_bg.wasm` byte-for-byte **SHA-256 identical** to the committed `pkg/` (`bf87d4c8...d0c8ee9` both sides) — drift-check reproducibility confirmed independently of CI |
| `pkg/.gitignore` | Present in a raw `wasm-pack` rebuild, **absent** in the committed `pkg/` — `clean-pkg-gitignore.mjs` is correctly chained as the 2nd step of `build:wasm` and does its job |
| Root `pnpm run typecheck` | Exit 0, all 4 workspace packages clean |
| Root `pnpm run test` | Exit 0 — editor 252/252, packages/core 12/12 (TS↔Wasm parity), packages/tokens 5/5 |
| Root `pnpm run bench` | Ran clean; packages/core: put_pixel x2000 wasm/ts = **796x slower** (budget 2500x, within), extractRect+writeRect wasm/ts = **1.42x slower** (budget 3x, within) |
| `node scripts/check-bench.ts` | `all checked ratios are within budget` |
| `.wasm` gzip size | 10,527 bytes measured (matches `baseline-bench.md`'s recorded figure exactly), budget 153,600 — 7% of budget |

All gates that could be executed in this sandbox (no builds of the Next/Vite apps themselves, per instruction) pass with real command output, not inference.

---

## Spec Compliance Matrix

| Requirement | Scenario | Evidence | Result |
|---|---|---|---|
| core-parity-gate: Baseline Benchmarks Recorded Before Porting | Baseline exists before a port starts | `baseline-bench.md` phase-0 TS baselines for pixel-buffer/flood-fill/history predate this phase | ✅ COMPLIANT |
| core-parity-gate: CI Enforces Tests, Benchmarks, Drift Check | PR triggers full gate | `.github/workflows/ci.yml`'s `rust-core` job runs fmt/clippy/test/deny/build/drift-check/size/parity/bench/ratio-check in sequence; every step reproduced locally in this session | ✅ COMPLIANT |
| core-parity-gate: CI Enforces... | Drift check catches a stale artifact | Drift-check mechanism (`git diff --exit-code packages/core/pkg`) verified sound via a successful rebuild (identical hash); the FAILURE path (dirtied source vs. stale `pkg/`) was not independently re-created against the committed tree (would require writing into `packages/core/pkg`, out of scope for a read-only verify pass) | ⚠️ PARTIAL (mechanism verified, negative case not independently reproduced) |
| core-parity-gate: Parity Tests Gate Default Implementation | Passing/Failing parity blocks promotion | No implementation-selection flag exists yet at the `PixelKernels` level (`resolveKernels()` always tries Wasm, falls back silently) — this requirement's "flag" gate is explicitly phase 7's `VITE_PIXEL_CORE` (task 7.9), not phase 4's scope | ➖ N/A this phase (correctly deferred, not silently dropped — tasks.md documents it) |
| pixel-core: Implementation-Agnostic Pixel Operations | Pixel write is readable back | `cargo test`'s `get_set_pixel_roundtrip` + `pixel-parity.test.ts`'s get/put round-trip row for both `ts`/`wasm` | ✅ COMPLIANT |
| pixel-core: Implementation-Agnostic Pixel Operations | Flood-fill matches across implementations | Not in scope — `flood_fill` ships phase 5 | ➖ N/A this phase |
| pixel-core: Lossless Pixel Round-Trip | Quantize/downscale scenarios | Not in scope — phase 6 | ➖ N/A this phase |

**Compliance summary**: 3/3 in-scope requirements compliant; 1 scenario partial (negative-path drift check untested); rest correctly out of scope and documented as such.

---

## Correctness — Adversarial Findings

### 1. Pixel cache correctness (`stores/slices/core.slice.ts`) — reasoned sound, but UNTESTED directly

Traced the cache-refresh invariant the module's own comments claim: every pixel-mutating/layer-CRUD command operates on `currentLayers(state.doc)` only (confirmed via `rg` across `ts-core.ts`'s switch cases — `stroke.*`, `fill`, `layer.add/remove/meta/reorder`, `selection.commit`, `region.clear` all read/write `currentLayers(state.doc)`, never an arbitrary frame). `frame.remove`'s `index` param can target a non-current frame, but removing a frame never touches pixel bytes, so stale-but-unread cache entries are harmless. `selection.commit`'s apparent exception (`commitTransformation` resolves via `sourceFrameId`/`sourceLayerId`, not "current") is closed by `selection.slice.ts:104`'s guard: it cancels the float instead of baking it unless `sourceFrameId === state.timeline.frames[currentFrameIndex].id` — confirmed every call site that can switch frame/layer force-commits the float FIRST. `frame.add`'s new frame (not covered by `STRUCTURAL_REFRESH_COMMANDS`) is still refreshed correctly because `frame.add` also becomes the new *current* frame and `ts-core.ts`'s `dispatchCommand` wrapper falls back to bumping `layerRevisions` for `currentLayers(next.doc)` when `dirty` is empty — the new layer id is picked up by the non-structural refresh path using the post-command `currentFrameId`. `doc.replace`/`frame.paste`/`undo`/`redo` get an unconditional full `refreshAllLayers`, and `importDocument` clears+rebuilds the cache from scratch. Onion-skin (non-current frame) reads rely on those frames' cached layer bytes never going stale because nothing but `dispatch` can mutate pixels, and non-current frames are never dispatch targets.

**Gap**: this entire mechanism — the one the orchestrator explicitly flagged as highest-risk (B3) — has **zero direct test coverage**. `rg -l "pixelCache|refreshAllLayers|STRUCTURAL_REFRESH_COMMANDS"` matches only `core.slice.ts` itself and its own JSDoc; no test file references any of them. `stores/index.test.ts` indirectly exercises `selection.commit`/`region.clear` through the real store (asserting on `layer.pixels` after those dispatches), which is good incidental coverage, but `frame.paste`+undo-across-frames and onion-skin-frame pixel reads are tested only at the `ts-core.ts` `CoreState` level (`ts-core.judgment-day-round2.test.ts` etc.), which **bypasses `core.slice.ts`'s cache entirely** (those tests call `dispatchCommand` directly, never going through the zustand slice/`buildTimeline`/`buildLayer`). **WARNING-real**: flag as a genuine regression-coverage gap, not a confirmed bug — add a `core.slice.test.ts` (or extend `stores/index.test.ts`) asserting pixel bytes on a non-current (onion-skin) frame stay correct across a `frame.paste`+`undo` sequence, and after `importDocument`.

### 2. Id-seed collisions (B4) — design is sound; low-severity entropy note

`createCoreState` picks a fresh random 8-hex-char prefix (`crypto.randomUUID().slice(0,8)`, ~32 bits) per `CoreState`, with `frameIdCounter`/`layerIdCounter` reset to 0 each time. Verified `payloadToDoc`/`TsPixelCore.importDocument` **preserve** persisted frame/layer ids verbatim (`id: f.id` / `id: layer.id` in `ts-core.ts:1190,1273` — never re-minted on restore), so a reload never renames existing ids, and newly-minted ids (new seed) only ever need to avoid colliding with OLD-seed ids, which differ with near-certainty. No reproducible collision found. **WARNING-theoretical**: 32 bits of entropy is markedly less than a full UUID; acceptable at today's single-user/local-draft scale (design D12), but worth widening if a future multi-document merge (Supabase sync) ever imports two drafts' ids into the same namespace.

### 3. Rust `u32` arithmetic — unreachable today, worth a guard before phase 5 wiring

`packages/core/src/pixels/mod.rs`'s bounds checks (`rx + rw > w`, `rw * rh * CHANNELS` size calcs in `extract_rect`/`write_rect`) use plain `u32` arithmetic. Release builds disable overflow checks by default (not re-enabled in `Cargo.toml`'s `[profile.release]`), so a sufficiently adversarial `(rx, rw)` pair near `u32::MAX` could wrap the bounds check into a false-pass and then panic on the subsequent slice index (full Wasm-instance abort, since `panic = "abort"`). Not reachable today: no `apps/editor` runtime code calls into `packages/core` yet (phase 5 wires `flood_fill` first), and the editor has no UI path that creates a canvas anywhere near `u32::MAX` dimensions. **WARNING-theoretical** — recommend `checked_add`/`checked_mul` or an explicit max-dimension sanity check at the `bindings.rs` boundary before phase 5+ exposes these kernels to any path that could ever carry untrusted sizes.

### 4. CI tooling pin inconsistency

The Rust toolchain (`1.99.0`, confirmed installed and real via `rustup show`, dated 2026-09-28) and `wasm-pack` (`0.15.0`, confirmed installed matching) are both version-pinned in CI, explicitly to address "non-deterministic wasm" (design.md D9). `cargo-deny` is installed via `cargo install cargo-deny --locked` with **no `--version`** — `--locked` only pins cargo-deny's own dependency tree, not which cargo-deny release gets installed. Installed fresh this session: cargo-deny 0.20.2, ran cleanly against `deny.toml`. **WARNING-theoretical**: a future cargo-deny release could change the config schema (the `[licenses]`-only file has no `[graph]`/`[bans]`/`[advisories]`/`[sources]` sections) and break the `rust-core` CI job non-deterministically — inconsistent with the project's own stated pinning philosophy for this exact job.

### 5. Stale documentation (doc-only, no functional impact)

`apps/editor/src/lib/core/pixel-core.ts:99-107`'s `TsPixelCore` JSDoc still says *"`stores/slices/core.slice.ts` does NOT route through this class yet... deferred to phase 3"*. This is **outdated** — confirmed `core.slice.ts` calls `resolveCore(doc)` (`core-config.ts`), which returns `new TsPixelCore(doc)`, i.e. B1 (phase 2f) already closed this exact gap. **WARNING-real** (documentation drift, not a code bug) — could mislead a future contributor into re-investigating or re-"fixing" an already-closed item. Low effort to correct.

### 6. Unbounded `pixelCache` growth (minor)

`core.slice.ts`'s closure-scoped `pixelCache` (`Map<layerId, Uint8ClampedArray>`) is never pruned when a layer/frame is removed — confirmed `frame.remove`/`layer.remove`'s reducer cases don't touch it, and no eviction path exists. Harmless for correctness (stale entries are simply never looked up again, since `buildLayer` only reads ids present in the current `DocMetaSnapshot`), but an unbounded memory leak over a long session with many deletions. **SUGGESTION**.

---

## Coherence (Design)

| Decision | Followed? | Notes |
|---|---|---|
| D6 (flat methods, `u32` handles, no serde) | ✅ Yes | `bindings.rs` is exactly flat scalars/slices; `#[allow(clippy::too_many_arguments)]` documented and justified |
| D9 (commit `pkg/`, CI rebuilds+diffs, pin toolchain+wasm-pack) | ✅ Yes | Verified reproducible byte-for-byte this session |
| Hexagonal split (`pixels` pure, `bindings` the only wasm-bindgen import) | ✅ Yes | Confirmed via `rg "wasm_bindgen"` — only in `bindings.rs` and `lib.rs`'s `pub mod` |
| B3 pixel-cache contract (design.md "Pixel cache contract") | ✅ Implemented as specified | See finding #1 — implementation matches the documented contract; only test coverage is missing |
| B4 seedable ids, no JS callback at boundary | ✅ Yes | `setIdGenerator` fully removed from `PixelCore`; `setIdSeed` is seed-only |
| File Changes table (Ph 4 row) | ✅ Matches | `Cargo.toml`, `rust-toolchain.toml`, `src/lib.rs`, `src/pixels/` (table says `src/buffer.rs` — documented deviation to a `pixels/` module, explicitly called out in task 4.2) |

No undocumented deviations found beyond what tasks.md/design.md already disclose.

---

## Issues Found

**CRITICAL**: None.

**WARNING (real)**:
1. `core.slice.ts`'s pixel-cache refresh mechanism (B3) has no direct test coverage — the highest-risk mechanism in this phase is verified only by static/manual trace, not a regression test. Add tests for frame-paste+undo and onion-skin (non-current-frame) pixel reads through the real store.
2. `pixel-core.ts:99-107`'s JSDoc is stale (claims B1 is still open; it was closed in phase 2f). Low-effort fix.

**WARNING (theoretical)**:
3. `u32` bounds-check arithmetic in `packages/core/src/pixels/mod.rs` can wrap in release builds; unreachable today (kernels not yet wired into the app), but should get a guard before phase 5+ wiring.
4. `idSeed`'s 8-hex-char (32-bit) entropy is lower than a full UUID; sound for today's local-only scale, worth revisiting if documents are ever merged across sessions/users.
5. `cargo-deny` installed unpinned in CI (`--locked` without `--version`), inconsistent with the toolchain/wasm-pack pinning this same job otherwise enforces.

**SUGGESTION**:
6. `pixelCache` in `core.slice.ts` never evicts entries for removed layers/frames — harmless, but an unbounded leak over long sessions.
7. Drift-check's negative path (stale `pkg/` vs. changed Rust source) wasn't independently reproduced against the committed tree in this verify pass (by design — read-only mandate); the mechanism itself (`git diff --exit-code`) is standard and the positive path (reproducible rebuild) was confirmed byte-for-byte.

---

### Verdict

**PASS WITH WARNINGS.**

All executable gates (fmt, clippy, cargo test, cargo-deny, drift-check reproducibility, typecheck, full test suite, bench + ratio-check) pass with real command output. No CRITICAL issues. Two real (but low-severity, fixable in well under an hour) warnings — a documentation staleness and a test-coverage gap on the exact mechanism this review was asked to pressure-test hardest — plus three theoretical/forward-looking notes that don't block this phase but should inform phase 5's wiring work.

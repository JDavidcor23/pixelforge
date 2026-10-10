# Verify Report — Phase 6 (Rust quantize + downscale)

**Change**: migrate-to-rust-core
**Mode**: Standard (Strict TDD disabled)
**Verifier**: sdd-verify / Judge A6 (blind adversarial pass)
**Scope note**: session continuity check — the prior apply session ended abruptly (PC shutdown) right after the phase-6 HANDOFF.md update. This report first establishes the implementation is COMPLETE and not half-written, then does the full adversarial verification.

---

## 0. Continuity check (half-written-state concern)

**Result: CLEAN. No half-written state found.**

- `git status`: clean working tree on `feat/migrate-to-rust-core` at `a815aa3` ("feat(core): port quantize and downscale kernels to rust (phase 6)") — phase 6 was fully committed, not left mid-edit.
- Rebuilt `packages/core/pkg/` from source into a scratch out-dir, using the **exact same flags** as `packages/core/scripts/build-wasm.mjs` (same `--remap-path-prefix` triple for crate/cargo-home/rustup-home, same `wasm-pack build --target web --release`, same post-build backslash-path-to-forward-slash normalization pass).
- Byte-compared every file: `pixelforge_core_bg.wasm`, `pixelforge_core.js`, `pixelforge_core.d.ts`, `pixelforge_core_bg.wasm.d.ts`, `package.json` — **all 5 files byte-IDENTICAL** to the committed `pkg/`.
- Conclusion: the committed `pkg/` is reproducible from the committed Rust source with zero drift — the abrupt shutdown did not leave any corrupted or stale build artifact.

---

## Completeness

| Metric | Value |
|--------|-------|
| Tasks total (Phase 6) | 9 (6.1–6.9) |
| Tasks complete | 8 |
| Tasks incomplete | 1 — `6.9` (commit), left unchecked by design (every prior phase's convention: no commits from an apply pass without explicit instruction). Not a defect; the commit was in fact made (`a815aa3`) by the user/orchestrator afterward, per `HANDOFF.md`. |

---

## Build & Tests Execution (real execution, not inferred)

**Rust** (`packages/core`, `export PATH="$HOME/.cargo/bin:$PATH"`):
- `cargo fmt --check`: ✅ clean, exit 0
- `cargo clippy --all-targets -- -D warnings`: ✅ clean, exit 0
- `cargo test`: ✅ **50/50 passed** (0 failed, 0 ignored) — matches HANDOFF's claim exactly
- `cargo deny check`: ✅ `advisories ok, bans ok, licenses ok, sources ok` — only 5 pre-existing informational `license-not-encountered` warnings (allowed-but-unused license entries in `deny.toml`), not phase-6-related, not blocking

**Root monorepo**:
- `pnpm run typecheck`: ✅ exit 0, no errors
- `pnpm run test`: ✅ **packages/core 4,244/4,244**, **apps/editor 289/289**, **packages/tokens 5/5** — all green, matches HANDOFF's claimed counts exactly
- `pnpm run bench`: ✅ ran clean. Key phase-6 numbers (own run, not copied from baseline-bench.md):
  - quantize 64x64→16 colors: wasm 1.53ms vs ts 5.79ms → **3.79x faster**
  - quantize 64x64→32 colors: wasm 4.08ms vs ts 14.45ms → **3.54x faster**
  - downscale 512x512→64x64: wasm 4.62ms vs ts 3.91ms → **1.18x slower**
  - These numbers are consistent with `baseline-bench.md`'s recorded 3.65x/3.53x/1.18x (small run-to-run noise, same conclusion: quantize wins decisively, downscale is FFI-copy-bound and honestly reported as slower)
- `pnpm run check-bench`: ✅ **all 7 checked ratios within budget**, including both quantize cases (0.26x/0.28x, budget 0.4x) and downscale (1.18x, budget 1.4x)

**Coverage**: not configured for this project (no coverage tool in cached capabilities) — not available, not a gap introduced by this phase.

---

### Spec Compliance Matrix

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Lossless Pixel Round-Trip | Quantize preserves channel range | `packages/core` `cargo test` (9 cases) + `pixel-parity`-equivalent `quantize.oracle-parity.test.ts` (2,000 random cases + edge cases + boundary-NaN tests, ts AND wasm rows) | ✅ COMPLIANT |
| Lossless Pixel Round-Trip | Downscale preserves canvas content intent | `packages/core` `cargo test` (11 cases) + `downscale.oracle-parity.test.ts` (2,000 random cases + edge cases + boundary-NaN tests, ts AND wasm rows) | ✅ COMPLIANT (see Issues below for an untested adversarial extreme not covered by the spec's own scenario wording) |

**Compliance summary**: 2/2 scenarios compliant as literally written. One confirmed robustness gap found by adversarial testing beyond the spec's stated scenarios (see CRITICAL/WARNING below) — it does not violate the spec text, which never mentions "arbitrarily large target dimensions," but it is a real behavioral asymmetry worth fixing.

---

### Correctness (Static + Dynamic — Structural and Byte-Level Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| `quantize` RGB palette reduction, alpha preserved | ✅ Implemented | `packages/core/src/quantize.rs`; line-by-line cross-check against `apps/editor/src/lib/quantize.ts` confirms identical algorithm, iteration order, and tie-break rules (seed-by-highest-weight, furthest-point seeding scored by `dmin * weight`, Lloyd's refinement, strict `<` tie-break on nearest-centroid) |
| `downscale` majority-vote + defringe | ✅ Implemented | `packages/core/src/downscale.rs`; cross-checked against `apps/editor/src/lib/downscale.ts`'s `downscaleTo` — bucket key computation, `127.5` fallback threshold kept as an exact `f64` (not rounded to `127`), and the `order: Vec<u32>` insertion-order tie-break that exactly mirrors a JS `Map`'s iteration order (a `HashMap` alone has no defined order — this is load-bearing, not cosmetic, and is correctly implemented) |
| Boundary-number-validation convention (NaN/fractional/out-of-range rejected identically by ts and wasm) | ✅ Implemented for the argument shapes actually tested | `ts-core.ts`'s `isValidU32` applied symmetrically in both `ts-core.ts` (reference) and `wasm-core.ts` (guard before the Wasm call) for `colors`/`iterations`/`alphaThreshold`/`srcW`/`srcH`/`targetW`/`targetH`; confirmed by both `quantize.oracle-parity.test.ts` and `downscale.oracle-parity.test.ts`'s dedicated NaN/fractional/huge-per-argument tests (both ts and wasm rows) | 
| `resizeNearest` correctly left out of scope | ✅ Confirmed | Not named by `tasks.md` 6.3, not covered by the cited spec scenario; `sprite-pipeline.ts` still calls the original `resizeNearest` directly for sheet-frame slicing (line 182) — consistent with `downscale.rs`'s module doc |
| Editor wiring covers both file-import and AI pipelines | ✅ Confirmed | `sprite-pipeline.ts`'s `quantizeIfNeeded`/`downscaleViaKernels` route through `resolveKernels()`; `decodeToPixels`/`decodeSheetToFrames` (file import) and `retro-diffusion-utils.ts`'s `decodeGeneratedSprite` (AI path, calls `decodeToPixels` directly) both go through the same wired functions — confirmed by direct read of all three call sites |

---

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| `packages/core` never depends on `apps/editor`; `SATURATION_WEIGHT`/threshold constants duplicated on purpose | ✅ Yes | Confirmed — `quantize.rs`/`downscale.rs` have zero imports from outside the crate besides `crate::pixels` |
| Hexagonal rule: only `bindings.rs` imports `wasm_bindgen` | ✅ Yes | Grep-confirmed: `quantize.rs`/`downscale.rs` have no `wasm_bindgen` import (only the word appears in doc comments) |
| `design.md`'s `PixelKernels.quantize(buf, opts): PixelBuffer` / `downscale(buf, w, h): PixelBuffer` interface sketch (line 160-161, written at phase 4) | ⚠️ Deviated (pre-existing pattern, not a new issue) | The real signatures are flat-buffer calls returning `Option<Vec<u8>>`/`Uint8Array \| undefined` (`quantize(data, colors, weightBySaturation, iterations, alphaThreshold)`, `downscale(data, srcW, srcH, targetW, targetH)`), per the boundary-validation convention established in phase 4f. `design.md`'s interface block was never updated after that convention was introduced — the SAME staleness already exists for `floodFill`'s signature from phase 5 onward. SUGGESTION: update `design.md`'s Rust-surface snippet once, covering all three kernels, rather than re-noting this every phase. |

---

## Issues Found

### CRITICAL
None.

### WARNING (real, confirmed by direct execution — not inferred)

**W-A: `downscale`'s target dimensions are not overflow-checked, unlike its source dimensions — confirmed to panic the Wasm instance for specific (individually-"valid") inputs.**
- **File/line**: `packages/core/src/downscale.rs:187-194` (`let (src_w_u, src_h_u, target_w_u, target_h_u) = (...); let mut out = vec![0u8; target_w_u * target_h_u * channels];`) vs. the crate's own established convention at `packages/core/src/pixels/mod.rs:67-71` (`buffer_len`, which uses `checked_mul` specifically to avoid this class of bug) — applied to `src_w`/`src_h` via `pixels::valid_buffer(data, src_w, src_h)` at `downscale.rs:172`, but **not** applied to the `target_w_u * target_h_u * channels` allocation-size computation three lines later.
- **Scenario**: `downscale(data_1x1, 1, 1, 32768, 32768)`. Each of `target_w`/`target_h` individually passes `isValidU32` (well within `0..=0xffffffff`). `target_w_u * target_h_u * channels` = `32768 * 32768 * 4` = exactly `2^32`, which overflows `usize` on the `wasm32` target (32-bit) and silently wraps to `0` in release mode (no `overflow-checks` set, so no debug-mode panic at the multiply itself). `out` is allocated as a 0-byte `Vec`. The very first write (`out[o] = r` at `ty=0, tx=0`, `o=0`) is an out-of-bounds index into a 0-length slice.
- **How confirmed**: executed directly against the real, committed `.wasm` (not inferred from reading code) via a Node script calling `mod.downscale(new Uint8Array(4), 1, 1, 32768, 32768)`: **threw `RuntimeError: unreachable`, `instanceof WebAssembly.RuntimeError === true`**. A second case (65536×65536) reproduces identically. A follow-up sane call on the same Wasm instance afterward still works correctly (`downscale([10,20,30,255], 1,1,1,1)` → `[10,20,30,255]`), confirming the existing trap-recovery design (`isWasmRuntimeError`/`withRuntimeTrapFallback`) does its job — the session demotes to TS kernels, no crash, no corrupted subsequent calls.
- **The actual gap**: the TS reference/oracle (`ts-core.ts`'s `downscale`, and the untouched `apps/editor/src/lib/downscale.ts`'s `downscaleTo`) has **no equivalent upper-bound check either** — confirmed: `new Uint8Array(32768 * 32768 * 4)` in Node **does not throw** (JS numbers don't overflow the same way; V8 happily attempts the ~4GB allocation). So for this exact adversarial input, Wasm fails fast (catchable trap → automatic TS fallback) while the TS fallback path it falls back to would then itself attempt a multi-gigabyte allocation and a ~1-billion-cell nested loop — in a real browser this risks a tab hang or OOM crash rather than a clean rejection. Neither implementation treats "huge target dimensions" as an invalid input the way `extractRect`/`writeRect` treat out-of-range rects (bounded against the source buffer) — `downscale`'s target is independent of the source, so there is no natural bound today.
- **Reachability**: **not reachable through the current UI** — every call site (`sprite-pipeline.ts`'s `fitSpriteCentered`/`decodeSheetToFrames`) passes code-controlled target sizes (the editor's grid sizes, e.g. 16–256px), never a raw user-supplied number. This is a latent robustness gap, not a live exploit path.
- **Recommendation**: validate `target_w as u64 * target_h as u64 * (CHANNELS as u64) <= <some sane max, e.g. matching a documented max canvas size>` in both `downscale.rs` (before allocating) and `ts-core.ts`'s `downscale` (before calling `new Uint8Array`), returning `None`/`undefined` like every other boundary-rejected case — OR explicitly document this as an accepted, shared (oracle-inherited) limitation if the team decides UI-level size caps make it a non-issue. Either way it should be a documented decision, not a silent gap.

**W-B: `resolveKernels()`/`loadWasmModule()` has a check-then-await-then-set race across concurrent initial callers — confirmed reachable from a real call site, not hypothetical.**
- **File/line**: `packages/core/src-ts/wasm-core.ts:43-52` (`loadWasmModule`: `if (!wasmModule) { const mod = await import(...); await initWasm(mod); wasmModule = mod }` — the `!wasmModule` check and the `wasmModule = mod` write straddle two `await`s with no in-flight-promise guard).
- **Scenario**: `apps/editor/src/sprites/features/properties/components/RightSidebar/useRightSidebar.hook.ts:569-570` calls `Promise.all(anim.frames.map((dataUri) => decodeGeneratedSprite(dataUri, AI_SPRITE_DEFAULT_SIZE)))` — downloading a multi-frame AI-generated animation. Each `decodeGeneratedSprite` → `decodeToPixels` → `quantizeIfNeeded` → `resolveKernels()` → `loadWasmModule()`. If this is the session's first kernel call (Wasm override active, module not yet cached) and the animation has N>1 frames, all N calls race through `loadWasmModule`'s check before any of them sets `wasmModule`.
- **How confirmed**: read of `packages/core/pkg/pixelforge_core.js:375-376` (`async function __wbg_init(module_or_path) { if (wasm !== undefined) return wasm; ... }`) — the generated glue's own module-level `wasm` guard has the identical TOCTOU shape, confirming that concurrent `mod.default()` calls each independently fetch and instantiate before either finishes. Not independently runtime-reproduced in this pass (would need a real fetch-timing race, hard to force deterministically from a script); the finding is grounded in reading both the facade code and the generated glue's actual guard logic, not speculation about wasm-bindgen internals.
- **Impact**: wasted duplicate `.wasm` fetch/instantiate (not a correctness bug — there is no `#[wasm_bindgen(start)]`-registered custom state in this crate; every kernel is a stateless buffer transform, confirmed via `rg "wasm_bindgen(start)"` finding nothing), but it is a real architectural gap the phase's own "async resolveKernels in an import pipeline: race conditions" adversarial-focus item asks to check, and it is pre-existing since phase 4f (not introduced by phase 6) — phase 6 is simply the first phase that makes it reachable from a production `Promise.all` call site for an ordinary user action (downloading a multi-frame AI animation).
- **Recommendation**: cache the in-flight promise itself in `loadWasmModule` (`let pending: Promise<WasmExports> | null = null; ... if (!wasmModule) { pending ??= (async () => {...})(); wasmModule = await pending }`) rather than only caching the resolved value.

### WARNING (theoretical / low-confidence)
None beyond what's folded into W-A/W-B above.

### SUGGESTION
1. **`design.md`'s `PixelKernels` interface snippet is stale** (see Coherence table) — covers `quantize`/`downscale`/`floodFill` with their phase-4-era sketch signatures, not the actual flat-buffer, boundary-validated ones in use since phase 4f/5/6. Low priority; purely documentation.
2. **No `.gitattributes` exists anywhere in the repo** to make the `packages/core/pkg/` CRLF/LF contract explicit (`git ls-files --eol` confirms all 4 text sidecar files are currently `lf`/`lf` in both the index and this Windows worktree, and the `.wasm` is correctly auto-detected as `-text`/binary — so there is no CURRENT corruption). Risk is low in practice because `wasm-bindgen`'s JS codegen always emits LF regardless of host OS (confirmed: Node's `fs.writeFileSync` does no newline translation, and wasm-bindgen's string-building codegen never embeds host-OS-dependent newlines), and `build-wasm.mjs` always regenerates `pkg/` from scratch rather than relying on hand-edited files. Still, an explicit `.gitattributes` (`*.wasm binary -diff`, `packages/core/pkg/* -diff` or similar) would make this an auditable, version-controlled guarantee instead of one resting entirely on every future contributor's local `core.autocrlf` setting — the same philosophy that motivated `build-wasm.mjs`'s own host-path normalization (W1, phase 4f). Not phase-6-specific; applies to the whole `pkg/` directory since phase 4.
3. `quantize`'s `iterations` parameter has the same "no upper bound, so a huge value hangs the thread" characteristic as `downscale`'s target dimensions — but this is **symmetric with the untouched oracle** (`quantize.ts`'s own `for (let it = 0; it < iterations; it++)` has identical exposure), so it is not a parity bug and not a regression; noted only for completeness, no action recommended beyond what W-A already proposes for the allocation-size class of issue specifically.

---

### Verdict

**PASS WITH WARNINGS**

Phase 6 is complete, correctly committed (no half-written state — rebuild byte-identical), and faithfully ports both `quantize` and `downscale` with verified byte-for-byte parity against the untouched TS oracles across thousands of randomized + edge-case + boundary-validation test cases, symmetric in both languages. All required gates are green (fmt, clippy, cargo test 50/50, cargo deny, typecheck, full test suite 4,538 tests total, bench, check-bench). Two real (not theoretical) adversarial findings were confirmed by direct execution: an unguarded allocation-size overflow in `downscale`'s target dimensions (W-A, not reachable via current UI, fails safely via the existing trap-recovery mechanism) and a latent concurrent-initialization race in the shared Wasm loader now reachable from a real `Promise.all` call site (W-B, wasted work only, no correctness break identified). Neither blocks archiving this phase; both are worth a follow-up fix, ideally bundled with phase 7 or as a quick standalone patch before final sign-off.

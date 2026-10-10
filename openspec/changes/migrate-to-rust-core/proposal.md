# Proposal: Migrate to a Rust/Wasm Core (monorepo)

## Intent

Pixel state is `RgbaColor[][]` (an object per pixel). Each undo deep-clones every layer in every frame, and the renderer calls `fillRect` once per pixel. We want a Figma-style split: React only sends commands, and a versioned engine (`packages/core`, later Rust/Wasm) owns pixels and history. That engine is meant to become a maintainable open-core product.

## Scope

### In Scope
- Gates: `test`/`bench` scripts, parity tests for pixel-buffer, flood-fill and history, and CI.
- A flat RGBA `Uint8ClampedArray` buffer, with `putImageData` rendering.
- A patch-based history behind a command seam (`compound.slice.ts`).
- A pnpm monorepo: `apps/landing` (Next), `apps/editor` (Vite SPA + `api/` Vercel Functions), `packages/tokens`, `packages/core`.
- Rust ports in this order: pixel-buffer → flood-fill → quantize/downscale → history. Each one sits behind the same TS interface.
- Local-first draft persistence (phase 1): a `DocumentRepository` port with an IndexedDB adapter (binary, autosave + restore) replaces the localStorage document; Supabase project sync is a later change (`supabase-project-sync`).
- Updates to AGENTS.md and the agent rules (Next 16.2.3, React 19.2.4, Vite rules for the editor).

### Out of Scope
- Scene, physics and render in Rust (a later change).
- npm publishing of `@pixelforge/core` and licensing/monetization mechanics.
- Supabase project/asset sync (future change `supabase-project-sync`, a second `DocumentRepository` adapter).

## Capabilities

### New Capabilities
- `pixel-core`: the buffer model, pixel operations, and the TS `PixelCore` interface with TS and Wasm implementations.
- `edit-history`: command dispatch, dirty-rect undo/redo and memory bounds.
- `core-parity-gate`: parity tests and benches required before a Rust implementation becomes the default.
- `workspace-build`: monorepo layout, the committed `pkg/` with a drift check, shared tokens, and Vercel deploy plus Functions.

### Modified Capabilities
None (no `openspec/specs/` exist yet).

## Approach: phases (each phase ships)

| # | Phase | Exit criteria |
|---|-------|---------------|
| 0 | Gates: scripts, characterization tests, AGENTS.md fix, CI | CI green; baseline bench numbers recorded |
| 1 | Flatten the buffer to `{w,h,data:Uint8ClampedArray}`; renderer uses `putImageData`; every consumer (incl. Konva) migrated | Old tests and parity tests pass; render gain ≥5x |
| 2 | Command seam (`dispatch(cmd)`) plus dirty-rect patch history, in TS | Undo memory metric met; `animation-history` tests pass |
| 3 | Monorepo split, `packages/tokens`, API routes moved to Vercel Functions, `VITE_*` env vars | Both apps deploy; editor feature parity; keys stay server-side |
| 4 | `packages/core` scaffold with a Rust pixel-buffer behind `PixelCore`, toggled by a flag | Parity tests pass on both implementations; drift check in CI |
| 5–7 | Rust flood-fill → quantize/downscale → history | Each one: parity, a bench gain, a learning note, and a PR under ~300 LOC |

## Key Decisions

| Decision | Choice | Alternatives / tradeoff |
|----------|--------|-------------------------|
| History | **Dirty-rect patches** (store before/after bytes of the touched rect, plus inverse commands for frame/layer ops) | Copy-on-write layer snapshots: simpler, but costs O(layer) per step. Deep clone: today's approach, O(N·M·W·H) |
| Wasm build | **Commit `pkg/` + CI rebuild-and-diff, with a pinned toolchain** | Rust on Vercel: slow and fragile. Publish to npm: cleanest, but deferred to 1.0 |
| Bundling | `wasm-pack --target web` + `vite-plugin-wasm` + top-level-await | `--target bundler`: weaker Vite HMR |
| Fallback | One `PixelCore` interface with `TsCore` and `WasmCore` implementations | Replacing TS in place: no parity reference |
| Public API | semver 0.x, changesets changelog, ADRs in `docs/adr/` | Unversioned: blocks open-core |

## Affected Areas

| Area | Impact |
|------|--------|
| `src/app/editor/types/index.ts`, `lib/*` | Modified |
| `src/app/editor/stores/slices/{compound,history,pixel}.slice.ts` | Modified |
| `src/app/api/ai/*` → `apps/editor/api/*` | Moved |
| `globals.css`, `COLORS.ts`, `DESIGN.md` → `packages/tokens` | Moved |
| `pnpm-workspace.yaml`, `package.json`, `vitest.config.ts`, `AGENTS.md`, `.claude/agents/*` | Modified |

## Risks and Rollback

| Risk | Likelihood | Mitigation / rollback |
|------|-----------|------------------------|
| Hidden `RgbaColor[][]` consumers | Med | Typed rg sweep in phase 1; revert the phase PR |
| Non-deterministic wasm causes false drift alerts | Med | `rust-toolchain.toml` and a pinned wasm-pack |
| React 19 + react-konva under Vite | Low-Med | Spike at the start of phase 3 |
| Rust is too hard for the lead to review | Med | Small PRs, a learning note per port, TS fallback flag |

Rollback: each phase is a separate PR or tag. For phases 4–7, flip the flag back to `TsCore` with no redeploy of the logic.

## Success Criteria

- [ ] Flood-fill of a full 256×256 canvas: under 5 ms in Rust, and ≥3x faster than the flattened TS version.
- [ ] Full repaint of a 256×256 canvas: under 4 ms.
- [ ] Undo of a 1-px stroke (64×64, 8 frames × 4 layers): under 1 KB retained, vs a full clone today.
- [ ] Editor dev cold start under 2 s; HMR under 200 ms.
- [ ] `.wasm` under 150 KB gzipped; editor initial JS budget set at phase 3.
- [ ] CI runs tests, benches and the `pkg/` drift check on every PR.

# Phase 3 Verification — migrate-to-rust-core (monorepo split + Vercel deploy prep)

**Verdict**: PASS WITH WARNINGS (0 CRITICAL, 4 WARNING, 3 SUGGESTION)
**Mode**: Standard (Strict TDD disabled)
**Scope**: tasks.md Phase 3 (3.1–3.18). Read-only round — no source files modified; `packages/core` and `apps/editor/src/lib/core` were left untouched per instruction (concurrent Phase 4 work).

---

## Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 18 |
| Tasks complete | 11 |
| Tasks incomplete | 7 |

Incomplete: 3.9 (Vercel project config — out of scope, no Vercel CLI/project creation allowed), 3.13 (manual feature-parity click-through — no browser tool available), 3.14 (production bundle inspection — needs a real build, forbidden this pass), 3.15 (real Vercel Functions routing — needs a deploy; unit-level request/response IS covered), 3.16 (HMR rigor not confirmed, cold start PASSED), 3.17 (deploy — out of scope), 3.18 (commit — no commits per phase convention, consistent with every prior phase in this file).

All 7 are explicitly documented in tasks.md as deliberate scope exclusions, not oversights.

---

## Build & Tests Execution

**Typecheck**: `pnpm run typecheck` → ✅ exit 0, clean across `packages/tokens`, `apps/editor`, `apps/landing` (3 of 4 workspace projects ran the script; the 4th is the workspace root itself, which has none).

**Tests**: `pnpm run test` → ✅ 257/257 passed
```
packages/tokens:  5/5 passed  (1 file)
apps/editor:    252/252 passed (28 files)
```
No failures, no skips.

**Build**: not run (forbidden this pass by instruction — no builds).

**Coverage**: not available (no coverage tool configured — carried over from Phase 2's suggestion, still not added).

---

### Spec Compliance Matrix — `specs/workspace-build/spec.md`

| Requirement | Scenario | Test / Evidence | Result |
|---|---|---|---|
| Independent App Deployment | Both apps deploy successfully | No deploy performed (3.9/3.17 out of scope) | ❌ UNTESTED |
| Independent App Deployment | Editor retains pre-migration features | `editor-feature-parity-checklist.md` (not clicked through); structural comparison of `App.tsx`/`EditorLayout.tsx` against `git show HEAD:src/app/editor/{layout,sprites/page,sounds/page}.tsx` — same nav items, same `SettingsPanel`, same `SpriteEditorLayout`/`SoundEditorLayout` mounted; `useDocumentPersistence` confirmed mounted in `SpriteEditorLayout.tsx`; 252/252 tests green | ⚠️ PARTIAL (strong structural evidence, no manual click-through) |
| Server-Side Secrets Stay Server-Side | Client bundle contains no provider keys | No production bundle built this pass; source review: `apps/editor/api/ai/retro-diffusion.ts:67` reads `process.env.API_RETRO_DIFFUSION` only inside the Vercel Function (not under `src/`, not Vite-bundled); no `VITE_`-prefixed secret anywhere; `elevenlabs.ts` holds no server key at all (pure BYOK via header) | ⚠️ PARTIAL (compliant by inspection, not confirmed via actual bundle) |
| Server-Side Secrets Stay Server-Side | AI routes still function | `apps/editor/api/ai/retro-diffusion.test.ts` + `elevenlabs.test.ts`, 10/10 passing (part of the 252) | ✅ COMPLIANT (unit-level only — real Vercel Functions routing untested, see 3.15) |
| Developer Experience Budgets | Cold start budget met | `baseline-bench.md` Phase 3 section: 337–663ms across 3 runs, budget <2s | ✅ COMPLIANT |
| Developer Experience Budgets | HMR budget met | `baseline-bench.md` Phase 3 section: ~1s wall-clock via a file-write-to-server-log sampling harness, no browser client attached — explicitly flagged as not rigorously measured | ❌ UNTESTED |
| Wasm Artifact Size Budget | Wasm size budget met | No `packages/core`/`.wasm` artifact exists yet (Phase 4+) | ➖ N/A this phase |

**Compliance summary**: 1/7 scenarios fully compliant by direct test, 3/7 partial/compliant-by-inspection, 2/7 untested (both gated on a deploy/build this agent was barred from), 1/7 not yet applicable.

---

## Correctness (Static — Structural Evidence)

| Check | Status | Notes |
|---|---|---|
| No `next/*` imports in `apps/editor` | ✅ Implemented | `rg` over `apps/editor` for `from ['"]next/` / `require\(['"]next/` — 0 hits |
| No `window.location` navigation | ✅ Implemented | 0 hits in `apps/editor/src`; `App.tsx`/`EditorLayout.tsx` use `react-router-dom`'s `Link`/`Outlet` |
| No `process.env` in editor client code | ✅ Implemented | 0 real hits in `apps/editor/src` (one doc-comment mention only); all public env reads use `import.meta.env.VITE_*` |
| Editor env reads via **a single** config module | ⚠️ Partial | Two separate direct `import.meta.env` call sites instead of one (`apps/editor/src/lib/supabase.ts:3-4`, `apps/editor/src/lib/core/core-config.ts:26`) — see WARNING 2 |
| Server-side keys not `VITE_`-prefixed | ✅ Implemented | `apps/editor/api/ai/retro-diffusion.ts:67` — `process.env.API_RETRO_DIFFUSION` |
| No secret referenced from client code | ✅ Implemented | Confirmed via grep for key-shaped tokens (`eyJ…`, `sk-…`, etc.) across the repo — only `pnpm-lock.yaml` integrity hashes matched (expected, not a secret) |
| `.env.example` has no real values | ➖ N/A | No `.env.example`/`.env.sample` file exists in the repo at all — see SUGGESTION 1 |
| Vercel SPA rewrite doesn't swallow `/api/*` | ✅ Implemented | `apps/editor/vercel.json`: `"/((?!api/).*)" → "/index.html"` |
| Landing CTA uses `NEXT_PUBLIC_EDITOR_URL` | ✅ Implemented | `apps/landing/src/constants/env.ts` (`EDITOR_APP_URL`), consumed identically by `Navbar`, `HeroSection`, `CtaSection` — single config module, unlike the editor-side gap above |
| pnpm-workspace / tsconfig references | ✅ Implemented | `pnpm-workspace.yaml` (`apps/*`, `packages/*`), root `tsconfig.json` is references-only (D10) |
| CI runs typecheck/test/bench | ✅ Implemented | `.github/workflows/ci.yml` — all 3 steps present |
| `.gitignore` nested node_modules fix | ✅ Implemented | Unanchored `node_modules` pattern, with an explanatory comment |
| No leftover root `src/` Next app | ✅ Implemented | No root `src/` directory exists |
| No dead root configs | ⚠️ Deviation found | Root `vitest.config.ts` is orphaned/dead — see WARNING 1 |
| No `any` in touched components | ⚠️ Deviation found (pre-existing) | `useCanvasPanning.hook.ts:9,19`, `useCanvasZoom.hook.ts:12` still use `(e: any)` — see WARNING 3 |

---

## Coherence (Design.md)

| Decision | Followed? | Notes |
|---|---|---|
| D10 — TS packages use source exports, no tsc build | ✅ Yes | `packages/tokens/package.json`'s `"exports"` point straight at `.ts`/`.css` |
| D11 — `DESIGN.md` stays at repo root | ✅ Yes | Confirmed, not moved |
| Phase 3 File Changes table | ✅ Yes | `pnpm-workspace.yaml`, `tsconfig.base.json`, `apps/landing/**`, `apps/editor/{vite.config.ts,index.html,src/**,api/ai/*,vercel.json}`, `packages/tokens/*`, `src/lib/supabase.ts` → `VITE_*`, `.changeset/config.json`, `docs/adr/0001-0007` — all present and matching |
| Two Vercel projects, per-app Root Directory + Ignored Build Step | ⚠️ Partial | `vercel.json` rewrite exists; the actual Vercel project creation/config is documented in `docs/adr/0005` + each app's README but not performed (task 3.9, explicitly out of scope) |

---

## Issues Found

**CRITICAL**: None.

**WARNING**:
1. **Root `vitest.config.ts` is dead/orphaned** (`vitest.config.ts:7`). Its `resolve.alias` points `@` → `path.resolve(__dirname, 'src')`, a root `src/` that no longer exists after the move to `apps/*`. Neither `apps/editor` nor `packages/tokens` resolve through it — each has its own `vite.config.ts`/`vitest.config.ts` with a correct per-package `@` alias, confirmed by running `pnpm run test` and seeing each package's own config header in the output. Harmless today (nothing invokes it), but it is exactly the kind of "leftover root dead config" this phase was supposed to clean up. Recommend deleting it, or if a root-level benchmark/test target is still wanted, repointing its alias.
2. **Editor env access isn't centralized in one config module.** `apps/editor/src/lib/supabase.ts:3-4` and `apps/editor/src/lib/core/core-config.ts:26` each call `import.meta.env.VITE_*` directly, with no shared module between them. Contrast with `apps/landing`, where every CTA call site imports `EDITOR_APP_URL` from one `apps/landing/src/constants/env.ts`. Not a security issue, doesn't fail typecheck/tests, but is a real convention gap worth closing (e.g. an `apps/editor/src/constants/env.ts`).
3. **Pre-existing `any` not cleaned up in sibling canvas hooks.** `apps/editor/src/sprites/features/canvas/hooks/useCanvasPanning.hook.ts:9,19` and `useCanvasZoom.hook.ts:12` still type event params as `(e: any)`. `useCanvasInteraction.hook.ts`'s own doc comment says it already replaced ITS `(e: any)` with a concrete Konva event type — the two sibling hooks were left behind. This predates Phase 3 (phase 1/2 debt) but these files were textually touched by the phase 3 import-alias rewrite, so flagging it here as a catch-up item.
4. **Completeness gap carries real spec risk.** The workspace-build scenarios "Both apps deploy successfully," "Client bundle contains no provider keys," and "HMR budget met" are UNTESTED by direct execution (see Spec Compliance Matrix) — all three are gated on a deploy or production build this agent was barred from running. This is consistent with the explicit no-build/no-deploy instruction, but it means Phase 3 cannot be marked fully exit-criteria-met until a human (or an agent with deploy/build permission) closes 3.9, 3.14, 3.15, 3.16's HMR half, and 3.17.

**SUGGESTION**:
1. No `.env.example`/`.env.sample` exists anywhere in the repo. Both apps' README.md document their env vars in a table instead, which is a reasonable substitute, but a literal example file is the more discoverable monorepo convention and makes "no real values committed" trivially checkable.
2. Root `next-env.d.ts` and `tsconfig.tsbuildinfo` are present at the repo root (both gitignored, so no git-tracking risk) — almost certainly stale from a pre-migration or local tooling run. Harmless; worth a local cleanup.
3. `design-agent.md` and `test-agent.md` are still referenced by `AGENTS.md`/other agent docs but don't exist in `.claude/agents/` — reconfirmed, not new (task 3.12 already documented this as a pre-existing gap).

---

### Verdict

**PASS WITH WARNINGS.** Typecheck and the full test suite (257/257) are clean, the monorepo split is structurally sound (no `next/*` leakage into the editor, no secret leakage, correct Vercel rewrite, workspace/tsconfig/CI wiring all in place), and feature parity is strongly supported by structural comparison against the pre-migration Next app even though the manual browser click-through was not performed. No CRITICAL issues. The 4 WARNINGs are either cleanup items (dead root config, scattered env reads, leftover `any`) or a clear statement that deploy-gated spec scenarios remain unverified by design, not by accident — both should be tracked before this change is archived.

# Exploration: migrate-to-rust-core

## Current State

PixelForge today is a single Next.js 16.2.3 app (React 19.2.4), **not** Next 14 as
AGENTS.md states (verified in `package.json`). `pnpm-workspace.yaml` already
exists but only carries `allowBuilds`/`ignoredBuiltDependencies` settings — it
has **no `packages:` field**, so this is not actually a pnpm workspace yet.

Next.js coupling is narrow: 12 import sites across the whole `src/` tree —
`next/link` (5), `next/navigation` (2: `usePathname`, `redirect`), `next/font/google`
(1, `Geist`/`Geist_Mono` in `src/app/layout.tsx`), `next/image` (1), `next/server`
(2: `NextRequest`/`NextResponse` in the two API routes). No other Next-specific
API (no `getServerSideProps`, no `middleware.ts`, no Image loader config beyond
defaults, no RSC-only patterns found).

The two API routes (`src/app/api/ai/retro-diffusion/route.ts`,
`src/app/api/ai/elevenlabs/route.ts`) are thin wrappers: `NextResponse.json(...)`
is sugar over the standard `Response`, and both handlers already use only Web
`Request`/`fetch`/`AbortSignal`. They port to a Vercel Function (Node runtime,
plain `export default (req: Request) => Response`) with no real rewrite, just
dropping the `next/server` import.

**Pixel state (the critical finding for the Rust boundary):** the current
representation is the *opposite* of Wasm-friendly.

- `PixelBuffer` (`src/app/editor/types/index.ts`) is `RgbaColor[][]` — a 2D JS
  array of `{ r, g, b, a }` objects, each channel `0..255` (not `0..1` —
  confirmed by a comment in `quantize.test.ts`: "alpha is 0..255 (matches
  canvas-renderer and store)").
- Every mutation (`setPixelInBuffer`, `floodFill`, `quantizePixels`,
  `downscaleTo`) allocates a **new nested array of new objects** — no
  structural sharing, no typed arrays.
- `history.slice.ts` / `compound.slice.ts` push a full **deep clone of every
  layer in every frame** (`cloneLayers`/`cloneFrames`) on every undoable action
  (`pushHistory`). For an animation with N frames × M layers this is O(N·M·W·H)
  object allocations per undo step — already a real perf problem in JS, and
  exactly the kind of per-pixel object churn Wasm/typed-array buffers exist to
  eliminate.
- `canvas-renderer.ts` paints by calling `ctx.fillRect()` once per opaque pixel
  (nested loop over `layer.pixels`), not `ImageData`/`putImageData`. This is a
  second, independent perf issue the migration should fix at the same time it
  moves the buffer to a typed array, since a flat `Uint8ClampedArray` is exactly
  what `ImageData.data` expects.

The one favorable fact: channel values are already integers `0..255`, so the
semantic mapping to `Uint8ClampedArray` / Rust `Vec<u8>` (RGBA, 4 bytes/pixel)
is lossless and requires no rescaling — only a representation change, not a
model change.

Zustand store (`src/app/editor/stores/`) is slice-composed
(`pixel.slice.ts`, `history.slice.ts`, `layer.slice.ts`, `compound.slice.ts`,
`timeline.slice.ts`, `selection.slice.ts`, etc., assembled via
`stores/types/slices.ts` and `stores/index.ts`). `compound.slice.ts` is the
orchestration layer (`pushHistory`, `addFrame`, `setCurrentFrame`,
`overwriteWithPixels`, `importAnimationFrames`) — this is the natural seam
for a command dispatch boundary: these are already "verb" actions, not direct
field writes, so swapping their internals to `coreBridge.command(...)` calls
is structurally a drop-in replacement rather than a redesign.

Tests: `vitest` (v4.1.4) + `@vitest/ui`, config at `vitest.config.ts`
(`environment: 'node'`, `@` alias to `src`). **No `"test"` script exists in
`package.json`** — tests are currently run via `pnpm exec vitest` directly, not
`pnpm test`. Existing suites that can serve directly as TS-vs-Rust parity
tests: `quantize.test.ts`, `downscale.test.ts`, `animation-history.test.ts`,
`audio-encoder.test.ts`, `audio-engine.test.ts`, `stores/index.test.ts`,
`stores/layers.test.ts`. **No existing tests for `pixel-buffer.ts`,
`flood-fill.ts`, or `history.ts`** — these need new parity tests written
*before* porting them to Rust (they are first in the user's migration order).

Design tokens: Tailwind v4, CSS-first config — colors/spacing/radius live as
CSS custom properties directly in `src/app/globals.css` (no
`tailwind.config.js` exists). `globals.css` explicitly states it is "the single
source of truth" and that Konva (which cannot read CSS vars) requires the same
values mirrored as literals in `src/constants/COLORS.ts` — "those two files
must be changed together." Splitting into `apps/landing` + `apps/editor` means
this pair (plus `DESIGN.md`) has to move into a shared package (or be
duplicated with a lint/test guard), otherwise the two-file-sync contract
silently breaks across app boundaries.

Supabase: a single trivial client (`src/lib/supabase.ts`), env-driven
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`), used for auth +
storage. Despite the `NEXT_PUBLIC_` prefix (a Next.js convention, not a Supabase
requirement), this has no other Next coupling and moves to Vite's
`import.meta.env.VITE_*` convention unchanged in shape.

## Affected Areas

- `pnpm-workspace.yaml` — needs a `packages:` field added; currently inert.
- `src/app/editor/types/index.ts` — `PixelBuffer`/`RgbaColor` type definitions; the representation change (object-grid → typed array) ripples through every consumer below.
- `src/app/editor/lib/pixel-buffer.ts`, `flood-fill.ts`, `history.ts`, `quantize.ts`, `downscale.ts`, `pixel-transform.ts` — Rust port candidates, in the user's stated order (pixel-buffer → flood-fill → quantize/downscale → history).
- `src/app/editor/lib/canvas-renderer.ts` — must move from per-pixel `fillRect` to `ImageData`/`putImageData` to actually benefit from a flat buffer; otherwise the JS↔Wasm boundary gain is thrown away at paint time.
- `src/app/editor/stores/slices/compound.slice.ts`, `history.slice.ts`, `pixel.slice.ts` — orchestration layer; natural command-dispatch seam to the core.
- `src/app/layout.tsx`, `src/app/editor/layout.tsx`, `(landing)` components — the 12 `next/*` import sites.
- `src/app/api/ai/retro-diffusion/route.ts`, `src/app/api/ai/elevenlabs/route.ts` — move to Vercel Functions, must keep `API_RETRO_DIFFUSION`/ElevenLabs keys server-side.
- `src/app/globals.css`, `src/constants/COLORS.ts`, `DESIGN.md` — must land in a shared package consumed by both `apps/landing` and `apps/editor`.
- `src/lib/supabase.ts` — env var prefix change only (`NEXT_PUBLIC_*` → `VITE_*`).
- `vitest.config.ts`, `package.json` — no `test` script today; needs one per app/package once the workspace splits, plus a bench script for the TS-vs-Rust gain proof the user's plan requires per ported piece.

## Approaches

1. **wasm-pack `--target web` + `vite-plugin-wasm` + `vite-plugin-top-level-await`** — load the `.wasm` as an ESM import with async init, Vite handles bundling.
   - Pros: this is the documented, standard pairing (confirmed via Context7: `vite-plugin-wasm`'s own README shows exactly this two-plugin setup); works with `build.target` left at defaults as long as `topLevelAwait()` is present; wasm-pack output is consumed as a normal workspace package (`packages/core` → `pnpm add @pixelforge/core@workspace:*` from `apps/editor`).
   - Cons: adds a build-time dependency on Rust/cargo wherever `wasm-pack build` runs.
   - Effort: Low (well-trodden path).

2. **`wasm-bindgen` with `--target bundler` instead of `web`** — lets Vite's own resolver handle the wasm import without the top-level-await plugin.
   - Pros: slightly fewer moving parts in some setups.
   - Cons: `--target bundler` has historically been less reliable with Vite's dev-server HMR than `--target web` + the two plugins above; Context7 results consistently pointed at the `web` + plugins combo as the maintained path.
   - Effort: Low-Medium.

3. **Commit the built `pkg/` (wasm-pack output) to the repo vs. building Rust on every Vercel deploy** — orthogonal to 1/2, but decided here because it affects CI risk.
   - Pros: Vercel's build image does not ship Rust/cargo by default (confirmed via Context7: Vercel's "Build image overview" says extra packages go through `dnf`, and Vercel's own Rust support is a *separate* native Rust Function runtime — `vercel_runtime` crate — not a wasm-pack pipeline). Committing a prebuilt `pkg/` avoids installing a full Rust toolchain on every Vercel build, keeping deploys fast and not dependent on a `dnf install cargo` step staying available.
   - Cons: prebuilt artifacts can drift from source if a contributor forgets to rebuild before committing; needs a CI check (e.g. a GitHub Action that rebuilds and diffs `pkg/`) to catch that.
   - Effort: Low, but adds one process rule the team must actually follow.
   - **Recommendation: use this for `packages/core`.** Build Rust locally/in CI, commit `pkg/`, treat it like any other generated-but-committed artifact (similar to how `pnpm-lock.yaml` is already committed).

## Recommendation

Approach 1 (`wasm-pack --target web` + `vite-plugin-wasm` + `vite-plugin-top-level-await`), with Rust built out-of-band and `pkg/` committed (approach 3). This matches current, actively maintained guidance (not stale training data) and keeps Vercel's build step identical to today's `pnpm install && vite build` — no Rust toolchain needed on Vercel itself.

For the pixel representation: change `PixelBuffer` from `RgbaColor[][]` to a flat `Uint8ClampedArray` (row-major, 4 bytes/pixel) at the TS boundary *before* any Rust code is written. This alone fixes `canvas-renderer.ts` (direct `ImageData` usage) and gives the Rust/Wasm port a representation it can share by reference (via `wasm-bindgen`'s memory view) instead of marshalling JS objects — do this as the first task of the migration's monorepo-scaffolding phase, ahead of touching Rust.

## Risks

- **Vercel + Rust toolchain**: confirmed Vercel's build image has no cargo/rustc by default; mitigated by committing `pkg/` (not deploy-time compiled) — but this must be an explicit team rule with a CI drift check, or stale wasm silently ships.
- **History/undo perf regression risk during transition**: `history.slice.ts` currently deep-clones whole layer/frame trees per undo step. If the pixel buffer becomes a Rust-owned opaque handle before the history model is redesigned, naive JS-side "clone" of that handle either breaks (can't structurally clone opaque Wasm memory) or forces a full buffer copy across the boundary on every keystroke. Pixel-buffer and history are listed as separate migration steps in the plan, but history's *design* (copy-on-write/diffs, not deep clone) needs deciding before step 1 ships, not deferred to step 4.
- **Konva coupling**: `react-konva`/`konva` render sprites elsewhere in the editor (sprite thumbnails, layers panel) separately from `canvas-renderer.ts`'s raw-canvas path — any consumer reading pixel data as the old `RgbaColor[][]` shape (not found in the files read during this exploration pass, but not exhaustively searched beyond `editor/lib` and `editor/stores`) must be located before the type change lands, or it's a silent runtime break, not a compile error, wherever `any`-adjacent duck-typing is used.
- **No `test` script today**: `package.json` has no `"test"` entry; the migration's own parity-test requirement depends on a reliable `test`/`bench` command existing per package before Rust ports start, otherwise "TS kept as reference with parity tests" has no enforced gate.
- **React 19 + react-konva 19.2.3 + Vite**: not verified in this pass (no Context7 query spent on it to conserve budget) — worth a quick check before scaffolding `apps/editor`, since Konva's canvas lifecycle assumptions can interact with React 19's concurrent features in ways that differ from Next's SSR/hydration path.
- **Bundle size**: not measured in this pass (no current build artifact to inspect); flag for sdd-propose to size the `.wasm` payload impact on first paint once `packages/core` has real content.

## Ready for Proposal

Yes. The architecture direction is already decided by the user; this exploration confirms the concrete porting order is feasible (pixel-buffer's `0..255` int channels map losslessly to `Uint8ClampedArray`/`Vec<u8>`), identifies the two things that must happen *before* any Rust is written (flatten `PixelBuffer` to a typed array; add a `test`/`bench` script per package), and resolves the Vercel/Rust build-step question (commit prebuilt `pkg/`, don't compile Rust on Vercel). sdd-propose should also explicitly decide the history/undo redesign (copy-on-write vs. deep clone) since it blocks step 4 of the plan but is affected by decisions made in step 1.

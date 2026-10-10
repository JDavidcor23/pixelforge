# 0005 — pnpm monorepo split: apps/landing, apps/editor, packages/tokens

**Status**: Accepted (phase 3)

## Context

The project was a single Next.js app serving both the marketing landing page
and the full sprite/sound editor. Phase 4+ needs to add a Rust/Wasm package
(`packages/core`) with its own toolchain and build step, which does not
belong inside a Next.js app's build. Separately, the editor's canvas-heavy,
client-only workload doesn't need (and pays a cost for) Next's SSR/RSC
machinery — a plain SPA is a better fit and a faster dev loop.

## Decision

- Split into a pnpm workspace: `apps/landing` (Next.js, marketing site only),
  `apps/editor` (Vite + React 19 SPA, react-router, the entire former
  `/editor/*` tree), `packages/tokens` (shared design tokens, source-exported,
  no build step — **D10**).
- Each app is its own **Vercel project** (Root Directory `apps/landing` /
  `apps/editor`, Ignored Build Step
  `git diff --quiet HEAD^ HEAD -- . ../../packages` so an unrelated app's
  change doesn't trigger a redundant redeploy). The editor's own `vercel.json`
  rewrites every non-`/api/*` path to `/index.html` (SPA fallback).
- The editor's two AI proxy routes (`src/app/api/ai/{retro-diffusion,elevenlabs}/route.ts`)
  become Vercel Functions at `apps/editor/api/ai/{retro-diffusion,elevenlabs}.ts`,
  each `export default (req: Request) => Promise<Response>` — plain Web
  Fetch API, no Next.js-specific types. API keys stay non-`VITE_` env vars
  (server-side only — `VITE_*` vars are bundled into the client).
- **D11**: `DESIGN.md` stays at the repo root (the agent contracts in
  `CLAUDE.md`/`AGENTS.md` point there) — it is **not** moved into
  `packages/tokens`, only the machine-readable token values are.
- Editor hosting (subdomain vs. a path on the landing domain) is a
  **deploy-time choice**, not code: the landing app's CTA buttons read
  `NEXT_PUBLIC_EDITOR_URL` and link out to wherever the editor is actually
  deployed (see the open question this resolves in `design.md`).

## Consequences

- `packages/tokens/{tokens.css,colors.ts}` is the single source for both
  apps' palettes, with `colors.test.ts` as the parity gate between the two
  representations (CSS custom properties vs. Konva/canvas literal colors).
- The editor dropped `next/link`, `next/navigation`, `next/image` (it had no
  `next/image` usage to begin with) for `react-router-dom`'s `Link`/`Outlet`/
  `useLocation`, and the one external link became a plain `<a>` tag.
- Fonts: the landing app keeps `next/font/google` (Geist); the editor loads
  the same Geist family via a `<link>` tag in `index.html` (no next/font
  dependency) so both apps render with the same typeface.
- CI (`pnpm run {typecheck,test,bench}` at the root) needed **no structural
  change** — each script now fans out via `pnpm -r`, so the same three gates
  still run against every workspace package.

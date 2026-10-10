# @pixelforge/editor

The PixelForge sprite/sound editor. Vite + React 19 SPA (react-router), Konva
canvas, local-first IndexedDB persistence. Deployed as its own Vercel project
(Root Directory: `apps/editor`); `api/` holds its Vercel Functions.

## Environment variables

Client-side (bundled — must be prefixed `VITE_`, never a secret):

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | For auth/storage | Supabase project URL. Falls back to a placeholder (auth/storage calls will fail, everything else works). |
| `VITE_SUPABASE_ANON_KEY` | For auth/storage | Supabase anon/public key — safe to expose client-side by design. |
| `VITE_PIXEL_CORE` | No | Overrides which `PixelCore` implementation loads (`'ts'` \| `'wasm'`). Defaults to `'ts'`; `'wasm'` has no implementation yet (phase 4+). A `localStorage['pf:core']` override takes precedence over this for local debugging. |

Server-side only (Vercel Functions in `api/ai/*.ts` — **never** prefix these
`VITE_`, or they would ship in the client bundle):

| Variable | Required | Description |
|---|---|---|
| `API_RETRO_DIFFUSION` | Recommended | Retro Diffusion API key, used as the fallback when a request doesn't carry its own BYOK `apiKey`. |

ElevenLabs uses BYOK only (the client sends its own key via the
`X-ElevenLabs-Key` request header) — there is no server-side ElevenLabs env
var.

Create a local `.env.local` (gitignored) with the client-side variables above
for `pnpm dev` — never commit real values. `vercel env pull` fetches the
server-side variable for local Vercel Function testing.

## Scripts

- `pnpm dev` — Vite dev server
- `pnpm build` — production build
- `pnpm preview` — preview the production build locally
- `pnpm test` / `pnpm test:watch` — Vitest
- `pnpm bench` — Vitest benchmarks
- `pnpm typecheck` — `tsc --noEmit`

# @pixelforge/landing

The PixelForge IA marketing/landing page. Next.js 16 App Router. Deployed as its
own Vercel project (Root Directory: `apps/landing`).

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_EDITOR_URL` | Recommended | URL of the deployed editor app (its own Vercel project — e.g. `https://editor.pixelforge.app` or a path, depending on the deploy-time hosting choice). The CTA buttons link here. Falls back to `http://localhost:5173` (the editor's local Vite dev server) when unset, for local dev. |

Create a local `.env.local` (gitignored) with these values for local development — never commit real values.

## Scripts

- `pnpm dev` — Next dev server
- `pnpm build` — production build
- `pnpm start` — serve the production build
- `pnpm lint` — ESLint
- `pnpm typecheck` — `tsc --noEmit`

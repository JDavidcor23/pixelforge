/**
 * The editor is deployed as its own Vercel project (separate app, separate
 * domain or subdomain) — see openspec/changes/migrate-to-rust-core/design.md
 * "Open Questions" (subdomain vs. path is a deploy-time choice, not code).
 * Set `NEXT_PUBLIC_EDITOR_URL` per environment; the localhost fallback is for
 * running both apps together in local dev (`apps/editor`'s Vite dev server).
 */
export const EDITOR_APP_URL =
  process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:5173'

/**
 * Mirrors the editor's login route (`apps/editor/src/constants/routes.ts`) —
 * the landing can't import across apps. Trailing slashes on the env value are
 * stripped so the result is never `…//login`.
 */
export const EDITOR_LOGIN_URL = `${EDITOR_APP_URL.replace(/\/+$/, '')}/login`

/**
 * The single place `apps/editor` reads `import.meta.env.VITE_*` (phase 3
 * cleanup, from the phase 3 verification review: `lib/supabase.ts` and
 * `lib/core/core-config.ts` each read Vite env vars directly — one module
 * instead means a future env var rename/addition touches exactly one file,
 * and nothing else in the codebase needs to know `import.meta.env` exists.
 */

/** Supabase project URL — falls back to a placeholder so a dev machine with no `.env` still boots (Supabase calls simply fail against the placeholder host instead of crashing at import time). */
export function getSupabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
}

/** Supabase anonymous (public) key — same placeholder-fallback reasoning as {@link getSupabaseUrl}. */
export function getSupabaseAnonKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'
}

/**
 * `true` once real Supabase credentials are configured (editor-auth change).
 * Accounts are optional — when this is `false` the login page shows a calm
 * "accounts are not available in this build" notice instead of wiring up
 * sign-in buttons against the placeholder host, and the TopBar's account
 * entry stays hidden. The editor itself keeps working either way.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

/**
 * The editor's marketing/legal site — only used to link out to Privacy/Terms
 * from the login page (editor-auth change). Falls back to the production
 * landing domain so a dev machine with no `.env` still gets a working link.
 */
export function getLandingUrl(): string {
  return import.meta.env.VITE_LANDING_URL || 'https://www.pixelforgeia.com'
}

/**
 * The `PixelCore` implementation override (design.md's `resolveCore()` flag
 * chain: localStorage override -> this env var -> default `'ts'`). Returns
 * the raw string — `core-config.ts` is still the one place that validates it
 * against `PixelCoreImpl`, this module only centralizes WHERE the env read
 * happens, not what a valid value means.
 */
export function getPixelCoreEnvOverride(): string | null {
  return import.meta.env.VITE_PIXEL_CORE ?? null
}

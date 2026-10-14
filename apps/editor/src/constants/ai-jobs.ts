/* ── Server-owned AI jobs (`public.ai_jobs`, ADR 0009 follow-up) ─────────────
 * Imported by the client AND by `api/ai/pixellab/animate.ts`, so this file
 * must stay free of runtime imports (no `@/` alias).
 */

export const AI_JOBS_TABLE = 'ai_jobs'
export const ASSETS_TABLE = 'assets'
/** Private bucket the `collect-ai-jobs` Edge Function writes frames to. */
export const AI_JOBS_STORAGE_BUCKET = 'pixelforge'
export const AI_JOB_PROVIDER_PIXELLAB = 'pixellab' as const
export const AI_JOB_KIND_ANIMATION = 'animation' as const
export const AI_JOB_STATUS_COMPLETED = 'completed'

/** Matches the column checks in `supabase/migrations/20261012030000_ai_jobs.sql`. */
export const AI_JOB_LABEL_MAX_LENGTH = 120
export const AI_JOB_ASSET_TYPE_MAX_LENGTH = 40

/** Bounds the `ai_jobs` insert so a slow Supabase never delays the job id reaching the browser for long. */
export const AI_JOB_RECORD_TIMEOUT_MS = 10000

/**
 * Frames are stored one PNG per frame: `<file_path><index>.png`, index 0-based
 * and zero-padded to this width (`000.png`, `001.png`, …). Must match
 * `FRAME_INDEX_PAD` in `supabase/functions/collect-ai-jobs/index.ts`.
 */
export const AI_JOB_FRAME_INDEX_PAD = 3
export const AI_JOB_FRAME_EXTENSION = '.png'

/** Most recent completed server jobs one sync pass looks at. */
export const SERVER_ANIMATION_SYNC_LIMIT = 50
/** Server job ids remembered as already synced (localStorage), newest first. */
export const SERVER_SYNCED_JOB_IDS_LIMIT = 500

/** Server env names the submit function reads (falls back to the `VITE_*` pair the client already uses). */
export const SERVER_SUPABASE_URL_ENV = 'SUPABASE_URL'
export const SERVER_SUPABASE_ANON_KEY_ENV = 'SUPABASE_ANON_KEY'
export const CLIENT_SUPABASE_URL_ENV = 'VITE_SUPABASE_URL'
export const CLIENT_SUPABASE_ANON_KEY_ENV = 'VITE_SUPABASE_ANON_KEY'

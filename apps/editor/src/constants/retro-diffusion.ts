import type { RetroDiffusionStyle } from '../types/ai-generation'

/* ── Retro Diffusion ────────────────────────────────────────────────────────
 * The base-sprite generation engine. Animations moved to PixelLab (ADR 0009,
 * see constants/animation.ts and lib/animation-harness.ts).
 *
 * Imported by the client AND by the Vercel Function `api/ai/retro-diffusion.ts`,
 * so this file must stay free of runtime imports (no `@/` alias, no tokens).
 *
 * Two properties shape this whole path: it takes width/height as real
 * parameters, and it returns a true RGBA PNG at exactly that resolution.
 * Verified live: a 64x64 request answers with a 64x64 PNG, colorType 6 (RGBA).
 *
 * That is why generation needs NO background removal, NO downscale and NO
 * quantization — the response already is the pixel grid. Do not reintroduce
 * those steps here; they only apply to images imported from outside the editor.
 */
export const RETRO_DIFFUSION_ENDPOINT = 'https://api.retrodiffusion.ai/v1/inferences'
export const RETRO_DIFFUSION_ROUTE = '/api/ai/retro-diffusion'
export const RETRO_DIFFUSION_TOKEN_HEADER = 'X-RD-Token'
export const RETRO_DIFFUSION_STYLES = ['rd_fast__default', 'rd_plus__default'] as const
export const RETRO_DIFFUSION_DEFAULT_STYLE: RetroDiffusionStyle = 'rd_fast__default'
/**
 * Per-generation USD cost, measured live with `check_cost` (free) on
 * 2026-10-11. Flat per quality tier — unlike the Fast/Plus-only table this
 * replaces, size does NOT change the price, so there is no per-size lookup
 * anymore. See `QUALITY_TIER_COST_USD` below for the tier→price map that
 * replaced it.
 */
export const RETRO_DIFFUSION_MIN_SIZE = 64
export const RETRO_DIFFUSION_MAX_SIZE = 384
/**
 * `rd_pro__*` styles (Quality: Best) accept a narrower range than Fast/Plus —
 * measured live on 2026-10-11. Requesting outside it is rejected upstream, so
 * the server clamps by style, not by a single global range.
 */
export const RETRO_DIFFUSION_PRO_STYLE_PREFIX = 'rd_pro__'
export const RETRO_DIFFUSION_PRO_MIN_SIZE = 12
export const RETRO_DIFFUSION_PRO_MAX_SIZE = 256
export const RETRO_DIFFUSION_DEFAULT_STRENGTH = 0.6
// Measured live: a 64px sprite took 15.6s end to end. 120s leaves room for queueing.
export const RETRO_DIFFUSION_TIMEOUT_MS = 120000
export const RETRO_DIFFUSION_NO_IMAGE_ERROR = 'Retro Diffusion did not return an image.'
export const RETRO_DIFFUSION_MISSING_KEY_ERROR =
  'Missing Retro Diffusion API key. Add it in settings or set API_RETRO_DIFFUSION.'

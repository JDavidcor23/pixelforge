import type {
  RgbaColor,
  ToolDefinition,
  AnimationAction,
  AnimationDirection,
  RetroDiffusionStyle,
  RetroDiffusionAnimationAction,
} from '@/app/editor/types'

export const SPRITE_EDITOR_CANVAS = {
  DEFAULT_WIDTH: 32,
  DEFAULT_HEIGHT: 32,
  MIN_ZOOM: 1,
  MAX_ZOOM: 40,
  DEFAULT_ZOOM: 16,
  GRID_LINE_COLOR: '#1a1a2e',
  GRID_LINE_WIDTH: 0.5,
} as const

export const SPRITE_EDITOR_COLORS = {
  BACKGROUND: '#0f1115',
  SURFACE: '#1a1a2e',
  SURFACE_LIGHT: '#252540',
  ACCENT: '#00f5ff',
  ACCENT_HOVER: '#00d4db',
  TEXT_PRIMARY: '#ededed',
  TEXT_SECONDARY: '#8888aa',
  BORDER: 'rgba(255,255,255,0.1)',
  TRANSPARENT_CHECKER_A: '#2a2a3e',
  TRANSPARENT_CHECKER_B: '#1e1e30',
  MAX_PALETTE_COLORS: 32,
} as const

export const SPRITE_EDITOR_TOOLS: readonly ToolDefinition[] = [
  { type: 'pencil', label: 'Pencil', shortcut: 'P', iconName: 'Pencil' },
  { type: 'eraser', label: 'Eraser', shortcut: 'E', iconName: 'Eraser' },
  { type: 'bucket', label: 'Paint Bucket', shortcut: 'G', iconName: 'PaintBucket' },
  { type: 'eyedropper', label: 'Eyedropper', shortcut: 'I', iconName: 'Pipette' },
  { type: 'select', label: 'Select', shortcut: 'M', iconName: 'SquareDashed' },
  { type: 'transform', label: 'Transform', shortcut: 'V', iconName: 'Move' },
] as const

export const SPRITE_EDITOR_DEFAULTS = {
  PRIMARY_COLOR: { r: 0, g: 245, b: 255, a: 255 } as RgbaColor,
  SECONDARY_COLOR: { r: 0, g: 0, b: 0, a: 0 } as RgbaColor,
  LAYER_NAME_PREFIX: 'Layer',
} as const

export const SPRITE_EDITOR_HISTORY = {
  MAX_ENTRIES: 50,
} as const

export const SPRITE_EDITOR_TIMELINE = {
  DEFAULT_FPS: 12,
  DEFAULT_FRAME_DURATION_MS: 83,
  MIN_FPS: 1,
  MAX_FPS: 60,
} as const

export const SPRITE_EDITOR_LAYER = {
  DEFAULT_OPACITY: 100,
  MIN_OPACITY: 0,
  MAX_OPACITY: 100,
} as const

export const SPRITE_EDITOR_VIEWPORT = {
  PERCENTAGE_MULTIPLIER: 100,
  ZOOM_STEP: 1,
} as const

export const SPRITE_EDITOR_KEYBOARD = {
  UNDO: 'ctrl+z',
  REDO: 'ctrl+shift+z',
  PENCIL: 'p',
  ERASER: 'e',
  BUCKET: 'g',
  EYEDROPPER: 'i',
  SELECT: 'm',
  TRANSFORM: 'v',
  ZOOM_IN: 'ctrl+=',
  ZOOM_OUT: 'ctrl+-',
} as const

export const SPRITE_ANIMATION = {
  DEFAULT_N_FRAMES: 6,
  DEFAULT_ACTION: 'walk',
  DEFAULT_DIRECTION: 'right',
  DEFAULT_VIEW: 'side',
  DEFAULT_FRAME_DURATION_MS: 120,
  ACTIONS: ['idle', 'walk', 'run', 'attack', 'jump'],
  DIRECTIONS: ['left', 'right'],
  // Retro Diffusion bills an animation FLAT regardless of frame count, so a
  // longer cycle costs the same as a short one. All values verified accepted.
  FRAME_OPTIONS: [4, 6, 8, 12, 16],
} as const

export const AI_SPRITE_SIZES = [64, 128] as const
export const AI_SPRITE_DEFAULT_SIZE: number = AI_SPRITE_SIZES[0]
// Manual sprite import: the user declares how many frames the uploaded PNG
// contains (engine-style, no auto-detection). 1 = single sprite, >=2 = sheet.
// Quantization is intentionally disabled on import — the image is already
// hand-cleaned, so re-quantizing would destroy the user's exact palette.
export const SPRITE_IMPORT_DEFAULT_FRAMES = 1
export const SPRITE_IMPORT_MIN_FRAMES = 1
export const SPRITE_IMPORT_MAX_FRAMES = 16
// Accepted file types for the import <input>. PNG first (preferred for crisp
// pixel art), but any image type is allowed.
export const SPRITE_IMPORT_ACCEPT = 'image/png,image/*'
// Increment whenever persisted animation frames become incompatible with the
// current generation/normalization pipeline. Unversioned entries are legacy.
export const ANIMATION_PIPELINE_VERSION = 1
export const ANIMATION_HISTORY_STORAGE_KEY = 'sprite_animation_history'
export const GENERATION_HISTORY_STORAGE_KEY = 'sprite_generation_history'
export const ANIMATION_HISTORY_LIMIT = 10
export const QUANTIZE_DEFAULTS = {
  COLORS: 16,
  ITERATIONS: 12,
  SATURATION_WEIGHT: 6, // weight = 1 + SATURATION_WEIGHT * saturation
  ALPHA_THRESHOLD: 128, // 0..255 alpha scale (project-wide RgbaColor convention)
} as const
// Below this alpha (0..255 scale) a pixel counts as transparent when measuring a
// sprite's content bounding box.
export const ALPHA_TRANSPARENT_THRESHOLD = 16

/* ── Retro Diffusion ────────────────────────────────────────────────────────
 * Replaces the Codex CLI generation path. Codex routes through the gpt-image-2
 * tool, which cannot produce alpha at all — hence the random white/green/magenta
 * fills that chroma-key.ts had to guess at — and takes a prompt sentence instead
 * of a size parameter, hence the ~1254px output for a "64x64" request.
 *
 * Retro Diffusion takes width/height directly and returns a true RGBA PNG at
 * that exact resolution, so this path needs no chroma-key, no downscale and no
 * quantization. Verified live: 64x64 request -> 64x64 PNG, colorType 6 (RGBA).
 */
export const RETRO_DIFFUSION_ENDPOINT = 'https://api.retrodiffusion.ai/v1/inferences'
export const RETRO_DIFFUSION_ROUTE = '/api/ai/retro-diffusion'
export const RETRO_DIFFUSION_TOKEN_HEADER = 'X-RD-Token'
export const RETRO_DIFFUSION_STYLES = ['rd_fast__default', 'rd_plus__default'] as const
export const RETRO_DIFFUSION_DEFAULT_STYLE: RetroDiffusionStyle = 'rd_fast__default'
/**
 * Per-image USD cost, measured with `check_cost` (free) on 2026-08-17.
 * Note the floor: below ~128px the price barely moves, so generating SMALLER
 * than the flat zone saves nothing. Always request the largest size that still
 * costs the floor rather than the size the user happens to be editing at.
 */
export const RETRO_DIFFUSION_COST_TABLE = {
  rd_fast__default: { 32: 0.017, 64: 0.017, 128: 0.019, 256: 0.028, 384: 0.041 },
  rd_plus__default: { 32: 0.026, 64: 0.027, 128: 0.033, 256: 0.058, 384: 0.099 },
} as const
export const RETRO_DIFFUSION_MIN_SIZE = 32
export const RETRO_DIFFUSION_MAX_SIZE = 384
export const RETRO_DIFFUSION_DEFAULT_STRENGTH = 0.6
// Measured live: a 64px sprite took 15.6s end to end. 120s leaves room for queueing.
export const RETRO_DIFFUSION_TIMEOUT_MS = 120000
/**
 * Animations are far heavier than single sprites and MUST NOT share the sprite
 * timeout. A 6-frame request blew straight past 60s, the route aborted, and
 * Retro Diffusion still billed the $0.14 — the generation succeeded upstream and
 * was thrown away on our side. Aborting an animation costs real money, so this
 * is deliberately generous.
 */
export const RETRO_DIFFUSION_ANIMATION_TIMEOUT_MS = 300000
/* ── Retro Diffusion: animation ─────────────────────────────────────────────
 * Every action below was probed live against the API. `run`, `running`, `die`
 * and `hurt` are REJECTED, so a run request maps to `custom_action` and puts the
 * intent in the prompt text instead of the style name.
 *
 * Retro Diffusion returns the frames as ONE grid sheet (4 frames of 64px arrive
 * as a single 128x128 PNG, 2x2), with exact even cells and no gutters. That is
 * why the column-valley frame detection this project used for Codex sheets is
 * unnecessary here — the cut is plain division.
 */
export const RETRO_DIFFUSION_ANIMATION_STYLE_PREFIX = 'rd_advanced_animation__'
export const RETRO_DIFFUSION_ANIMATION_ACTIONS: Readonly<
  Record<AnimationAction, RetroDiffusionAnimationAction>
> = {
  idle: 'idle',
  walk: 'walking',
  run: 'custom_action',
  attack: 'attack',
  jump: 'jump',
} as const
/** Billed FLAT regardless of frame count (2..16 all verified at the same price). */
export const RETRO_DIFFUSION_ANIMATION_COST_USD = 0.14
/**
 * Because the price does not scale with frame count, these lean higher than the
 * old Codex options — more frames cost exactly the same.
 */
export const RETRO_DIFFUSION_ANIMATION_FRAME_OPTIONS = [4, 6, 8, 12, 16] as const
export const RETRO_DIFFUSION_ANIMATION_DEFAULT_FRAMES = 6
export const RETRO_DIFFUSION_ANIMATION_PROMPT = (
  action: AnimationAction,
  direction: AnimationDirection,
): string =>
  `${action} animation cycle, character facing ${direction}, side view, ` +
  'keep the exact character from the reference image: same palette, face, costume ' +
  'and body proportions. Only the pose changes.'
export const RETRO_DIFFUSION_NO_IMAGE_ERROR = 'Retro Diffusion did not return an image.'
export const RETRO_DIFFUSION_MISSING_KEY_ERROR =
  'Missing Retro Diffusion API key. Add it in settings or set API_RETRO_DIFFUSION.'



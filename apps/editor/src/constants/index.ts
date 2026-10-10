import type {
  RgbaColor,
  ToolDefinition,
  AnimationAction,
  AnimationDirection,
  RetroDiffusionStyle,
  RetroDiffusionAnimationAction,
} from '@/app/editor/types'
import { COLORS } from '@/constants/COLORS'

export const SPRITE_EDITOR_CANVAS = {
  DEFAULT_WIDTH: 32,
  DEFAULT_HEIGHT: 32,
  MIN_ZOOM: 1,
  MAX_ZOOM: 40,
  DEFAULT_ZOOM: 16,
  /**
   * Zoom the "center view" action snaps to — 900%, since zoom is a raw
   * multiplier (see SPRITE_EDITOR_VIEWPORT.PERCENTAGE_MULTIPLIER).
   * Chosen for live demos: the grid stays legible from a distance while the
   * whole sprite still fits comfortably in the viewport.
   */
  RESET_VIEW_ZOOM: 9,
  GRID_LINE_COLOR: COLORS.CANVAS.GRID_LINE,
  GRID_LINE_WIDTH: 0.5,
} as const

/**
 * Canvas-facing colors. These are aliases onto the global token contract
 * (`src/constants/COLORS.ts` → `src/app/globals.css`) — the editor does NOT own
 * a palette of its own. Add nothing here that is not already a token.
 */
export const SPRITE_EDITOR_COLORS = {
  BACKGROUND: COLORS.SURFACE.BASE,
  SURFACE: COLORS.SURFACE.SURFACE,
  SURFACE_LIGHT: COLORS.SURFACE.HOVER,
  ACCENT: COLORS.ACCENT.DEFAULT,
  ACCENT_HOVER: COLORS.ACCENT.STRONG,
  TEXT_PRIMARY: COLORS.TEXT.INK,
  TEXT_SECONDARY: COLORS.TEXT.MUTED,
  BORDER: COLORS.LINE.STRONG,
  TRANSPARENT_CHECKER_A: COLORS.CANVAS.CHECKER_A,
  TRANSPARENT_CHECKER_B: COLORS.CANVAS.CHECKER_B,
} as const

export const SPRITE_EDITOR_PALETTE = {
  MAX_COLORS: 32,
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
  /** COLORS.ACCENT.DEFAULT (#00fbfb) expressed as RGBA. */
  PRIMARY_COLOR: { r: 0, g: 251, b: 251, a: 255 } as RgbaColor,
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
  RESET_VIEW: 'ctrl+0',
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
 * The sprite and animation generation engine.
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
 * as a single 128x128 PNG, 2x2), with exact even cells and no gutters. Slicing
 * is therefore plain division — no gap or valley detection is needed.
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
 * Because the price does not scale with frame count, these lean deliberately
 * high — asking for more frames costs exactly the same.
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



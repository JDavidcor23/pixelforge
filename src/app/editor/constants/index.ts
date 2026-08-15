import type { RgbaColor, ToolDefinition, AnimationAction, AnimationDirection } from '@/app/editor/types'

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

export const PIXELLAB_ANIMATION = {
  DEFAULT_N_FRAMES: 4,
  DEFAULT_ACTION: 'walk',
  DEFAULT_DIRECTION: 'right',
  DEFAULT_VIEW: 'side',
  DEFAULT_FRAME_DURATION_MS: 120,
  ACTIONS: ['idle', 'walk', 'run', 'attack', 'jump'],
  DIRECTIONS: ['left', 'right'],
  FRAME_OPTIONS: [3, 4, 6, 8],
} as const

export const AI_OUTPUT_ENV = 'AI_OUTPUT_DIR' // dir Codex writes images to, e.g. ~/.codex/generated_images
export const CODEX_GENERATE_ROUTE = '/api/ai/codex-generate'
export const CODEX_TIMEOUT_MS = 360000 // codex exec is an agent loop; spike measured ~4-5 min per generation
export const CODEX_MAX_BUFFER_BYTES = 10 * 1024 * 1024 // codex exec can print large tool-call payloads to stdout
// Shared verbatim between the API route (server response) and the client hook
// (error-message matching), so they must stay in sync via this single constant.
export const CODEX_NO_PNG_ERROR = 'Codex did not produce a PNG.'
// gpt-5.4 retires 2026-07-23 per OpenAI; bump this when that happens.
export const CODEX_IMAGE_MODEL = 'gpt-5.5'
export const CODEX_BASE_PROMPT =
  'Generate a 64x64 pixel art sprite, limited palette of max 16 colors, no anti-aliasing, ' +
  'transparent background, full body centered, retro 16-bit style. Subject: '
/**
 * Self-contained sheet prompt. Animation requests deliberately bypass the
 * single-sprite CODEX_BASE_PROMPT because "one centered 64x64 sprite"
 * conflicts with a multi-cell horizontal sheet.
 */
export const ANIMATION_SHEET_PROMPT = (
  action: AnimationAction,
  direction: AnimationDirection,
  nFrames: number,
): string =>
  `Create ONE sprite sheet for a ${action} animation cycle facing ${direction}. Use the attached ` +
  'image as the EXACT character reference: preserve its palette, face, costume, silhouette, body ' +
  'proportions, pixel density, and relative character size. Treat the checkerboard in the reference ' +
  `as transparency; NEVER draw a checkerboard. Draw exactly ${nFrames} frames, no more and no fewer, ` +
  `in one horizontal row on a ${nFrames}:1 canvas. Every frame is one equal square logical cell. ` +
  'Keep the feet on the same baseline and the body at the same scale in every cell. Leave a clearly ' +
  'empty transparent gutter between cells; pixels, limbs, capes, effects, and shadows from one frame ' +
  'must NEVER touch or enter another cell. Only the pose changes. Transparent background, crisp hard ' +
  'pixel edges, no anti-aliasing, no gradients, retro pixel-art style.'
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
export const ANIMATION_HISTORY_STORAGE_KEY = 'codex_animation_history'
export const ANIMATION_HISTORY_LIMIT = 10
export const QUANTIZE_DEFAULTS = {
  COLORS: 16,
  ITERATIONS: 12,
  SATURATION_WEIGHT: 6, // weight = 1 + SATURATION_WEIGHT * saturation
  ALPHA_THRESHOLD: 128, // 0..255 alpha scale (project-wide RgbaColor convention)
} as const
// Euclidean RGB distance under which a pixel is considered part of the flood-filled
// background. Measured against a real Codex sheet (magenta and white backgrounds): 80
// removes only background (73.8%) without eating into same-colored character pixels.
export const CHROMA_KEY_TOLERANCE = 80
// The flood-fill above stops at the anti-aliased ring where the background blends
// into the sprite (those pixels sit just outside CHROMA_KEY_TOLERANCE). Left in
// place that ring shows up as a bright "halo" once the sprite is composited on a
// dark editor background. After keying, we erode inward from the removed region,
// dropping still-opaque pixels that touch a removed pixel AND fall within this
// wider tolerance of the background. Kept below the distance from the background
// to the sprite's own dark outline (~350+ for white bg) so erosion eats the halo
// and then stops dead at the outline instead of chewing into the character.
export const CHROMA_FRINGE_TOLERANCE = 120
// Max erosion rings. The halo is 1–2px; a small bound stops a gap in the outline
// from leaking the erosion inward across the whole sprite.
export const CHROMA_FRINGE_PASSES = 4
// Below this alpha (0..255 scale), a border pixel is considered already transparent —
// used to skip chroma-keying images Codex already generated with a transparent background.
export const ALPHA_TRANSPARENT_THRESHOLD = 16
// A sheet column is a "gap" (no frame content) when fewer than this fraction of its
// pixels are opaque (alpha >= ALPHA_TRANSPARENT_THRESHOLD). Validated against a real
// Codex sheet: 1% tolerates a few stray anti-aliased/noise pixels inside a gap column
// without merging two adjacent frames together.
export const GAP_CONTENT_RATIO = 0.01
// Minimum width (px, at native Codex resolution) for a run of content columns to count
// as a real frame instead of noise (e.g. a single stray opaque pixel column). Chosen as
// a small fraction of a typical native sheet cell so it filters noise without discarding
// legitimately thin frames (e.g. a character mid-stride, arms tucked in).
export const MIN_FRAME_WIDTH = 4
// A detected run wider than this multiple of the median run probably contains
// two touching frames. It is split at the lowest-content projection valley.
export const FRAME_RUN_SPLIT_FACTOR = 1.55
// Search radius around an expected cell boundary when finding the least busy
// column. This recovers a cut even when effects/capes bridge the gutter.
export const FRAME_SPLIT_SEARCH_RATIO = 0.25
// Used when no reference occupancy can be measured. Leaves enough breathing
// room for attack effects without making the character look artificially tiny.
export const ANIMATION_DEFAULT_CONTENT_RATIO = 0.8
export const ANIMATION_MIN_CONTENT_RATIO = 0.6
export const ANIMATION_MAX_CONTENT_RATIO = 0.9



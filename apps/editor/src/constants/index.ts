import type {
  RgbaColor,
  ToolDefinition,
  AnimationDirection,
  AnimateMotionOption,
  AssetType,
  CreateMethod,
  InspectorTabId,
  BottomPanelTabId,
  RetroDiffusionStyle,
} from '@/types'
import { COLORS } from '@pixelforge/tokens/colors'

export const SPRITE_EDITOR_CANVAS = {
  // Batch 4: the AI minimum (see AI_SPRITE_SIZES below) — a brand-new, empty
  // document now starts at the same size a Generate/Animate result would
  // land at, so the two paths don't fight over canvas size. Only affects
  // NEW documents; an existing persisted draft keeps whatever size it was
  // saved at (`useDocumentPersistence` restores `canvasWidth`/`canvasHeight`
  // from the draft, never from this default).
  DEFAULT_WIDTH: 64,
  DEFAULT_HEIGHT: 64,
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
 * (`packages/tokens/colors.ts` → `packages/tokens/tokens.css`) — the editor
 * does NOT own a palette of its own. Add nothing here that is not already a
 * token.
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

/**
 * The one fully-transparent RGBA value, reused everywhere a command/slice
 * needs to "erase" a pixel (eraser stroke color, `region.clear`,
 * `selection.commit`'s baked-out original area). Phase 2c cleanup: this used
 * to be re-declared as an inline `{ r: 0, g: 0, b: 0, a: 0 }` literal in
 * `lib/core/ts-core.ts`, `stores/slices/selection.slice.ts` and
 * `stores/slices/clipboard.slice.ts`.
 */
export const TRANSPARENT_COLOR: RgbaColor = { r: 0, g: 0, b: 0, a: 0 }

/** Milliseconds per second — used wherever an fps <-> per-frame-duration conversion happens. */
export const MS_PER_SECOND = 1000

export const SPRITE_EDITOR_DEFAULTS = {
  /** COLORS.ACCENT.DEFAULT (#00fbfb) expressed as RGBA. */
  PRIMARY_COLOR: { r: 0, g: 251, b: 251, a: 255 } as RgbaColor,
  SECONDARY_COLOR: TRANSPARENT_COLOR,
  LAYER_NAME_PREFIX: 'Layer',
} as const

export const SPRITE_EDITOR_HISTORY = {
  MAX_ENTRIES: 50,
  /** Dirty-rect undo history budget (phase 2, design D4): 32 MiB retained total. */
  MAX_BYTES: 32 * 1024 * 1024,
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
  DEFAULT_DIRECTION: 'right',
  DEFAULT_FRAME_DURATION_MS: 120,
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
 * Retro Diffusion returns the frames as ONE grid sheet (4 frames of 64px arrive
 * as a single 128x128 PNG, 2x2), with exact even cells and no gutters. Slicing
 * is therefore plain division — no gap or valley detection is needed.
 */
export const RETRO_DIFFUSION_ANIMATION_STYLE_PREFIX = 'rd_advanced_animation__'
/** Billed FLAT regardless of frame count (2..16 all verified at the same price). */
export const RETRO_DIFFUSION_ANIMATION_COST_USD = 0.14
export const RETRO_DIFFUSION_NO_IMAGE_ERROR = 'Retro Diffusion did not return an image.'
export const RETRO_DIFFUSION_MISSING_KEY_ERROR =
  'Missing Retro Diffusion API key. Add it in settings or set API_RETRO_DIFFUSION.'
/** Shown instead of the raw upstream error when an unverified motion is rejected. */
export const RETRO_DIFFUSION_MOTION_REJECTED_HINT =
  'Retro Diffusion rejected this motion. Try Custom.'

export const RETRO_DIFFUSION_CHARACTER_ANIMATION_PROMPT = (
  motionText: string,
  direction: AnimationDirection,
): string =>
  `${motionText} animation cycle, character facing ${direction}, side view, ` +
  'keep the exact character from the reference image: same palette, face, costume ' +
  'and body proportions. Only the pose changes.'

export const RETRO_DIFFUSION_OBJECT_ANIMATION_PROMPT = (motionText: string, assetType: AssetType): string =>
  `${motionText} animation, ${assetType} object, keep the exact object from the reference image: ` +
  'same palette, shape and proportions.'

/**
 * Animate tab, Sprite Studio v2 batch 2 — the motion catalogue per asset type.
 * `idle`, `walking`, `jump` and `attack` were probed live against the Retro
 * Diffusion API and accepted. `crouch`, `destroy` and `subtle_motion` were
 * NOT probed live (only a subset of advanced-animation styles were verified
 * — see `RetroDiffusionAnimationAction`); `custom_action` is always accepted
 * since it carries free-text intent instead of naming a style. `run`,
 * `running`, `die` and `hurt` are confirmed REJECTED as style names, which is
 * why "Run" maps to `custom_action` and puts the word in the prompt instead.
 */
export const ANIMATE_CHARACTER_MOTIONS: readonly AnimateMotionOption[] = [
  { id: 'idle', label: 'Idle', rdAction: 'idle' },
  { id: 'walk', label: 'Walk', rdAction: 'walking' },
  { id: 'run', label: 'Run', rdAction: 'custom_action' },
  { id: 'jump', label: 'Jump', rdAction: 'jump' },
  { id: 'attack', label: 'Attack', rdAction: 'attack' },
  { id: 'crouch', label: 'Crouch', rdAction: 'crouch' }, // unverified, see comment above
  { id: 'custom', label: 'Custom', rdAction: 'custom_action', isCustomInput: true },
] as const

export const ANIMATE_OBJECT_MOTIONS: readonly AnimateMotionOption[] = [
  {
    id: 'breathe',
    label: 'Breathe',
    rdAction: 'subtle_motion', // unverified, see comment above
    fixedMotionText: 'subtle idle breathing',
  },
  {
    id: 'squash',
    label: 'Squash & stretch',
    rdAction: 'custom_action',
    fixedMotionText: 'rubber-hose squash and stretch idle loop, bouncy, cartoon',
  },
  { id: 'spin', label: 'Spin', rdAction: 'custom_action', fixedMotionText: 'spinning in place loop' },
  {
    id: 'break',
    label: 'Break apart',
    rdAction: 'destroy', // unverified, see comment above
    fixedMotionText: 'breaking apart',
  },
  { id: 'custom', label: 'Custom', rdAction: 'custom_action', isCustomInput: true },
] as const

/** object/weapon/costume/effect all share the same non-character motion set. */
export const ANIMATE_MOTIONS_BY_ASSET_TYPE: Readonly<Record<AssetType, readonly AnimateMotionOption[]>> = {
  character: ANIMATE_CHARACTER_MOTIONS,
  object: ANIMATE_OBJECT_MOTIONS,
  weapon: ANIMATE_OBJECT_MOTIONS,
  costume: ANIMATE_OBJECT_MOTIONS,
  effect: ANIMATE_OBJECT_MOTIONS,
}

export const ANIMATE_DEFAULT_MOTION_ID: Readonly<Record<AssetType, string>> = {
  character: 'idle',
  object: 'breathe',
  weapon: 'breathe',
  costume: 'breathe',
  effect: 'breathe',
}

/** Only `character` gets a character-flavoured example — every other type shares a generic one. */
export const ANIMATE_CUSTOM_MOTION_PLACEHOLDER: Readonly<Record<AssetType, string>> = {
  character: 'e.g. shoots the pistol and recoils',
  object: 'e.g. the cannon fires and recoils',
  weapon: 'e.g. the blade glows and pulses',
  costume: 'e.g. the cloak billows in the wind',
  effect: 'e.g. the sparkles swirl and burst outward',
}

/** Generated sprites kept in the Assets library (mirrors ANIMATION_HISTORY_LIMIT). */
export const GENERATION_HISTORY_LIMIT = 10

/* ── Sprite Studio v2 shell ──────────────────────────────────────────────────
 * Layout dimensions for the redesigned sprite workspace: a fixed top bar, a
 * resizable layers rail, a fluid canvas, a resizable inspector and a
 * resizable, collapsible bottom panel (timeline / assets).
 */
export const SPRITE_EDITOR_LAYOUT = {
  TOP_BAR_HEIGHT: 44,
} as const

/**
 * Resizable panel bounds (batch 2: "shrink the menus, not hide them"). Values
 * are raw px numbers (not CSS strings) because the drag handle needs to do
 * arithmetic on them. The canvas itself is floor-protected separately by
 * `CANVAS_MIN_SIZE` — panel resize is clamped so the canvas never goes
 * below that, in addition to each panel's own min/max.
 */
export const RESIZABLE_PANELS = {
  LEFT: { DEFAULT: 280, MIN: 200, MAX: 420 },
  RIGHT: { DEFAULT: 300, MIN: 260, MAX: 480 },
  /**
   * Batch 3: frame thumbnails are now a fixed 56px (TIMELINE_THUMBNAIL_SIZE),
   * so the Timeline tab fits snugly at its MIN — no more deriving thumbnail
   * size from this height. Assets still benefits from dragging it taller.
   */
  BOTTOM: { DEFAULT: 120, MIN: 120, MAX: 360 },
} as const

export const CANVAS_MIN_SIZE = { WIDTH: 320, HEIGHT: 200 } as const

/** Keyboard resize step for the panel drag handles (role="separator"). Shift multiplies by 4. */
export const PANEL_RESIZE_STEP = 16
export const PANEL_RESIZE_STEP_LARGE = 64

/** Shown in the top bar until the document carries a real project name. */
export const SPRITE_DOCUMENT_DEFAULT_NAME = 'Untitled sprite'

export const INSPECTOR_TABS: readonly { readonly id: InspectorTabId; readonly label: string; readonly iconName: string }[] = [
  { id: 'properties', label: 'Properties', iconName: 'SlidersHorizontal' },
  { id: 'create', label: 'Create', iconName: 'Sparkles' },
  { id: 'animate', label: 'Animate', iconName: 'Film' },
] as const

export const BOTTOM_PANEL_TABS: readonly { readonly id: BottomPanelTabId; readonly label: string; readonly iconName: string }[] = [
  { id: 'timeline', label: 'Timeline', iconName: 'GalleryHorizontal' },
  { id: 'assets', label: 'Assets', iconName: 'FolderOpen' },
] as const

/** Create tab, step 1 — "what are you making?" chip set. */
export const ASSET_TYPES: readonly { readonly id: AssetType; readonly label: string; readonly iconName: string }[] = [
  { id: 'character', label: 'Character', iconName: 'User' },
  { id: 'object', label: 'Object', iconName: 'Box' },
  { id: 'weapon', label: 'Weapon', iconName: 'Sword' },
  { id: 'costume', label: 'Costume', iconName: 'Shirt' },
  { id: 'effect', label: 'Effect', iconName: 'Sparkles' },
] as const

export const DEFAULT_ASSET_TYPE: AssetType = 'character'

/**
 * Retro Diffusion `prompt_style` per asset type. `character`/`costume` keep
 * the already-verified default style; `object`/`weapon`/`effect` point at
 * styles that are NOT yet verified live (see `RetroDiffusionSpriteStyle`) —
 * conservative, additive wiring, not a confirmed-safe mapping.
 */
export const ASSET_TYPE_STYLE: Readonly<Record<AssetType, RetroDiffusionStyle>> = {
  character: RETRO_DIFFUSION_DEFAULT_STYLE,
  object: 'rd_fast__game_asset',
  weapon: 'rd_plus__item_sheet',
  costume: RETRO_DIFFUSION_DEFAULT_STYLE,
  effect: 'rd_fast__game_asset',
}

export const ASSET_TYPE_PROMPT_PLACEHOLDER: Readonly<Record<AssetType, string>> = {
  character: 'A cute dragon, 8-bit style...',
  object: 'A wooden barrel with iron bands',
  weapon: 'A notched iron shortsword with a leather grip',
  costume: 'A hooded cloak with a frayed hem',
  effect: 'A burst of green magic sparkles',
}

/**
 * "Try:" example chips (Create > Generate). Each chip shows a short `label`
 * but clicking it fills the textarea with the full `prompt` — a full sentence
 * button wraps awkwardly in the 300px Inspector rail, a one-or-two-word chip
 * doesn't. Capped at 3 per type to keep the row from wrapping to more than
 * two lines even at the narrowest panel width.
 */
export const ASSET_TYPE_EXAMPLE_CHIPS: Readonly<Record<AssetType, readonly { readonly label: string; readonly prompt: string }[]>> = {
  character: [
    { label: 'Dragon', prompt: 'A cute dragon, 8-bit style' },
    { label: 'Knight', prompt: 'A stoic knight in iron plate' },
    { label: 'Goblin', prompt: 'A forest goblin scout' },
  ],
  object: [
    { label: 'Barrel', prompt: 'A wooden barrel with iron bands' },
    { label: 'Treasure chest', prompt: 'A glowing treasure chest' },
    { label: 'Stone pillar', prompt: 'A cracked stone pillar' },
  ],
  weapon: [
    { label: 'Shortsword', prompt: 'A notched iron shortsword' },
    { label: 'Hunting bow', prompt: 'A recurve hunting bow' },
    { label: 'War hammer', prompt: 'A spiked war hammer' },
  ],
  costume: [
    { label: 'Hooded cloak', prompt: 'A hooded cloak with a frayed hem' },
    { label: 'Ceremonial robe', prompt: 'A royal ceremonial robe' },
    { label: 'Leather jerkin', prompt: 'A patchwork leather jerkin' },
  ],
  effect: [
    { label: 'Magic sparkles', prompt: 'A burst of green magic sparkles' },
    { label: 'Frost swirl', prompt: 'A swirl of blue frost' },
    { label: 'Ember trail', prompt: 'A trail of embers' },
  ],
}

export const CREATE_METHODS: readonly { readonly id: CreateMethod; readonly label: string; readonly iconName: string }[] = [
  { id: 'draw', label: 'Draw', iconName: 'Pencil' },
  { id: 'generate', label: 'Generate', iconName: 'WandSparkles' },
  { id: 'import', label: 'Import', iconName: 'Upload' },
] as const

export const DEFAULT_CREATE_METHOD: CreateMethod = 'generate'

/** Assets tab folder tree — `assetType: null` is the "All assets" root folder. */
export const ASSET_FOLDERS: readonly {
  readonly id: 'all' | AssetType
  readonly label: string
  readonly iconName: string
  readonly assetType: AssetType | null
}[] = [
  { id: 'all', label: 'All assets', iconName: 'Folder', assetType: null },
  { id: 'character', label: 'Characters', iconName: 'User', assetType: 'character' },
  { id: 'object', label: 'Objects', iconName: 'Box', assetType: 'object' },
  { id: 'weapon', label: 'Weapons', iconName: 'Sword', assetType: 'weapon' },
  { id: 'costume', label: 'Costumes', iconName: 'Shirt', assetType: 'costume' },
  { id: 'effect', label: 'Effects', iconName: 'Sparkles', assetType: 'effect' },
] as const

/**
 * Frame thumbnail tile size in the Timeline tab (batch 3). Fixed instead of
 * derived from the resizable bottom panel's height — the old dynamic sizing
 * (up to 96px) read as oversized and let the panel's default height balloon
 * to accommodate it. The bottom panel's `DEFAULT`/`MIN` (see
 * RESIZABLE_PANELS) are now sized to fit this value snugly instead.
 */
export const TIMELINE_THUMBNAIL_SIZE = 56

/**
 * Canvas-size control (Sprite Studio v2 batch 4, TopBar). Square presets
 * only — every size the editor cares about (manual pixel art AND the AI
 * minimums in `AI_SPRITE_SIZES`) is square. `CANVAS_SIZE_AI_HINT` annotates
 * the two sizes that match an AI generation output 1:1.
 */
export const CANVAS_SIZE_OPTIONS = [16, 32, 64, 128, 256] as const
export const CANVAS_SIZE_AI_HINT: Readonly<Partial<Record<number, string>>> = {
  64: 'Matches AI output',
  128: 'Matches AI output',
}

/** Keyboard step sizes for the Color Picker's SV square / hue slider (role="slider"). */
export const COLOR_PICKER = {
  /** Percentage points per arrow-key press on the saturation/value square. */
  SV_STEP: 2,
  /** Degrees per arrow-key press on the hue slider (0-360). */
  HUE_STEP: 4,
} as const


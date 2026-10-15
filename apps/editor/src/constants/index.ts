import type {
  RgbaColor,
  ToolDefinition,
  AssetType,
  InspectorTabId,
  BottomPanelTabId,
  RetroDiffusionStyle,
  GameTemplate,
  GameTemplateId,
  QualityTier,
  QualityTierConfig,
  QualityRecommendation,
} from '@/types'
import { COLORS } from '@pixelforge/tokens/colors'
import { ANIMATION_FRAME_OPTIONS } from './animation'

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
   * Baseline zoom the "center view" action targets at the DEFAULT_WIDTH/HEIGHT
   * (64px) canvas size — 900%, since zoom is a raw multiplier (see
   * SPRITE_EDITOR_VIEWPORT.PERCENTAGE_MULTIPLIER). Chosen for live demos: the
   * grid stays legible from a distance while the whole sprite still fits
   * comfortably in the viewport.
   *
   * The actual center-view zoom scales inversely with canvas size from this
   * baseline (see `getCenterViewZoom` in `viewport.slice.ts`), so a 128x128 or
   * 256x256 canvas renders at roughly the same ON-SCREEN pixel size instead of
   * overflowing the viewport at a flat 900%.
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
  DEFAULT_FRAME_DURATION_MS: 120,
  // PixelLab (ADR 0009): even counts 4..16 only. The default per motion lives
  // in the animation harness (`lib/animation-harness.ts`), not here.
  FRAME_OPTIONS: ANIMATION_FRAME_OPTIONS,
} as const

export const AI_SPRITE_SIZES = [64, 128] as const
export const AI_SPRITE_DEFAULT_SIZE: number = AI_SPRITE_SIZES[0]
/**
 * Create tab > Generate, default `genSize` per asset type. Verified live
 * 2026-10-11: 128x128 gives a full body WITH margin at the same price as 64
 * (Draft tier, $0.03), but a 64x64 request under Standard quality with a
 * short prompt also produced a full body with margin at a known-good price
 * ($0.06) — the owner wants 64 as the default, not 128, so every asset type
 * (including `character`) currently shares the flat `AI_SPRITE_DEFAULT_SIZE`.
 * 128 stays selectable in the Output size dropdown. Only a starting point —
 * the user's own size pick always wins (see `useGeneratePanel.hook.ts`).
 */
export const AI_SPRITE_DEFAULT_SIZE_BY_ASSET_TYPE: Readonly<Record<AssetType, number>> = {
  character: AI_SPRITE_DEFAULT_SIZE,
  object: AI_SPRITE_DEFAULT_SIZE,
  weapon: AI_SPRITE_DEFAULT_SIZE,
  costume: AI_SPRITE_DEFAULT_SIZE,
  effect: AI_SPRITE_DEFAULT_SIZE,
}
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
/**
 * Accepted file type for importing PNGs straight into the Assets library
 * (Create tab Recent strip + the bottom panel's Assets view) — PNG only,
 * unlike `SPRITE_IMPORT_ACCEPT`, since an imported asset is stored and
 * re-decoded exactly like an AI generation.
 */
export const ASSET_LIBRARY_IMPORT_ACCEPT = 'image/png'
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
 * The base-sprite generation engine. Animations moved to PixelLab (ADR 0009,
 * see constants/animation.ts and lib/animation-harness.ts).
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

/**
 * Create tab > Generate, "Quality" selector (Sprite Studio v2). `draft` is
 * exactly `ASSET_TYPE_STYLE` above (today's default, unchanged).
 *
 * `rd_plus__low_res` (`standard`, character/costume) and `rd_pro__default`
 * (`best`, every asset type) WERE verified live on 2026-10-11 — `check_cost`
 * plus a real 64px generation, at $0.06 and $0.18 respectively (see
 * `QUALITY_TIER_COST_USD`). The other `standard`-tier styles
 * (`rd_plus__default` for object/effect, `rd_plus__item_sheet` for weapon)
 * were NOT individually probed per asset type — same conservative-wiring
 * caveat as `ASSET_TYPE_STYLE`'s own comment.
 */
export const ASSET_TYPE_STYLE_BY_QUALITY: Readonly<Record<QualityTier, Readonly<Record<AssetType, RetroDiffusionStyle>>>> = {
  draft: ASSET_TYPE_STYLE,
  standard: {
    character: 'rd_plus__low_res',
    object: 'rd_plus__default',
    weapon: 'rd_plus__item_sheet',
    costume: 'rd_plus__low_res',
    effect: 'rd_plus__default',
  },
  best: {
    character: 'rd_pro__default',
    object: 'rd_pro__default',
    weapon: 'rd_pro__default',
    costume: 'rd_pro__default',
    effect: 'rd_pro__default',
  },
}

/** Must stay equal to `QUALITY_RECOMMENDATION_BY_ASSET_TYPE.character.tier` (default asset type is `character`). */
export const DEFAULT_QUALITY_TIER: QualityTier = 'standard'

/** Flat per-generation USD price per tier, measured live with `check_cost` on 2026-10-11 — size does not change it. */
export const QUALITY_TIER_COST_USD: Readonly<Record<QualityTier, number>> = {
  draft: 0.03,
  standard: 0.06,
  best: 0.18,
}

/**
 * Static comparison PNGs (64x64, same prompt/seed across tiers) — see
 * `apps/editor/public/ai-quality-samples/`. Regenerated 2026-10-11 with the
 * Platformer template's `character` rules (see `GAME_TEMPLATES.platformer`)
 * applied on top of `AI_QUALITY_SAMPLE_PROMPT`, seed 77, 64x64 — only the
 * quality tier differs between the three files.
 */
export const AI_QUALITY_SAMPLE_SRC: Readonly<Record<QualityTier, string>> = {
  draft: '/ai-quality-samples/draft.png',
  standard: '/ai-quality-samples/standard.png',
  best: '/ai-quality-samples/best.png',
}

/**
 * Exact prompt behind `AI_QUALITY_SAMPLE_SRC` (Platformer template, seed 77,
 * 64x64) — shown in the Compare-quality modal so the owner can verify what
 * produced each sample.
 */
export const AI_QUALITY_SAMPLE_PROMPT =
  'a burly old viking wizard with a long white beard, muscular bare arms, a tall pointed blue hat with stars, ' +
  'a blue robe with stars that opens at the front showing leather boots, a fur mantle, and a tall wooden staff ' +
  'with a glowing blue crystal'
/** Seed behind every `AI_QUALITY_SAMPLE_SRC` sample — shown next to the prompt in the Compare-quality modal. */
export const AI_QUALITY_SAMPLE_SEED = 77
/** Native resolution of every `AI_QUALITY_SAMPLE_SRC` file — the Compare-quality modal sizes samples as integer multiples of this. */
export const AI_QUALITY_SAMPLE_NATIVE_SIZE = 64
/** How long the Compare-quality modal's "Copy prompt" button shows "Copied" before reverting. */
export const AI_QUALITY_SAMPLE_COPY_FEEDBACK_MS = 2000

export const QUALITY_TIERS: readonly QualityTierConfig[] = [
  {
    id: 'draft',
    label: 'Draft',
    styleLabel: 'Retro Diffusion Fast',
    priceUsd: QUALITY_TIER_COST_USD.draft,
    sampleSrc: AI_QUALITY_SAMPLE_SRC.draft,
  },
  {
    id: 'standard',
    label: 'Standard',
    styleLabel: 'Retro Diffusion Plus',
    priceUsd: QUALITY_TIER_COST_USD.standard,
    sampleSrc: AI_QUALITY_SAMPLE_SRC.standard,
  },
  {
    id: 'best',
    label: 'Best',
    styleLabel: 'Retro Diffusion Pro',
    priceUsd: QUALITY_TIER_COST_USD.best,
    sampleSrc: AI_QUALITY_SAMPLE_SRC.best,
  },
] as const

/**
 * Create tab > Generate, Quality selector — which tier is "Recommended"
 * depends on the asset type, not a single global tier. Only `character` has
 * a live test behind its `reason` (2026-10-11: `rd_plus__low_res`, 64x64,
 * short prompt → full body with margin, $0.06). The other asset types reuse
 * `standard` conservatively; their `reason` must stay generic
 * (`verified: false`) until each gets its own live test — see
 * `QualityRecommendation`'s own comment.
 */
export const QUALITY_RECOMMENDATION_BY_ASSET_TYPE: Readonly<Record<AssetType, QualityRecommendation>> = {
  character: {
    tier: 'standard',
    reason: 'Best value for characters: full body at 64px.',
    verified: true,
  },
  costume: {
    tier: 'standard',
    reason: 'Same model as characters.',
    verified: false,
  },
  object: {
    tier: 'standard',
    reason: 'Good balance of detail and price.',
    verified: false,
  },
  weapon: {
    tier: 'standard',
    reason: 'Good balance of detail and price.',
    verified: false,
  },
  effect: {
    tier: 'standard',
    reason: 'Good balance of detail and price.',
    verified: false,
  },
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
/**
 * Create > Import, "Original" size (ADR 0009): an imported PNG keeps its own
 * resolution up to the largest canvas the size picker offers; only a bigger
 * image is scaled down to it.
 */
export const SPRITE_IMPORT_MAX_NATIVE_SIZE: number = CANVAS_SIZE_OPTIONS[CANVAS_SIZE_OPTIONS.length - 1]

/** Keyboard step sizes for the Color Picker's SV square / hue slider (role="slider"). */
export const COLOR_PICKER = {
  /** Percentage points per arrow-key press on the saturation/value square. */
  SV_STEP: 2,
  /** Degrees per arrow-key press on the hue slider (0-360). */
  HUE_STEP: 4,
} as const

/** Shown instead of a coordinate when the cursor is outside the canvas. */
export const CURSOR_POSITION_FALLBACK = '—'

/** Create tab > Generate/Animate — max thumbnails shown in the "Recent" strip. */
export const RECENT_ASSETS_LIMIT = 6


/**
 * Create tab > Generate — game templates. Each one is data only: adding a genre
 * (top-down RPG, top-down shooter, FPS…) means adding an entry here, not code.
 */
export const GAME_TEMPLATES: Readonly<Record<GameTemplateId, GameTemplate>> = {
  platformer: {
    id: 'platformer',
    label: 'Platformer',
    summary: 'Platformer rules on: full body, strict side profile, ready to animate.',
    rules: {
      // Verified live 2026-10-11: "side view" alone produced a 3/4 view — the
      // official Retro Diffusion example asks for a "strict side profile
      // facing right" instead, which is what this rule carries now.
      character:
        'Full body 2D platformer game character sprite, strict side profile facing right, ' +
        'flat 2D, not 3/4 view. The entire figure is visible: head, readable face, both arms, ' +
        'both legs and both feet. Feet on the ground, empty margin around the figure, ' +
        'single character, not cropped, not a portrait.',
    },
  },
}

export const DEFAULT_GAME_TEMPLATE_ID: GameTemplateId = 'platformer'

export const GAME_TEMPLATE_OFF_SUMMARY = 'No template: your prompt is sent exactly as you write it.'

export const GAME_TEMPLATE_TOOLTIP =
  "Templates add game-ready rules to your prompt so you don't burn credits on unusable sprites. " +
  'Turn it off to write everything yourself.'

/**
 * Verified live 2026-10-11: a ~350-word prompt made Retro Diffusion zoom in
 * and crop the legs; a ~40-word prompt gave a full body. Applies to every
 * asset type, not just character.
 */
export const PROMPT_WORD_LIMIT = 40

/**
 * Average Latin-script word length including its trailing space — used only
 * to express the verified `PROMPT_WORD_LIMIT` (words) in characters, since
 * the visible prompt counter (`promptCharCount`) is character-based and its
 * overage warning must share that same unit instead of mixing words/chars.
 */
const AVERAGE_CHARS_PER_WORD = 6
export const PROMPT_CHAR_LIMIT = PROMPT_WORD_LIMIT * AVERAGE_CHARS_PER_WORD
export const PROMPT_CHAR_LIMIT_WARNING = `Long prompts crop the character. Keep it under ${PROMPT_CHAR_LIMIT} characters.`

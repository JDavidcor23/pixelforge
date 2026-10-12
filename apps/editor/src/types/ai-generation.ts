export interface QuantizeOptions {
  readonly colors: number
  readonly weightBySaturation: boolean
  readonly iterations: number
  readonly alphaThreshold: number // 0..255; below this a pixel stays transparent
}

/**
 * Single-sprite styles. `rd_fast` measured ~37% cheaper than `rd_plus` at the
 * same resolution (see RETRO_DIFFUSION_COST_TABLE in constants).
 *
 * `rd_fast__game_asset` and `rd_plus__item_sheet` back the Create tab's
 * per-asset-type styles (`ASSET_TYPE_STYLE`) — unlike `rd_fast__default` /
 * `rd_plus__default` they have NOT been probed live against the Retro
 * Diffusion API (sprite-studio-v2 redesign, conservative choice: wiring is in
 * place, verify with a real `check_cost`/generation call before relying on
 * them — an invalid id surfaces as the existing generation-error banner, not
 * a crash).
 */
export type RetroDiffusionSpriteStyle =
  | 'rd_fast__default'
  | 'rd_plus__default'
  | 'rd_fast__game_asset'
  | 'rd_plus__item_sheet'
  | 'rd_plus__low_res'
  | 'rd_pro__default'

/**
 * The only animation actions Retro Diffusion actually accepts — every one of
 * these was probed live; `run`, `running`, `die` and `hurt` all fail. A "run"
 * request therefore maps to `custom_action` and carries the intent in the prompt.
 */
export type RetroDiffusionAnimationAction =
  | 'walking'
  | 'idle'
  | 'jump'
  | 'crouch'
  | 'attack'
  | 'destroy'
  | 'custom_action'
  | 'subtle_motion'

export type RetroDiffusionStyle =
  | RetroDiffusionSpriteStyle
  | `rd_advanced_animation__${RetroDiffusionAnimationAction}`

export interface RetroDiffusionRequestBody {
  readonly prompt: string
  readonly width: number
  readonly height: number
  readonly style?: RetroDiffusionStyle
  readonly seed?: number
  /**
   * Frame count for an animation style. Billed FLAT at $0.14 regardless of the
   * value (2..16 all verified), so asking for more frames is free.
   */
  readonly framesDuration?: number
  /** Without this Retro Diffusion answers with a GIF, which canvas cannot slice. */
  readonly returnSpritesheet?: boolean
  /** base64 PNG (data URI or bare) for img2img — keeps a character consistent across generations. */
  readonly inputImageBase64?: string
  /** 0..1 — how far img2img may drift from `inputImageBase64`. Ignored without one. */
  readonly strength?: number
  /** Ask only for the price. Free (credit_cost: 0) and returns no image. */
  readonly checkCost?: boolean
  /** BYOK: the end user's own token. Falls back to the server env key when absent. */
  readonly apiKey?: string
}

export interface RetroDiffusionCostEstimate {
  readonly costUsd: number
  readonly remainingBalanceUsd: number
}

export interface RetroDiffusionGenerationResult extends RetroDiffusionCostEstimate {
  /** data URI PNG, already at the requested size with a real alpha channel. */
  readonly base64: string
  readonly width: number
  readonly height: number
}

export interface AIAnimation {
  readonly pipelineVersion: number
  readonly id: string
  readonly label: string
  readonly frames: readonly string[]
  readonly frameDurationMs: number
  readonly timestamp: number
  /**
   * Asset-type folder this animation was generated under (Create tab, Sprite
   * Studio v2). Optional for back-compat — entries persisted before this field
   * existed count as `'character'` at the call site, never injected here, so
   * already-serialized history keeps round-tripping byte-for-byte.
   */
  readonly assetType?: AssetType
}

/**
 * A single Retro Diffusion sprite generation kept in the Assets library
 * (Create tab > Generate, and the bottom panel's Assets tab).
 */
export interface AIGeneration {
  readonly id: string
  readonly prompt: string
  readonly base64: string
  readonly timestamp: number
  readonly width: number
  readonly height: number
  /** See `AIAnimation.assetType` — same back-compat rule applies. */
  readonly assetType?: AssetType
}

/**
 * A PNG read from disk and decoded (data URL + natural size), ready to be
 * handed to `useAssetsStore.addGeneration` — see `lib/import-library-image.ts`.
 * `name` is the file name without its extension, used as the library entry's
 * title in place of a generation prompt.
 */
export interface ImportedLibraryImage {
  readonly name: string
  readonly dataUrl: string
  readonly width: number
  readonly height: number
}

/**
 * What the Create tab's "1 · WHAT ARE YOU MAKING?" chips let the user declare
 * about the asset they're about to draw, generate or import. Drives both the
 * Retro Diffusion `prompt_style` (see `ASSET_TYPE_STYLE`) and which Assets-tab
 * folder a new generation/animation is filed under.
 */
export type AssetType = 'character' | 'object' | 'weapon' | 'costume' | 'effect'

/** How the user wants to produce the asset selected in step 1 of the Create tab. */
export type CreateMethod = 'draw' | 'generate' | 'import'

/**
 * Create tab > Generate, "Quality" selector (Sprite Studio v2). Flat USD price
 * per tier, measured live with `check_cost` — generation size does NOT change
 * the price (see `QUALITY_TIER_COST_USD` in constants). Drives both the
 * Retro Diffusion `prompt_style` (`ASSET_TYPE_STYLE_BY_QUALITY`) and the
 * output-size ceiling (`rd_pro__*` styles only accept up to 256px).
 */
export type QualityTier = 'draft' | 'standard' | 'best'

/** One tile of the Quality selector — presentational data only. */
export interface QualityTierConfig {
  readonly id: QualityTier
  readonly label: string
  /** e.g. "Retro Diffusion Fast" — shown in the compare modal, not on the tile itself. */
  readonly styleLabel: string
  readonly priceUsd: number
  readonly sampleSrc: string
}

/**
 * Which tier gets the Quality selector's "Recommended" tag for a given asset
 * type, and why. `verified: false` means the `reason` has NOT been backed by
 * a live Retro Diffusion generation for that specific asset type — it borrows
 * the closest verified reasoning. Do not strengthen a `reason`'s wording (e.g.
 * naming a resolution or describing the output) until a live test for that
 * asset type backs it, same caveat as `ASSET_TYPE_STYLE`'s own comment.
 */
export interface QualityRecommendation {
  readonly tier: QualityTier
  readonly reason: string
  readonly verified: boolean
}

/**
 * A single motion choice offered by the Animate tab for a given asset type
 * (Sprite Studio v2). The same shape covers both character motions (Idle,
 * Walk, Run…) and non-character motions (Breathe, Spin…) — the UI and the
 * generation hook never branch on asset type directly, only on this table
 * (see `ANIMATE_MOTIONS_BY_ASSET_TYPE` in `constants/index.ts`).
 */
export interface AnimateMotionOption {
  readonly id: string
  readonly label: string
  readonly rdAction: RetroDiffusionAnimationAction
  /**
   * Fixed motion text substituted into the prompt for options that are not
   * user-authored (e.g. Squash & stretch, Spin, Breathe). Omitted for options
   * whose own `label` already reads naturally as the motion word (Idle, Walk…).
   */
  readonly fixedMotionText?: string
  /** True only for "Custom" — renders a free-text textarea instead of firing immediately. */
  readonly isCustomInput?: boolean
}

/**
 * Normalized view-model row for the bottom panel's Assets tab — a single
 * shape covering both `AIGeneration` (still sprites) and `AIAnimation`
 * (multi-frame) history entries, so the grid/folder tree don't need to
 * branch on which kind of asset they're rendering.
 */
export interface AssetLibraryItem {
  readonly id: string
  readonly kind: 'generation' | 'animation'
  readonly label: string
  readonly thumbnailSrc: string
  /** Back-compat default applied here (not in storage) — untyped history counts as `'character'`. */
  readonly assetType: AssetType
  readonly isAnimated: boolean
  readonly canDownloadSheet: boolean
}

/** Game genres whose sprite rules the Create tab can add to a prompt. */
export type GameTemplateId = 'platformer'

/**
 * A game template: hidden rules appended to the user's prompt so the result is
 * a usable game sprite (full body, side view) instead of a portrait. Rules are
 * per asset type; an asset type without rules gets the prompt unchanged.
 */
export interface GameTemplate {
  readonly id: GameTemplateId
  readonly label: string
  /** One-line summary shown under the chip while the template is on. */
  readonly summary: string
  readonly rules: Readonly<Partial<Record<AssetType, string>>>
}

export interface AssetLibrarySnapshot {
  readonly generations: AIGeneration[]
  readonly animations: AIAnimation[]
}

/** Where the Assets library lives between sessions (IndexedDB in the browser, in-memory in tests). */
export interface AssetLibraryRepository {
  loadAll(): Promise<AssetLibrarySnapshot>
  putGenerations(generations: readonly AIGeneration[]): Promise<void>
  putAnimations(animations: readonly AIAnimation[]): Promise<void>
  removeGenerations(ids: readonly string[]): Promise<void>
  removeAnimations(ids: readonly string[]): Promise<void>
  clear(): Promise<void>
}

/** Create > Generate result card. */
export interface GenerateResult {
  readonly base64: string
  readonly width: number
  readonly prompt: string
  readonly autoApplied: boolean
}

/** Animate tab result card. */
export interface AnimateResult {
  readonly frames: readonly string[]
  readonly frameDurationMs: number
  readonly label: string
  readonly autoApplied: boolean
}

/**
 * An in-flight or finished AI request's UI state. Lives in a store, not in
 * the tab's `useState`, so switching tabs or routes mid-request doesn't lose
 * the spinner, the result card or the error.
 */
export interface AIJob<TResult> {
  readonly isRunning: boolean
  readonly error: string | null
  readonly result: TResult | null
}

/** Create tab > Generate "Recent" strip entry — one `AIGeneration` from the Assets library. */
export interface RecentGenerationItem {
  readonly id: string
  readonly title: string
  readonly thumbnailSrc: string
  readonly base64: string
  readonly width: number
}

/** Animate tab "Recent" strip entry — one `AIAnimation` from the Assets library. */
export interface RecentAnimationItem {
  readonly id: string
  readonly title: string
  readonly thumbnailSrc: string
  readonly frames: readonly string[]
  readonly frameDurationMs: number
}

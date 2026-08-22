export interface QuantizeOptions {
  readonly colors: number
  readonly weightBySaturation: boolean
  readonly iterations: number
  readonly alphaThreshold: number // 0..255; below this a pixel stays transparent
}

/**
 * Single-sprite styles. `rd_fast` measured ~37% cheaper than `rd_plus` at the
 * same resolution (see RETRO_DIFFUSION_COST_TABLE in constants).
 */
export type RetroDiffusionSpriteStyle = 'rd_fast__default' | 'rd_plus__default'

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
}

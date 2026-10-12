import type { AIJob, AnimateResult, AssetType } from './ai-generation'

/**
 * One motion of the animation harness (ADR 0009). The harness is DATA: the
 * product (Animate tab) and the offline eval script
 * (`scripts/pixellab-animate-harness.ts`) read the same entries, so what is
 * tested is what ships.
 */
export interface AnimationMotionPreset {
  readonly id: string
  readonly label: string
  /** Explicit motion text sent AFTER the asset type's identity rules. Empty for the custom-input preset. */
  readonly motion: string
  /** Even, 4..16 (PixelLab `animate-with-text-v3` limits). */
  readonly defaultFrames: number
  /** PixelLab `enhance_prompt`. Measured 2026-10-12: drifts a walk to side profile, so off unless a motion proves otherwise. */
  readonly enhancePrompt?: boolean
  /** PixelLab `drift_threshold`. Omitted = provider default. */
  readonly driftThreshold?: number
  /** True only for "Custom" — the user writes the motion text; identity rules are still prepended. */
  readonly isCustomInput?: boolean
}

/** Per asset type: the identity rules that keep the subject stable, and the motions offered for it. */
export interface AnimationHarnessEntry {
  readonly identityRules: string
  readonly defaultMotionId: string
  readonly motions: readonly AnimationMotionPreset[]
}

export type AnimationHarness = Readonly<Record<AssetType, AnimationHarnessEntry>>

// ── AnimationProvider port (ADR 0009) ───────────────────────────────────────

/** What the Animate tab asks a provider for. Vendor-neutral on purpose. */
export interface AnimationRequest {
  /** PNG of the first frame, data URI or bare base64, at the size the output must keep. */
  readonly firstFrameBase64: string
  /** Fully built action text (see `buildAnimationAction`). */
  readonly action: string
  readonly frameCount: number
  readonly enhancePrompt?: boolean
  readonly driftThreshold?: number
  readonly seed?: number
}

export interface AnimationSubmitResult {
  readonly jobId: string
}

export type AnimationJobState = 'queued' | 'processing' | 'completed' | 'failed'

/**
 * Known reasons `animError` can mean "another job is already running" rather
 * than a real failure: the client-side one-job-at-a-time guard, or the
 * server's 429 `code: 'BUSY'` mapping (see `apps/editor/api/ai/pixellab/animate.ts`).
 * The Animate tab derives `isBusyError` from this, never from comparing
 * `animError`'s message text.
 */
export type AnimationErrorCode = 'ALREADY_RUNNING' | 'BUSY'

/** A job state that is not terminal — the provider is still working on it. */
export type AnimationActiveJobState = Extract<AnimationJobState, 'queued' | 'processing'>

/**
 * Why the client stopped polling a job it still holds: the poll window ran out
 * (`timeout`) or too many status reads failed in a row (`network`). The job is
 * KEPT either way — it may still finish, and it is billed.
 */
export type AnimationStallReason = 'timeout' | 'network'

/** PixelLab's own view of a running job, from the last successful poll. */
export interface AnimationJobProgress {
  readonly state: AnimationActiveJobState
  /** Position in PixelLab's queue, when reported. */
  readonly queuePosition: number | null
  /** PixelLab's own estimate of the remaining wait, when reported. */
  readonly estimatedWaitSeconds: number | null
}

/** `AIJob<AnimateResult>` plus the typed `AnimationErrorCode` above. */
export interface AnimateJob extends AIJob<AnimateResult> {
  readonly errorCode: AnimationErrorCode | null
  /** Non-null while polling is paused on a job that is still kept in `animatePending`. */
  readonly stall: AnimationStallReason | null
  /** Last reported progress of the polled job, or null before the first poll / when idle. */
  readonly progress: AnimationJobProgress | null
}

export interface AnimationJobStatus {
  readonly status: AnimationJobState
  /** PNG data URIs, only when `status === 'completed'`. Never includes the input frame. */
  readonly frames: readonly string[]
  readonly error: string | null
  readonly costUsd: number | null
  /** Queue position while the job waits, when the provider reports it. */
  readonly queuePosition?: number
  /** Provider's estimate of the remaining wait, when reported. */
  readonly estimatedWaitSeconds?: number
}

/**
 * How one polling run of a pending job ended. `stalled` and `abandoned` never
 * mean the job is gone upstream: `stalled` keeps it for "Check again",
 * `abandoned` means the user discarded it while the loop was sleeping.
 */
export type AnimationPollOutcome =
  | { readonly kind: 'completed'; readonly frames: readonly string[] }
  | { readonly kind: 'failed'; readonly error: string | null }
  | { readonly kind: 'stalled'; readonly reason: AnimationStallReason }
  | { readonly kind: 'abandoned' }

/**
 * Port: the Animate tab depends on this, never on a vendor. Slow providers
 * answer with a job id and are polled — no HTTP request waits minutes.
 */
export interface AnimationProvider {
  submit: (request: AnimationRequest) => Promise<AnimationSubmitResult>
  poll: (jobId: string) => Promise<AnimationJobStatus>
}

/** BYOK: the end user's own key. Absent = the server falls back to its env key. */
export interface AnimationProviderCredentials {
  readonly apiKey?: string
}

/**
 * Body of `POST /api/ai/pixellab/animate`. The server reads the real frame
 * size off the PNG header, so width/height are never trusted from the client.
 */
export interface PixelLabAnimateRequestBody extends AnimationRequest {
  readonly apiKey?: string
}

// ── PixelLab wire format (server side only) ─────────────────────────────────

export interface PixelLabBase64Image {
  readonly type?: string
  readonly base64: string
  readonly format?: string
}

/** `GET /v2/background-jobs/{id}` — only the fields we consume. */
export interface PixelLabBackgroundJob {
  readonly id?: string
  readonly status?: string
  readonly last_response?: {
    readonly images?: readonly (PixelLabBase64Image | string)[]
    readonly detail?: unknown
    /** Measured 2026-10-12: present while the job runs. */
    readonly queue_position?: number
    readonly estimated_wait_seconds?: number
  } | null
  readonly usage?: { readonly type?: string; readonly usd?: number } | null
}

/**
 * Animate tab job that outlives the tab AND a page reload (sessionStorage):
 * a PixelLab job keeps running — and is billed — after the browser forgets it,
 * so the hook resumes polling instead of throwing a paid result away.
 */
export interface PendingAnimationJob {
  readonly jobId: string
  /** `Date.now()` at submit — drives the elapsed time. The poll window restarts on every resume, not from here. */
  readonly startedAt: number
  readonly label: string
  readonly assetType: AssetType
}

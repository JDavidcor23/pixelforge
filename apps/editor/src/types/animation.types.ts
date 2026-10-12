import type { AIJob, AnimateResult, AssetType } from './ai-generation'
import type { AnimationJobMeta } from './ai-jobs.types'

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
  /**
   * Sends the first frame as PixelLab `last_frame` too, so the loop closes on
   * the reference. Measured 2026-10-12: keeps an idle on-model over 12 frames,
   * but leaves a walk almost static — enable it only for in-place motions.
   */
  readonly loopToFirstFrame?: boolean
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
  /** Close the loop on the first frame (PixelLab `last_frame`). See `AnimationMotionPreset.loopToFirstFrame`. */
  readonly loopToFirstFrame?: boolean
  readonly seed?: number
  /** Name + folder of the asset, so a server-tracked job can be saved without the browser. */
  readonly job?: AnimationJobMeta
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
  /**
   * The signed-in user's session token, or null when signed out. Sent with a
   * submit that uses the server key (never with BYOK) so the server records
   * the job in `public.ai_jobs` and collects it even if the tab closes.
   */
  readonly getAccessToken?: () => Promise<string | null>
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

// ── Animation job ledger (durable, survives tab close) ──────────────────────

/**
 * Lifecycle of a submitted animation job in the ledger. Entries are never
 * deleted while unfinished: PixelLab has no "list my jobs" endpoint, so the
 * ledger is the only place a paid job id lives once the tab closes.
 * - `pending`   — submitted, no terminal answer collected yet
 * - `completed` — the normal polling loop saved its frames to Assets
 * - `recovered` — a later Recover (manual or on app load) saved its frames
 * - `failed`    — PixelLab reported the job as failed
 * - `discarded` — the user stopped tracking it; still recoverable
 */
export type AnimationJobLedgerStatus = 'pending' | 'completed' | 'failed' | 'recovered' | 'discarded'

export interface AnimationJobLedgerEntry {
  readonly jobId: string
  /** `Date.now()` right after `provider.submit` returned. */
  readonly submittedAt: number
  readonly label: string
  readonly assetType: AssetType
  /** Null for jobs migrated from the pre-ledger sessionStorage pending job. */
  readonly frameCount: number | null
  readonly canvasSize: { readonly width: number; readonly height: number } | null
  readonly status: AnimationJobLedgerStatus
  /** Assets library id of the saved animation, once completed/recovered. */
  readonly animationId: string | null
  /** Upstream failure reason (`failed`). */
  readonly error: string | null
  /** PixelLab's state at the last Recover check that found the job still running. */
  readonly lastState: AnimationActiveJobState | null
  /** `Date.now()` of the last Recover check, or null if never checked. */
  readonly lastCheckedAt: number | null
  /** True when the last Recover check could not reach PixelLab. */
  readonly lastCheckUnreachable: boolean
}

/** One row of the Animate tab's "Unfinished jobs" list, ready to render. */
export interface UnfinishedAnimationJobItem {
  readonly jobId: string
  readonly label: string
  /** Localized submit time. */
  readonly submittedLabel: string
  readonly isDiscarded: boolean
  /** Result of the last Recover check (still queued/processing, unreachable), or null. */
  readonly stateMessage: string | null
  readonly isRecovering: boolean
  /** True once a Recover could not reach the job — the user may then forget it. */
  readonly canRemove: boolean
}

/** Feedback of the last manual Recover that settled a job (the row itself leaves the list). */
export interface AnimationRecoverNotice {
  readonly tone: 'success' | 'failed'
  readonly message: string
}

/** What one Recover attempt of a ledger entry found. */
export type AnimationRecoverOutcome =
  | { readonly kind: 'recovered'; readonly animationId: string }
  | { readonly kind: 'running'; readonly state: AnimationActiveJobState }
  | { readonly kind: 'failed'; readonly error: string }
  | { readonly kind: 'unreachable' }
  /** Already settled, or another check of the same job is in flight. */
  | { readonly kind: 'skipped' }

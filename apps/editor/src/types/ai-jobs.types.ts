import type { AssetType } from './ai-generation'

/*
 * Server-owned AI jobs (ADR 0009 follow-up, `public.ai_jobs`). The submit
 * function records each server-billed PixelLab job; the `collect-ai-jobs` Edge
 * Function turns finished ones into `public.assets` rows + frames in Storage.
 * The editor only READS the result and copies it into the local Assets library.
 */

/** What the Animate tab tells the submit function about a job, so the server can name the asset. */
export interface AnimationJobMeta {
  readonly label: string
  readonly assetType: AssetType
}

/** Row the submit function inserts into `public.ai_jobs` (snake_case = column names). */
export interface AiJobInsertRow {
  readonly provider: 'pixellab'
  readonly provider_job_id: string
  readonly kind: 'animation'
  readonly label: string | null
  readonly asset_type: string | null
  readonly frame_count: number
  readonly width: number
  readonly height: number
  readonly params: Readonly<Record<string, unknown>>
}

/** A completed server job joined with its asset, as the client sync consumes it. */
export interface ServerAnimationJob {
  readonly providerJobId: string
  readonly assetId: string
  readonly label: string
  readonly assetType: AssetType
  /** Storage folder prefix holding `000.png`, `001.png`, … */
  readonly filePath: string
  readonly frameCount: number
  readonly frameDurationMs: number
  /** `Date.parse` of the asset's `created_at`. */
  readonly createdAt: number
}

/** What a sync pass decided for one server job. */
export type ServerAnimationSyncDecision =
  | { readonly kind: 'import'; readonly job: ServerAnimationJob }
  /** Already in the local library (or saved by the browser's own polling loop): just remember it. */
  | { readonly kind: 'skip'; readonly job: ServerAnimationJob }

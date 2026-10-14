import {
  AI_JOB_ASSET_TYPE_MAX_LENGTH,
  AI_JOB_KIND_ANIMATION,
  AI_JOB_LABEL_MAX_LENGTH,
  AI_JOB_PROVIDER_PIXELLAB,
} from '../constants/ai-jobs'
import type { AiJobInsertRow, AnimationJobMeta } from '../types'

/*
 * Pure helpers for the submit function (`api/ai/pixellab/animate.ts`) to
 * record a server-billed job in `public.ai_jobs`. Relative imports only (no
 * `@/` alias on the server).
 */

const BEARER_PREFIX = /^Bearer\s+/i

/** The token of an `Authorization: Bearer <token>` header, or null. */
export const readBearerToken = (header: string | null): string | null => {
  if (!header || !BEARER_PREFIX.test(header)) return null
  const token = header.replace(BEARER_PREFIX, '').trim()
  return token.length > 0 ? token : null
}

/**
 * The session token to record the job with, or null to skip recording. The
 * server records a job only when it pays for it (its env key, not BYOK) AND
 * knows who it belongs to (a session token). A BYOK job is billed to a
 * PixelLab account the collector cannot read.
 */
export const serverJobOwnerToken = (authorizationHeader: string | null, usedClientApiKey: boolean): string | null =>
  usedClientApiKey ? null : readBearerToken(authorizationHeader)

const clip = (value: string | undefined, max: number): string | null => {
  const trimmed = value?.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

export interface AiJobRecordInput {
  readonly jobId: string
  readonly job: AnimationJobMeta | undefined
  readonly frameCount: number
  readonly width: number
  readonly height: number
  readonly params: Readonly<Record<string, unknown>>
}

/** `ai_jobs` row for a submitted animation. `owner_id` comes from the JWT (column default `auth.uid()`). */
export const buildAiJobInsertRow = ({ jobId, job, frameCount, width, height, params }: AiJobRecordInput): AiJobInsertRow => ({
  provider: AI_JOB_PROVIDER_PIXELLAB,
  provider_job_id: jobId,
  kind: AI_JOB_KIND_ANIMATION,
  label: clip(job?.label, AI_JOB_LABEL_MAX_LENGTH),
  asset_type: clip(job?.assetType, AI_JOB_ASSET_TYPE_MAX_LENGTH),
  frame_count: frameCount,
  width,
  height,
  params,
})

import { supabase } from '@/lib/supabase'
import { pngBytesToDataUri, serverFramePath, toAssetType } from '@/lib/server-animation-sync'
import { SPRITE_ANIMATION } from '@/constants'
import {
  AI_JOB_KIND_ANIMATION,
  AI_JOB_STATUS_COMPLETED,
  AI_JOBS_STORAGE_BUCKET,
  AI_JOBS_TABLE,
  SERVER_ANIMATION_SYNC_LIMIT,
} from '@/constants/ai-jobs'
import type { ServerAnimationJob } from '@/types'

/*
 * Supabase adapter for server-collected animation jobs (ADR 0009 follow-up).
 * Reads `public.ai_jobs` joined with `public.assets` (RLS: own rows only) and
 * the frames the `collect-ai-jobs` Edge Function wrote to Storage. Read-only:
 * only the Edge Function (service role) ever writes a completed job.
 */

/** Row shapes of the embedded select — the client has no generated `Database` types. */
interface AssetRow {
  readonly id: string
  readonly name: string
  readonly frame_count: number | null
  readonly frame_ms: readonly number[] | null
  readonly file_path: string
  readonly created_at: string
}

interface CompletedAiJobRow {
  readonly provider_job_id: string
  readonly label: string | null
  readonly asset_type: string | null
  readonly assets: AssetRow | null
}

const toServerAnimationJob = (row: CompletedAiJobRow): ServerAnimationJob | null => {
  const asset = row.assets
  if (!asset || !asset.frame_count) return null
  return {
    providerJobId: row.provider_job_id,
    assetId: asset.id,
    label: row.label ?? asset.name,
    assetType: toAssetType(row.asset_type),
    filePath: asset.file_path,
    frameCount: asset.frame_count,
    frameDurationMs: asset.frame_ms?.[0] ?? SPRITE_ANIMATION.DEFAULT_FRAME_DURATION_MS,
    createdAt: Date.parse(asset.created_at),
  }
}

/** The signed-in user's most recent completed animation jobs that have an asset. */
async function listCompletedAnimationJobs(): Promise<ServerAnimationJob[]> {
  const { data, error } = await supabase
    .from(AI_JOBS_TABLE)
    .select('provider_job_id, label, asset_type, assets(id, name, frame_count, frame_ms, file_path, created_at)')
    .eq('status', AI_JOB_STATUS_COMPLETED)
    .eq('kind', AI_JOB_KIND_ANIMATION)
    .not('asset_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(SERVER_ANIMATION_SYNC_LIMIT)
  if (error) throw error
  const rows = (data ?? []) as unknown as CompletedAiJobRow[]
  return rows.map(toServerAnimationJob).filter((job): job is ServerAnimationJob => job !== null)
}

/** Every frame of one job as a PNG data URI, in order. Throws if any frame is missing. */
async function downloadAnimationFrames(job: ServerAnimationJob): Promise<string[]> {
  const frames: string[] = []
  for (let index = 0; index < job.frameCount; index += 1) {
    const { data, error } = await supabase.storage
      .from(AI_JOBS_STORAGE_BUCKET)
      .download(serverFramePath(job.filePath, index))
    if (error) throw error
    frames.push(pngBytesToDataUri(new Uint8Array(await data.arrayBuffer())))
  }
  return frames
}

export const serverAnimationJobsService = {
  listCompletedAnimationJobs,
  downloadAnimationFrames,
}

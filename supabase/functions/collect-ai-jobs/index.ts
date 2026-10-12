// Server-side collector for paid PixelLab jobs (ADR 0009 follow-up).
// PixelLab has no webhooks and no "list my jobs": a job is only collectable by id. The
// submit function stores that id in `public.ai_jobs`; pg_cron calls this function every
// minute (see `supabase/migrations/20261012030000_ai_jobs.sql`), so a finished job reaches
// the owner's account even when every browser tab is closed.
//
// Storage layout (chosen so the editor needs no PNG decoder or sheet slicer):
//   pixelforge/<owner_id>/animations/<asset_id>/<index>.png   (one PNG per generated frame)
// `assets.file_path` is the folder prefix `<owner_id>/animations/<asset_id>/` and
// `assets.frame_count` says how many `<index>.png` files it holds (0-based, zero-padded to 3).
//
// Idempotent by construction: the asset row REUSES the ai_jobs row id (`assets.id = ai_jobs.id`),
// frames are uploaded with `upsert`, and the asset insert ignores a duplicate key. Two overlapping
// runs can both collect the same job and still leave exactly one asset.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const STORAGE_BUCKET = 'pixelforge'
const PIXELLAB_JOB_URL = 'https://api.pixellab.ai/v2/background-jobs'
const COLLECTOR_SECRET_HEADER = 'x-collector-secret'
const BATCH_SIZE = 10
const PIXELLAB_TIMEOUT_MS = 20_000
/** A job still not finished after this long is given up on (PixelLab measured 110–160 s per job). */
const EXPIRE_AFTER_MS = 24 * 60 * 60 * 1000
const EXPIRED_ERROR = 'expired'
const NOT_FOUND_ERROR = 'PixelLab no longer recognizes this job'
const NO_FRAMES_ERROR = 'PixelLab returned no frames'
const FAILED_ERROR = 'PixelLab reported the job as failed'
/** `images[0]` of a finished job is the INPUT frame, never shown to the user. */
const INPUT_FRAME_INDEX = 0
/** Same default the editor uses for a new animation (`SPRITE_ANIMATION.DEFAULT_FRAME_DURATION_MS`). */
const DEFAULT_FRAME_MS = 120
const ASSET_NAME_MAX = 120
const FALLBACK_ASSET_NAME = 'Animation'
const FRAME_INDEX_PAD = 3
const HTTP_NOT_FOUND = 404

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const PNG_WIDTH_OFFSET = 16
const PNG_HEIGHT_OFFSET = 20
const DATA_URI_PREFIX = /^data:image\/[a-z]+;base64,/i

type Admin = ReturnType<typeof createClient>

interface AiJobRow {
  readonly id: string
  readonly owner_id: string
  readonly provider_job_id: string
  readonly label: string | null
  readonly asset_type: string | null
  readonly frame_count: number | null
  readonly width: number | null
  readonly height: number | null
  readonly params: Record<string, unknown> | null
  readonly attempts: number
  readonly created_at: string
}

type PixelLabImage = string | { readonly base64: string; readonly format?: string }

interface PixelLabJob {
  readonly status?: string
  readonly last_response?: { readonly images?: readonly PixelLabImage[]; readonly detail?: unknown } | null
  readonly usage?: { readonly usd?: number } | null
}

type Outcome = 'completed' | 'failed' | 'pending' | 'error'

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** Constant-time compare, so the secret can't be guessed byte by byte from response timing. */
const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

const describeDetail = (detail: unknown): string | null =>
  detail === undefined || detail === null ? null : typeof detail === 'string' ? detail : JSON.stringify(detail)

const decodeBase64 = (image: PixelLabImage): Uint8Array => {
  const raw = (typeof image === 'string' ? image : image.base64).replace(DATA_URI_PREFIX, '')
  const binary = atob(raw)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

const readUint32 = (bytes: Uint8Array, offset: number): number =>
  ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0

const readPngSize = (bytes: Uint8Array): { width: number; height: number } | null => {
  if (bytes.length < PNG_HEIGHT_OFFSET + 4 || !PNG_SIGNATURE.every((byte, i) => bytes[i] === byte)) return null
  return { width: readUint32(bytes, PNG_WIDTH_OFFSET), height: readUint32(bytes, PNG_HEIGHT_OFFSET) }
}

const frameFileName = (index: number): string => `${String(index).padStart(FRAME_INDEX_PAD, '0')}.png`

const assetName = (label: string | null): string =>
  (label?.trim() || FALLBACK_ASSET_NAME).slice(0, ASSET_NAME_MAX)

async function fetchPixelLabJob(jobId: string, apiKey: string): Promise<{ status: number; job: PixelLabJob | null }> {
  const res = await fetch(`${PIXELLAB_JOB_URL}/${encodeURIComponent(jobId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(PIXELLAB_TIMEOUT_MS),
  })
  const job = (await res.json().catch(() => null)) as PixelLabJob | null
  return { status: res.status, job }
}

async function markFailed(admin: Admin, row: AiJobRow, error: string): Promise<Outcome> {
  const { error: updateError } = await admin
    .from('ai_jobs')
    .update({ status: 'failed', error, attempts: row.attempts + 1, last_checked_at: new Date().toISOString() })
    .eq('id', row.id)
    .eq('status', 'pending')
  if (updateError) throw updateError
  return 'failed'
}

async function markStillPending(admin: Admin, row: AiJobRow): Promise<Outcome> {
  if (Date.now() - Date.parse(row.created_at) > EXPIRE_AFTER_MS) return markFailed(admin, row, EXPIRED_ERROR)
  const { error } = await admin
    .from('ai_jobs')
    .update({ attempts: row.attempts + 1, last_checked_at: new Date().toISOString() })
    .eq('id', row.id)
    .eq('status', 'pending')
  if (error) throw error
  return 'pending'
}

async function storeCompletedJob(admin: Admin, row: AiJobRow, job: PixelLabJob): Promise<Outcome> {
  const frames = (job.last_response?.images ?? [])
    .filter((_, index) => index !== INPUT_FRAME_INDEX)
    .map(decodeBase64)
  if (frames.length === 0) return markFailed(admin, row, describeDetail(job.last_response?.detail) ?? NO_FRAMES_ERROR)

  const assetId = row.id
  const folder = `${row.owner_id}/animations/${assetId}/`
  for (const [index, bytes] of frames.entries()) {
    const { error } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(`${folder}${frameFileName(index)}`, bytes, { contentType: 'image/png', upsert: true })
    if (error) throw error
  }

  const size = readPngSize(frames[0])
  const { error: assetError } = await admin.from('assets').upsert(
    {
      id: assetId,
      owner_id: row.owner_id,
      kind: 'animation',
      source: 'pixellab',
      name: assetName(row.label),
      width: size?.width ?? row.width,
      height: size?.height ?? row.height,
      frame_count: frames.length,
      frame_ms: frames.map(() => DEFAULT_FRAME_MS),
      file_path: folder,
      cost_usd: job.usage?.usd ?? null,
      params: { ...(row.params ?? {}), provider_job_id: row.provider_job_id, asset_type: row.asset_type },
    },
    { onConflict: 'id', ignoreDuplicates: true },
  )
  if (assetError) throw assetError

  const { error: jobError } = await admin
    .from('ai_jobs')
    .update({
      status: 'completed',
      asset_id: assetId,
      error: null,
      attempts: row.attempts + 1,
      last_checked_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .eq('status', 'pending')
  if (jobError) throw jobError
  return 'completed'
}

async function collectOne(admin: Admin, row: AiJobRow, apiKey: string): Promise<Outcome> {
  let result: { status: number; job: PixelLabJob | null }
  try {
    result = await fetchPixelLabJob(row.provider_job_id, apiKey)
  } catch {
    // PixelLab unreachable: keep the (paid) job pending and try next minute.
    return markStillPending(admin, row)
  }

  if (result.status === HTTP_NOT_FOUND) return markFailed(admin, row, NOT_FOUND_ERROR)
  if (!result.job || result.status >= 400) return markStillPending(admin, row)

  if (result.job.status === 'completed') return storeCompletedJob(admin, row, result.job)
  if (result.job.status === 'failed') {
    return markFailed(admin, row, describeDetail(result.job.last_response?.detail) ?? FAILED_ERROR)
  }
  return markStillPending(admin, row)
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { ok: false, error: 'Use POST' })

  const expectedSecret = Deno.env.get('COLLECT_AI_JOBS_SECRET')
  const apiKey = Deno.env.get('PIXELLAB_API_KEY')
  if (!expectedSecret || !apiKey) return json(500, { ok: false, error: 'Collector is not configured' })

  const providedSecret = req.headers.get(COLLECTOR_SECRET_HEADER) ?? ''
  if (!safeEqual(providedSecret, expectedSecret)) return json(401, { ok: false, error: 'Unauthorized' })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await admin
    .from('ai_jobs')
    .select('id, owner_id, provider_job_id, label, asset_type, frame_count, width, height, params, attempts, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)
  if (error) {
    console.error('collect-ai-jobs select failed', error.message)
    return json(500, { ok: false, error: 'Could not read pending jobs' })
  }

  const counts: Record<Outcome, number> = { completed: 0, failed: 0, pending: 0, error: 0 }
  // Sequential on purpose: the PixelLab free tier allows one request at a time.
  for (const row of (data ?? []) as AiJobRow[]) {
    try {
      counts[await collectOne(admin, row, apiKey)] += 1
    } catch (e) {
      counts.error += 1
      console.error('collect-ai-jobs job failed', row.id, e instanceof Error ? e.message : String(e))
    }
  }

  return json(200, { ok: true, data: counts })
})

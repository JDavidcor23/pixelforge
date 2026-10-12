import { createClient } from '@supabase/supabase-js'

import {
  AI_JOB_RECORD_TIMEOUT_MS,
  AI_JOBS_TABLE,
  CLIENT_SUPABASE_ANON_KEY_ENV,
  CLIENT_SUPABASE_URL_ENV,
  SERVER_SUPABASE_ANON_KEY_ENV,
  SERVER_SUPABASE_URL_ENV,
} from '../../../src/constants/ai-jobs'
import {
  PIXELLAB_ANIMATE_PATH,
  PIXELLAB_API_BASE,
  PIXELLAB_BUSY_ERROR,
  PIXELLAB_INVALID_PNG_ERROR,
  PIXELLAB_MISSING_KEY_ERROR,
  PIXELLAB_REQUEST_TIMEOUT_MS,
} from '../../../src/constants/animation'
import { getAnimationFrameCountError, getAnimationSizeError } from '../../../src/lib/animation-limits'
import { buildAiJobInsertRow, serverJobOwnerToken } from '../../../src/lib/ai-job-record'
import type { AiJobRecordInput } from '../../../src/lib/ai-job-record'
import { readPngSize, stripDataUri } from '../../../src/lib/pixellab-job'
import type { PixelLabAnimateRequestBody } from '../../../src/types'

const HTTP_TOO_MANY_REQUESTS = 429

/** Shape of the upstream submit response we actually consume. */
interface PixelLabSubmitResponse {
  readonly background_job_id?: string
  readonly detail?: unknown
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const describeDetail = (detail: unknown): string | null =>
  detail === undefined || detail === null ? null : typeof detail === 'string' ? detail : JSON.stringify(detail)

const readEnv = (serverName: string, clientName: string): string | undefined =>
  process.env[serverName] || process.env[clientName] || undefined

/**
 * Writes the job to `public.ai_jobs` AS THE USER (anon key + their JWT, so
 * RLS applies — no service role key ever lives in Vercel). The
 * `collect-ai-jobs` Edge Function then collects it even if every tab closes.
 * Never throws: the job is already paid, so its id must reach the browser
 * (whose own ledger is the fallback) whatever happens here.
 */
async function recordServerJob(accessToken: string, input: AiJobRecordInput): Promise<void> {
  const url = readEnv(SERVER_SUPABASE_URL_ENV, CLIENT_SUPABASE_URL_ENV)
  const anonKey = readEnv(SERVER_SUPABASE_ANON_KEY_ENV, CLIENT_SUPABASE_ANON_KEY_ENV)
  if (!url || !anonKey) {
    console.error('pixellab animate: Supabase env missing, job not recorded server-side:', input.jobId)
    return
  }
  try {
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
        fetch: (resource, init) => fetch(resource, { ...init, signal: AbortSignal.timeout(AI_JOB_RECORD_TIMEOUT_MS) }),
      },
    })
    const { error } = await supabase.from(AI_JOBS_TABLE).insert(buildAiJobInsertRow(input))
    if (error) console.error('pixellab animate: ai_jobs insert failed:', input.jobId, error.message)
  } catch (error) {
    console.error('pixellab animate: ai_jobs insert failed:', input.jobId, error instanceof Error ? error.message : error)
  }
}

/**
 * Vercel Function — submits a PixelLab `animate-with-text-v3` job and returns
 * its id right away (ADR 0009: generation takes 110–160 s, so no function
 * waits for it; `api/ai/pixellab/job` reads the status). The PixelLab key is a
 * server-side env var (`PIXELLAB_API_KEY`, never `VITE_*`); BYOK `apiKey` from
 * the client wins when present.
 *
 * Signed-in + server key: the job is ALSO written to `public.ai_jobs` before
 * the id is returned, so the server collects it even if the browser closes.
 *
 * `last_frame` is sent only when the motion opts in (`loopToFirstFrame`):
 * measured 2026-10-12, it keeps an idle on-model but leaves a walk almost static.
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const {
      firstFrameBase64,
      action,
      frameCount,
      enhancePrompt,
      driftThreshold,
      loopToFirstFrame,
      seed,
      apiKey: clientApiKey,
      job,
    } = (await req.json()) as PixelLabAnimateRequestBody

    if (!action || !action.trim()) {
      return json({ error: 'Action is required' }, 400)
    }

    // The real frame size comes off the PNG header, never from client numbers.
    const pngSize = firstFrameBase64 ? readPngSize(firstFrameBase64) : null
    if (!pngSize) {
      return json({ error: PIXELLAB_INVALID_PNG_ERROR }, 400)
    }
    const limitError =
      getAnimationSizeError(pngSize.width, pngSize.height) ??
      getAnimationFrameCountError(pngSize.width, frameCount)
    if (limitError) {
      return json({ error: limitError }, 400)
    }

    const apiKey = clientApiKey || process.env.PIXELLAB_API_KEY
    if (!apiKey) {
      return json({ error: PIXELLAB_MISSING_KEY_ERROR, code: 'MISSING_API_KEY' }, 401)
    }

    const firstFrame = { type: 'base64', base64: stripDataUri(firstFrameBase64), format: 'png' }
    const upstream = await fetch(`${PIXELLAB_API_BASE}${PIXELLAB_ANIMATE_PATH}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_frame: firstFrame,
        ...(loopToFirstFrame ? { last_frame: firstFrame } : {}),
        action: action.trim(),
        frame_count: frameCount,
        // Real alpha back, so the editor never keys out a background.
        no_background: true,
        ...(enhancePrompt !== undefined ? { enhance_prompt: enhancePrompt } : {}),
        ...(driftThreshold !== undefined ? { drift_threshold: driftThreshold } : {}),
        ...(seed !== undefined ? { seed } : {}),
      }),
      signal: AbortSignal.timeout(PIXELLAB_REQUEST_TIMEOUT_MS),
    })

    const data = (await upstream.json().catch(() => null)) as PixelLabSubmitResponse | null

    // Free tier: one concurrent job per account (measured). Not an error the
    // user can fix by retrying right away, so it gets its own code.
    if (upstream.status === HTTP_TOO_MANY_REQUESTS) {
      console.error('pixellab animate busy:', describeDetail(data?.detail))
      return json({ error: PIXELLAB_BUSY_ERROR, code: 'BUSY' }, HTTP_TOO_MANY_REQUESTS)
    }

    if (!upstream.ok || !data?.background_job_id) {
      const message = describeDetail(data?.detail) ?? 'PixelLab request failed'
      console.error('pixellab animate upstream error:', upstream.status, message)
      return json({ error: message }, upstream.ok ? 502 : upstream.status)
    }

    const jobId = data.background_job_id
    const accessToken = serverJobOwnerToken(req.headers.get('Authorization'), Boolean(clientApiKey))
    if (accessToken) {
      await recordServerJob(accessToken, {
        jobId,
        job,
        frameCount,
        width: pngSize.width,
        height: pngSize.height,
        params: {
          action: action.trim(),
          ...(enhancePrompt !== undefined ? { enhance_prompt: enhancePrompt } : {}),
          ...(driftThreshold !== undefined ? { drift_threshold: driftThreshold } : {}),
          ...(loopToFirstFrame ? { loop_to_first_frame: true } : {}),
          ...(seed !== undefined ? { seed } : {}),
        },
      })
    }

    return json({ jobId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('pixellab animate error:', message)
    return json({ error: message }, 500)
  }
}

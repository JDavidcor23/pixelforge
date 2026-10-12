import {
  PIXELLAB_ANIMATE_PATH,
  PIXELLAB_API_BASE,
  PIXELLAB_BUSY_ERROR,
  PIXELLAB_INVALID_PNG_ERROR,
  PIXELLAB_MISSING_KEY_ERROR,
  PIXELLAB_REQUEST_TIMEOUT_MS,
} from '../../../src/constants/animation'
import { getAnimationFrameCountError, getAnimationSizeError } from '../../../src/lib/animation-limits'
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

/**
 * Vercel Function — submits a PixelLab `animate-with-text-v3` job and returns
 * its id right away (ADR 0009: generation takes 110–160 s, so no function
 * waits for it; `api/ai/pixellab/job` reads the status). The PixelLab key is a
 * server-side env var (`PIXELLAB_API_KEY`, never `VITE_*`); BYOK `apiKey` from
 * the client wins when present.
 *
 * `last_frame` is never sent: measured 2026-10-12, forcing the loop back to
 * the first frame left the animation almost static.
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const {
      firstFrameBase64,
      action,
      frameCount,
      enhancePrompt,
      driftThreshold,
      seed,
      apiKey: clientApiKey,
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

    const upstream = await fetch(`${PIXELLAB_API_BASE}${PIXELLAB_ANIMATE_PATH}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_frame: { type: 'base64', base64: stripDataUri(firstFrameBase64), format: 'png' },
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

    return json({ jobId: data.background_job_id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('pixellab animate error:', message)
    return json({ error: message }, 500)
  }
}

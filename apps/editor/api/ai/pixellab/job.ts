import {
  PIXELLAB_API_BASE,
  PIXELLAB_JOB_ID_PARAM,
  PIXELLAB_JOB_ID_PATTERN,
  PIXELLAB_JOB_PATH,
  PIXELLAB_KEY_HEADER,
  PIXELLAB_MISSING_KEY_ERROR,
  PIXELLAB_REQUEST_TIMEOUT_MS,
} from '../../../src/constants/animation'
import { mapPixelLabJob } from '../../../src/lib/pixellab-job'
import type { PixelLabBackgroundJob } from '../../../src/types'

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

/**
 * Vercel Function — reads a PixelLab background job (`GET ?id=<jobId>`) and
 * answers with the port's `AnimationJobStatus`: status, frames as PNG data
 * URIs (input frame already dropped) and error. Mapping happens here so the
 * client never sees PixelLab's wire format and the input frame never travels.
 * BYOK travels in the `x-pixellab-key` header, not the URL.
 */
export async function handler(req: Request): Promise<Response> {
  try {
    const jobId = new URL(req.url).searchParams.get(PIXELLAB_JOB_ID_PARAM) ?? ''
    if (!PIXELLAB_JOB_ID_PATTERN.test(jobId)) {
      return json({ error: 'A valid job id is required' }, 400)
    }

    const apiKey = req.headers.get(PIXELLAB_KEY_HEADER) || process.env.PIXELLAB_API_KEY
    if (!apiKey) {
      return json({ error: PIXELLAB_MISSING_KEY_ERROR, code: 'MISSING_API_KEY' }, 401)
    }

    const upstream = await fetch(`${PIXELLAB_API_BASE}${PIXELLAB_JOB_PATH}/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(PIXELLAB_REQUEST_TIMEOUT_MS),
    })
    const data = (await upstream.json().catch(() => null)) as (PixelLabBackgroundJob & { detail?: unknown }) | null

    if (!upstream.ok || !data) {
      const detail = data?.detail
      const message = typeof detail === 'string' ? detail : 'PixelLab job lookup failed'
      console.error('pixellab job upstream error:', upstream.status, message)
      return json({ error: message }, upstream.ok ? 502 : upstream.status)
    }

    return json(mapPixelLabJob(data))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('pixellab job error:', message)
    return json({ error: message }, 500)
  }
}

/** Vercel only passes a Web `Request` to a `default { fetch }` export; a bare default function gets Node req/res and hangs. */
export default { fetch: handler }

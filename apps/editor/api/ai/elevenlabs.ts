const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'
const TIMEOUT_MS = 60000
const VALID_MODES = ['sfx', 'music', 'tts'] as const

type ElevenLabsMode = (typeof VALID_MODES)[number]

interface RequestBody {
  mode: ElevenLabsMode
  prompt: string
  voiceId?: string
  durationSeconds?: number
}

function isValidMode(mode: unknown): mode is ElevenLabsMode {
  return typeof mode === 'string' && VALID_MODES.includes(mode as ElevenLabsMode)
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

async function proxyToElevenLabs(
  apiKey: string,
  body: RequestBody,
  signal: AbortSignal
): Promise<Response> {
  const headers: Record<string, string> = {
    'xi-api-key': apiKey,
  }

  switch (body.mode) {
    case 'sfx':
    case 'music': {
      headers['Content-Type'] = 'application/json'
      return fetch(`${ELEVENLABS_BASE_URL}/sound-generation`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: body.prompt,
          duration_seconds: body.durationSeconds ?? undefined,
        }),
        signal,
      })
    }
    case 'tts': {
      if (!body.voiceId) {
        throw new Error('voiceId is required for TTS mode')
      }
      headers['Content-Type'] = 'application/json'
      return fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${body.voiceId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: body.prompt,
          model_id: 'eleven_multilingual_v2',
        }),
        signal,
      })
    }
  }
}

/**
 * Vercel Function (Node.js runtime, Web-standard Request/Response — see
 * design.md "Monorepo specifics"). Replaces the former Next.js route handler
 * `src/app/api/ai/elevenlabs/route.ts`. The caller's own ElevenLabs key is
 * forwarded via a request header (BYOK) — PixelForge holds no ElevenLabs key
 * of its own server-side.
 */
export default async function handler(request: Request): Promise<Response> {
  const apiKey = request.headers.get('X-ElevenLabs-Key')

  if (!apiKey) {
    return json({ error: 'Missing API key. Provide X-ElevenLabs-Key header.' }, 401)
  }

  let body: RequestBody

  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const mode = formData.get('mode') as string | null
    const prompt = formData.get('prompt') as string | null

    if (!mode || !prompt) {
      return json({ error: 'Missing required fields: mode, prompt' }, 400)
    }

    if (!isValidMode(mode)) {
      return json({ error: `Invalid mode. Must be one of: ${VALID_MODES.join(', ')}` }, 400)
    }

    body = {
      mode,
      prompt,
      voiceId: (formData.get('voiceId') as string) ?? undefined,
    }
  } else {
    const parsed = await request.json().catch(() => null)

    if (!parsed) {
      return json({ error: 'Invalid JSON body' }, 400)
    }

    if (!isValidMode(parsed.mode)) {
      return json({ error: `Invalid mode. Must be one of: ${VALID_MODES.join(', ')}` }, 400)
    }

    if (!parsed.prompt || typeof parsed.prompt !== 'string' || parsed.prompt.trim().length === 0) {
      return json({ error: 'Prompt is required and must be a non-empty string' }, 400)
    }

    body = {
      mode: parsed.mode,
      prompt: parsed.prompt,
      voiceId: parsed.voiceId,
      durationSeconds: parsed.durationSeconds,
    }
  }

  if (body.mode === 'tts' && !body.voiceId) {
    return json({ error: 'voiceId is required for TTS mode' }, 400)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await proxyToElevenLabs(apiKey, body, controller.signal)

    clearTimeout(timeout)

    if (!response.ok) {
      const status = response.status === 401 ? 401 : 500
      const errorText = await response.text().catch(() => 'Unknown ElevenLabs error')
      return json({ error: errorText }, status)
    }

    const audioBuffer = await response.arrayBuffer()

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.byteLength),
      },
    })
  } catch (error) {
    clearTimeout(timeout)

    if (error instanceof Error && error.name === 'AbortError') {
      return json({ error: 'Request timed out' }, 504)
    }

    return json({ error: 'Internal server error' }, 500)
  }
}

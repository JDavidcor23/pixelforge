import { NextRequest, NextResponse } from 'next/server'

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

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('X-ElevenLabs-Key')

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing API key. Provide X-ElevenLabs-Key header.' },
      { status: 401 }
    )
  }

  let body: RequestBody

  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const mode = formData.get('mode') as string | null
    const prompt = formData.get('prompt') as string | null

    if (!mode || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: mode, prompt' },
        { status: 400 }
      )
    }

    if (!isValidMode(mode)) {
      return NextResponse.json(
        { error: `Invalid mode. Must be one of: ${VALID_MODES.join(', ')}` },
        { status: 400 }
      )
    }

    body = {
      mode,
      prompt,
      voiceId: (formData.get('voiceId') as string) ?? undefined,
    }
  } else {
    const json = await request.json().catch(() => null)

    if (!json) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    if (!isValidMode(json.mode)) {
      return NextResponse.json(
        { error: `Invalid mode. Must be one of: ${VALID_MODES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!json.prompt || typeof json.prompt !== 'string' || json.prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    body = {
      mode: json.mode,
      prompt: json.prompt,
      voiceId: json.voiceId,
      durationSeconds: json.durationSeconds,
    }
  }

  if (body.mode === 'tts' && !body.voiceId) {
    return NextResponse.json(
      { error: 'voiceId is required for TTS mode' },
      { status: 400 }
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await proxyToElevenLabs(apiKey, body, controller.signal)

    clearTimeout(timeout)

    if (!response.ok) {
      const status = response.status === 401 ? 401 : 500
      const errorText = await response.text().catch(() => 'Unknown ElevenLabs error')
      return NextResponse.json(
        { error: errorText },
        { status }
      )
    }

    const audioBuffer = await response.arrayBuffer()

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.byteLength),
      },
    })
  } catch (error) {
    clearTimeout(timeout)

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

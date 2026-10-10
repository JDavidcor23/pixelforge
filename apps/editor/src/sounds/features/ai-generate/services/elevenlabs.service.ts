import type { ElevenLabsMode } from '@/app/editor/types/audio'

const ELEVENLABS_KEY_STORAGE = 'pixelforge-elevenlabs-key'
const API_ENDPOINT = '/api/ai/elevenlabs'

// ── API Key Management ───────────────────────────────────────────────────────

export function getElevenLabsApiKey(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ELEVENLABS_KEY_STORAGE)
}

export function setElevenLabsApiKey(key: string): void {
  localStorage.setItem(ELEVENLABS_KEY_STORAGE, key)
}

export function removeElevenLabsApiKey(): void {
  localStorage.removeItem(ELEVENLABS_KEY_STORAGE)
}

// ── Error Handling ───────────────────────────────────────────────────────────

export class ElevenLabsError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message)
    this.name = 'ElevenLabsError'
  }
}

function getApiKeyOrThrow(): string {
  const key = getElevenLabsApiKey()
  if (!key) {
    throw new ElevenLabsError('ElevenLabs API key not configured', 401)
  }
  return key
}

async function handleResponse(response: Response): Promise<Blob> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Request failed' }))
    const message = (errorBody as { error?: string }).error ?? 'Unknown error'

    throw new ElevenLabsError(message, response.status)
  }

  const blob = await response.blob()
  if (blob.size === 0) {
    throw new ElevenLabsError('Received empty audio response', 500)
  }

  return blob
}

// ── Generation Functions ─────────────────────────────────────────────────────

export async function generateSFX(
  prompt: string,
  signal?: AbortSignal
): Promise<Blob> {
  const key = getApiKeyOrThrow()

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-ElevenLabs-Key': key,
    },
    body: JSON.stringify({
      mode: 'sfx' satisfies ElevenLabsMode,
      prompt,
    }),
    signal,
  })

  return handleResponse(response)
}

export async function generateMusic(
  prompt: string,
  referenceBlob?: Blob,
  signal?: AbortSignal
): Promise<Blob> {
  const key = getApiKeyOrThrow()

  if (referenceBlob) {
    const formData = new FormData()
    formData.append('mode', 'music' satisfies ElevenLabsMode)
    formData.append('prompt', prompt)
    formData.append('reference', referenceBlob, 'reference.mp3')

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'X-ElevenLabs-Key': key,
      },
      body: formData,
      signal,
    })

    return handleResponse(response)
  }

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-ElevenLabs-Key': key,
    },
    body: JSON.stringify({
      mode: 'music' satisfies ElevenLabsMode,
      prompt,
    }),
    signal,
  })

  return handleResponse(response)
}

export async function generateTTS(
  text: string,
  voiceId: string,
  signal?: AbortSignal
): Promise<Blob> {
  const key = getApiKeyOrThrow()

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-ElevenLabs-Key': key,
    },
    body: JSON.stringify({
      mode: 'tts' satisfies ElevenLabsMode,
      prompt: text,
      voiceId,
    }),
    signal,
  })

  return handleResponse(response)
}

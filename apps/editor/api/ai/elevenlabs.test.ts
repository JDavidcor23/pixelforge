import { afterEach, describe, expect, it, vi } from 'vitest'

import { handler } from './elevenlabs'

const jsonRequest = (body: unknown, headers: Record<string, string> = {}): Request =>
  new Request('http://localhost/api/ai/elevenlabs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })

describe('elevenlabs Vercel Function', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects a request with no X-ElevenLabs-Key header', async () => {
    const res = await handler(jsonRequest({ mode: 'sfx', prompt: 'a laser' }))
    expect(res.status).toBe(401)
  })

  it('rejects an invalid mode', async () => {
    const res = await handler(
      jsonRequest({ mode: 'bogus', prompt: 'x' }, { 'X-ElevenLabs-Key': 'k' }),
    )
    expect(res.status).toBe(400)
  })

  it('rejects tts mode with no voiceId', async () => {
    const res = await handler(
      jsonRequest({ mode: 'tts', prompt: 'hello' }, { 'X-ElevenLabs-Key': 'k' }),
    )
    expect(res.status).toBe(400)
  })

  it('proxies a valid sfx request and streams back audio bytes', async () => {
    const audioBytes = new Uint8Array([1, 2, 3, 4]).buffer
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toContain('/sound-generation')
      const headers = init.headers as Record<string, string>
      expect(headers['xi-api-key']).toBe('the-key')
      return new Response(audioBytes, { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const res = await handler(
      jsonRequest({ mode: 'sfx', prompt: 'a laser' }, { 'X-ElevenLabs-Key': 'the-key' }),
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg')
    const buf = await res.arrayBuffer()
    expect(buf.byteLength).toBe(4)
  })

  it('surfaces an upstream non-ok response as an error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('bad request upstream', { status: 400 })),
    )

    const res = await handler(
      jsonRequest({ mode: 'music', prompt: 'a theme' }, { 'X-ElevenLabs-Key': 'k' }),
    )
    expect(res.status).toBe(500)
  })
})

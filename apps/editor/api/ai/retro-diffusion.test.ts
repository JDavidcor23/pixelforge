import { afterEach, describe, expect, it, vi } from 'vitest'

import handler from './retro-diffusion'

const jsonRequest = (body: unknown): Request =>
  new Request('http://localhost/api/ai/retro-diffusion', {
    method: 'POST',
    body: JSON.stringify(body),
  })

describe('retro-diffusion Vercel Function', () => {
  const originalEnv = process.env.API_RETRO_DIFFUSION

  afterEach(() => {
    process.env.API_RETRO_DIFFUSION = originalEnv
    vi.unstubAllGlobals()
  })

  it('rejects an empty prompt with 400', async () => {
    const res = await handler(jsonRequest({ prompt: '  ', width: 64, height: 64 }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/prompt/i)
  })

  it('returns 401 when no API key is available (no BYOK, no env var)', async () => {
    delete process.env.API_RETRO_DIFFUSION
    const res = await handler(jsonRequest({ prompt: 'a knight', width: 64, height: 64 }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.code).toBe('MISSING_API_KEY')
  })

  it('clamps width/height into [MIN_SIZE, MAX_SIZE] and forwards the request upstream', async () => {
    process.env.API_RETRO_DIFFUSION = 'server-side-test-key'
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const sentBody = JSON.parse(init.body as string)
      expect(sentBody.width).toBe(384) // clamped down from 999
      expect(sentBody.height).toBe(64) // clamped up from 1
      return new Response(JSON.stringify({ base64_images: ['AAAA'] }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const res = await handler(jsonRequest({ prompt: 'a knight', width: 999, height: 1 }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.base64).toMatch(/^data:image\/png;base64,/)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('uses the caller-supplied BYOK apiKey over the env var', async () => {
    process.env.API_RETRO_DIFFUSION = 'env-key'
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const headers = init.headers as Record<string, string>
      expect(headers['X-RD-Token']).toBe('byok-key')
      return new Response(JSON.stringify({ base64_images: ['AAAA'] }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    await handler(jsonRequest({ prompt: 'a knight', width: 64, height: 64, apiKey: 'byok-key' }))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('surfaces an upstream error message and status', async () => {
    process.env.API_RETRO_DIFFUSION = 'server-side-test-key'
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ message: 'rate limited' }), { status: 429 })),
    )

    const res = await handler(jsonRequest({ prompt: 'a knight', width: 64, height: 64 }))
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toBe('rate limited')
  })
})

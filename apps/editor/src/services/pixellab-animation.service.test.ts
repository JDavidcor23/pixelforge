import { afterEach, describe, expect, it, vi } from 'vitest'

import { AnimationProviderError } from './animation-provider.service'
import { createPixelLabAnimationProvider } from './pixellab-animation.service'
import { PIXELLAB_BUSY_ERROR } from '@/constants/animation'

const jsonResponse = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('createPixelLabAnimationProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // ADR 0009 follow-up: the Animate tab must react to the server's `code`,
  // never to `error`'s message text (which is free to change).
  it('submit() throws a typed AnimationProviderError with code "BUSY" on a 429', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: PIXELLAB_BUSY_ERROR, code: 'BUSY' }, 429)),
    )

    const provider = createPixelLabAnimationProvider({})
    const request = { firstFrameBase64: 'data:image/png;base64,x', action: 'walk', frameCount: 8 }

    await expect(provider.submit(request)).rejects.toMatchObject({
      message: PIXELLAB_BUSY_ERROR,
      code: 'BUSY',
    })

    try {
      await provider.submit(request)
      expect.unreachable('submit() should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(AnimationProviderError)
    }
  })

  // An error code the adapter does not recognize (e.g. a future server
  // addition) must not be forwarded as a false positive.
  it('submit() keeps code null for an unrecognized server code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: 'Missing key', code: 'MISSING_API_KEY' }, 401)),
    )

    const provider = createPixelLabAnimationProvider({})
    await expect(
      provider.submit({ firstFrameBase64: 'data:image/png;base64,x', action: 'walk', frameCount: 8 }),
    ).rejects.toMatchObject({ code: null })
  })

  // Server-owned jobs: the session token goes only with a server-billed submit.
  it('submit() sends the session token when signed in and no BYOK key is set', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => jsonResponse({ jobId: 'job-1' }, 200))
    vi.stubGlobal('fetch', fetchMock)
    const request = { firstFrameBase64: 'data:image/png;base64,x', action: 'walk', frameCount: 8 }

    await createPixelLabAnimationProvider({ getAccessToken: async () => 'jwt-1' }).submit(request)
    expect((fetchMock.mock.calls[0]![1].headers as Record<string, string>).Authorization).toBe('Bearer jwt-1')

    await createPixelLabAnimationProvider({ apiKey: 'byok', getAccessToken: async () => 'jwt-1' }).submit(request)
    expect(fetchMock.mock.calls[1]![1].headers).not.toHaveProperty('Authorization')
  })

  it('submit() still goes out when reading the session token fails', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => jsonResponse({ jobId: 'job-2' }, 200))
    vi.stubGlobal('fetch', fetchMock)

    const provider = createPixelLabAnimationProvider({ getAccessToken: async () => Promise.reject(new Error('x')) })
    await expect(
      provider.submit({ firstFrameBase64: 'data:image/png;base64,x', action: 'walk', frameCount: 8 }),
    ).resolves.toEqual({ jobId: 'job-2' })
    expect(fetchMock.mock.calls[0]![1].headers).not.toHaveProperty('Authorization')
  })
})

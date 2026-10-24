import { afterEach, describe, expect, it, vi } from 'vitest'

import { handler } from './job'

const jobRequest = (query: string, headers: Record<string, string> = {}): Request =>
  new Request(`http://localhost/api/ai/pixellab/job${query}`, { headers })

describe('pixellab/job Vercel Function', () => {
  const originalEnv = process.env.PIXELLAB_API_KEY

  afterEach(() => {
    process.env.PIXELLAB_API_KEY = originalEnv
    vi.unstubAllGlobals()
  })

  it('rejects a missing or path-like job id with 400', async () => {
    expect((await handler(jobRequest(''))).status).toBe(400)
    expect((await handler(jobRequest('?id=../balance'))).status).toBe(400)
  })

  it('returns 401 MISSING_API_KEY with no BYOK header and no env var', async () => {
    delete process.env.PIXELLAB_API_KEY
    const res = await handler(jobRequest('?id=job-1'))
    expect(res.status).toBe(401)
    expect((await res.json()).code).toBe('MISSING_API_KEY')
  })

  it('uses the BYOK header and answers with the mapped status (input frame dropped)', async () => {
    process.env.PIXELLAB_API_KEY = 'env-key'
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      expect(url.endsWith('/background-jobs/job-1')).toBe(true)
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer byok-key')
      return new Response(
        JSON.stringify({ id: 'job-1', status: 'completed', last_response: { images: ['IN', 'F1'] } }),
        { status: 200 },
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const res = await handler(jobRequest('?id=job-1', { 'x-pixellab-key': 'byok-key' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      status: 'completed',
      frames: ['data:image/png;base64,F1'],
      error: null,
      costUsd: null,
    })
  })

  it('surfaces an upstream error status', async () => {
    process.env.PIXELLAB_API_KEY = 'env-key'
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ detail: 'Job not found' }), { status: 404 })))

    const res = await handler(jobRequest('?id=job-1'))
    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe('Job not found')
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'

import handler from './animate'
import { PIXELLAB_BUSY_ERROR } from '../../../src/constants/animation'

const pngBase64 = (width: number, height: number): string => {
  const bytes = new Uint8Array(24)
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52])
  const view = new DataView(bytes.buffer)
  view.setUint32(16, width)
  view.setUint32(20, height)
  return `data:image/png;base64,${btoa(String.fromCharCode(...bytes))}`
}

const jsonRequest = (body: unknown): Request =>
  new Request('http://localhost/api/ai/pixellab/animate', { method: 'POST', body: JSON.stringify(body) })

const validBody = { firstFrameBase64: pngBase64(128, 128), action: 'walk', frameCount: 8 }

describe('pixellab/animate Vercel Function', () => {
  const originalEnv = process.env.PIXELLAB_API_KEY

  afterEach(() => {
    process.env.PIXELLAB_API_KEY = originalEnv
    vi.unstubAllGlobals()
  })

  it('rejects a missing action, a non-PNG frame, a bad size or frame count with 400', async () => {
    expect((await handler(jsonRequest({ ...validBody, action: ' ' }))).status).toBe(400)
    expect((await handler(jsonRequest({ ...validBody, firstFrameBase64: 'AAAA' }))).status).toBe(400)
    expect((await handler(jsonRequest({ ...validBody, firstFrameBase64: pngBase64(128, 64) }))).status).toBe(400)
    expect((await handler(jsonRequest({ ...validBody, firstFrameBase64: pngBase64(384, 384) }))).status).toBe(400)
    expect((await handler(jsonRequest({ ...validBody, frameCount: 7 }))).status).toBe(400)
    expect((await handler(jsonRequest({ ...validBody, firstFrameBase64: pngBase64(256, 256), frameCount: 12 }))).status).toBe(400)
  })

  it('returns 401 MISSING_API_KEY with no BYOK and no env var', async () => {
    delete process.env.PIXELLAB_API_KEY
    const res = await handler(jsonRequest(validBody))
    expect(res.status).toBe(401)
    expect((await res.json()).code).toBe('MISSING_API_KEY')
  })

  it('forwards bare base64, no_background and never last_frame; returns the job id', async () => {
    process.env.PIXELLAB_API_KEY = 'env-key'
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const sent = JSON.parse(init.body as string)
      expect(sent.first_frame.base64.startsWith('data:')).toBe(false)
      expect(sent.no_background).toBe(true)
      expect(sent.frame_count).toBe(8)
      expect(sent).not.toHaveProperty('last_frame')
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer byok-key')
      return new Response(JSON.stringify({ background_job_id: 'job-42' }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const res = await handler(jsonRequest({ ...validBody, apiKey: 'byok-key' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ jobId: 'job-42' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('maps an upstream 429 to a clear BUSY error', async () => {
    process.env.PIXELLAB_API_KEY = 'env-key'
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ detail: 'limit' }), { status: 429 })))

    const res = await handler(jsonRequest(validBody))
    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({ error: PIXELLAB_BUSY_ERROR, code: 'BUSY' })
  })
})

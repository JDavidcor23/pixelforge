import { describe, expect, it, vi } from 'vitest'

import { loadLevel } from './load-level'

const LEVEL = {
  version: 1,
  name: 'Test level',
  width: 640,
  height: 360,
  spawn: { x: 32, y: 300 },
  platforms: [{ x: 0, y: 340, width: 640, height: 20 }],
  hazards: [],
  goal: { x: 600, y: 300, width: 20, height: 40 },
}

function respond(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return vi.fn().mockResolvedValue({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: () => Promise.resolve(body),
  })
}

describe('loadLevel', () => {
  it('fetches the url and returns the validated level', async () => {
    const fetchFn = respond(LEVEL)

    const result = await loadLevel('/levels/test.json', fetchFn)

    expect(fetchFn).toHaveBeenCalledWith('/levels/test.json')
    expect(result).toEqual({ ok: true, level: LEVEL })
  })

  it('rejects an invalid level with the validation error', async () => {
    const result = await loadLevel('/levels/test.json', respond({ ...LEVEL, width: -5 }))

    expect(result).toEqual({ ok: false, error: 'Invalid level: width must be a positive number' })
  })

  it('reports an HTTP failure with the url and status', async () => {
    const result = await loadLevel('/levels/missing.json', respond(null, { ok: false, status: 404 }))

    expect(result).toEqual({ ok: false, error: 'Could not load level /levels/missing.json (HTTP 404)' })
  })

  it('reports a body that is not JSON', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError('Unexpected token')),
    })

    const result = await loadLevel('/levels/test.json', fetchFn)

    expect(result).toEqual({ ok: false, error: 'Could not load level /levels/test.json (not valid JSON)' })
  })
})

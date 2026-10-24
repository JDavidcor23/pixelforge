import { describe, expect, it } from 'vitest'

import elevenlabs from './elevenlabs'
import pixellabAnimate from './pixellab/animate'
import pixellabJob from './pixellab/job'
import retroDiffusion from './retro-diffusion'

/**
 * Vercel's Node runtime only hands a function the Web `Request` when the file
 * exports `default { fetch }` (or named HTTP methods). A bare default function
 * gets Node's `req`/`res` instead and the request hangs until it times out.
 */
describe('Vercel function entry points', () => {
  it.each([
    ['elevenlabs', elevenlabs],
    ['pixellab/animate', pixellabAnimate],
    ['pixellab/job', pixellabJob],
    ['retro-diffusion', retroDiffusion],
  ])('%s exports the Web-standard `default { fetch }` shape', (_name, entry) => {
    expect(typeof entry).toBe('object')
    expect(typeof entry.fetch).toBe('function')
  })
})

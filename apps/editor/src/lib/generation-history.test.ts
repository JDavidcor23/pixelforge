import { describe, expect, it } from 'vitest'

import { parseGenerationHistory } from './generation-history'

const PIXEL_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

const entry = { id: 'a', prompt: 'a knight', base64: PIXEL_PNG, timestamp: 1, width: 1, height: 1 }

describe('parseGenerationHistory', () => {
  it('keeps an entry without the optional fields byte-for-byte (regression)', () => {
    expect(parseGenerationHistory(JSON.stringify([entry])).generations).toEqual([entry])
  })

  it('keeps kind, revision and updatedAt of a drawing asset', () => {
    const drawing = { ...entry, kind: 'drawing', revision: 3, updatedAt: 42 }

    expect(parseGenerationHistory(JSON.stringify([drawing])).generations).toEqual([drawing])
  })

  it('drops invalid optional fields instead of trusting them', () => {
    const bad = { ...entry, kind: 'video', revision: 'x', updatedAt: null }

    expect(parseGenerationHistory(JSON.stringify([bad])).generations).toEqual([entry])
  })
})

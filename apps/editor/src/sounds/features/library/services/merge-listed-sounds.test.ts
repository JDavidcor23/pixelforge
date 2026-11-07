import { describe, expect, it } from 'vitest'

import type { AudioAsset } from '@/types/audio'
import { mergeListedSounds } from './merge-listed-sounds'

const sound = (id: string, extra: Partial<AudioAsset> = {}): AudioAsset => ({
  id,
  name: id,
  tags: [],
  duration: 0,
  format: 'audio/wav',
  fileSize: 0,
  associatedSpriteIds: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  ...extra,
})

describe('mergeListedSounds', () => {
  it('appends listed sounds the session does not have, after the session ones', () => {
    const existing = [sound('a')]
    expect(mergeListedSounds(existing, [sound('b')]).map((s) => s.id)).toEqual(['a', 'b'])
  })

  it('keeps the session asset when the id matches (session wins, richer metadata)', () => {
    const session = sound('a', { name: 'Coin', duration: 1.2, source: 'synth' })
    const merged = mergeListedSounds([session], [sound('a', { name: 'a' })])
    expect(merged).toHaveLength(1)
    expect(merged[0]).toBe(session)
  })

  it('dedupes by supabaseUrl when the ids differ', () => {
    const session = sound('local-1', { supabaseUrl: 'https://x/u/sounds/abc.wav' })
    const listed = sound('abc', { supabaseUrl: 'https://x/u/sounds/abc.wav' })
    expect(mergeListedSounds([session], [listed])).toEqual([session])
  })

  it('dedupes repeated entries inside the listed batch', () => {
    const merged = mergeListedSounds([], [sound('b'), sound('b')])
    expect(merged.map((s) => s.id)).toEqual(['b'])
  })

  it('returns the same array reference when nothing is new', () => {
    const existing = [sound('a')]
    expect(mergeListedSounds(existing, [sound('a')])).toBe(existing)
    expect(mergeListedSounds(existing, [])).toBe(existing)
  })

  it('does not mutate its inputs', () => {
    const existing = [sound('a')]
    mergeListedSounds(existing, [sound('b')])
    expect(existing).toHaveLength(1)
  })
})

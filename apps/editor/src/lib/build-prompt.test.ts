import { describe, expect, it } from 'vitest'

import { buildPrompt } from './build-prompt'
import { GAME_TEMPLATES } from '@/constants'

const platformer = GAME_TEMPLATES.platformer

describe('buildPrompt', () => {
  it('appends the template rules for a character', () => {
    expect(buildPrompt('a knight', platformer, 'character')).toBe(`a knight, ${platformer.rules.character}`)
  })

  it('returns the prompt unchanged when no template is selected', () => {
    expect(buildPrompt('a knight', null, 'character')).toBe('a knight')
  })

  it('returns the prompt unchanged when the template has no rules for the asset type', () => {
    expect(buildPrompt('a wooden barrel', platformer, 'object')).toBe('a wooden barrel')
  })

  it('trims the user prompt before joining', () => {
    expect(buildPrompt('  a knight  ', null, 'character')).toBe('a knight')
  })
})

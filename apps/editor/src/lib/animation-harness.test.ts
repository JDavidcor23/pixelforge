import { describe, expect, it } from 'vitest'

import { ANIMATION_HARNESS, buildAnimationAction, findAnimationMotion } from './animation-harness'
import { ASSET_TYPES } from '@/constants'
import { PIXELLAB_MAX_FRAMES, PIXELLAB_MIN_FRAMES } from '@/constants/animation'

describe('buildAnimationAction', () => {
  it('puts the identity rules FIRST, then the motion', () => {
    const walk = findAnimationMotion('character', 'walk')
    const action = buildAnimationAction(walk, 'character')

    expect(action.startsWith(ANIMATION_HARNESS.character.identityRules)).toBe(true)
    expect(action.endsWith(walk.motion)).toBe(true)
  })

  it('keeps the measured walk wording, generalized (no staff, no robe)', () => {
    const action = buildAnimationAction(findAnimationMotion('character', 'walk'), 'character')

    expect(action).toContain('Do not turn or rotate the body.')
    expect(action).toContain('Held items stay in the same hand in every frame.')
    expect(action).toContain('legs alternate clear steps, clothing swings with each step')
    expect(action).not.toMatch(/staff|robe/)
  })

  it('prepends the identity rules to custom text too', () => {
    const action = buildAnimationAction('  shoots the pistol and recoils  ', 'character')

    expect(action).toBe(`${ANIMATION_HARNESS.character.identityRules} shoots the pistol and recoils`)
  })

  it('uses the asset type’s own rules', () => {
    expect(buildAnimationAction('glows', 'weapon')).toBe(`${ANIMATION_HARNESS.weapon.identityRules} glows`)
    expect(ANIMATION_HARNESS.weapon.identityRules).toContain('weapon')
  })

  it('returns only the rules when the motion is empty', () => {
    expect(buildAnimationAction('   ', 'object')).toBe(ANIMATION_HARNESS.object.identityRules)
  })
})

describe('ANIMATION_HARNESS', () => {
  it('covers every asset type, each with a valid default motion and one custom preset', () => {
    for (const { id } of ASSET_TYPES) {
      const entry = ANIMATION_HARNESS[id]
      expect(entry.motions.some((preset) => preset.id === entry.defaultMotionId)).toBe(true)
      expect(entry.motions.filter((preset) => preset.isCustomInput)).toHaveLength(1)
    }
  })

  it('only uses even default frame counts the provider accepts', () => {
    for (const { id } of ASSET_TYPES) {
      for (const preset of ANIMATION_HARNESS[id].motions) {
        expect(preset.defaultFrames % 2).toBe(0)
        expect(preset.defaultFrames).toBeGreaterThanOrEqual(PIXELLAB_MIN_FRAMES)
        expect(preset.defaultFrames).toBeLessThanOrEqual(PIXELLAB_MAX_FRAMES)
      }
    }
  })

  it('gives every non-custom preset explicit motion text', () => {
    for (const { id } of ASSET_TYPES) {
      for (const preset of ANIMATION_HARNESS[id].motions.filter((p) => !p.isCustomInput)) {
        expect(preset.motion.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('offers idle, walk, run, jump, attack and crouch for characters', () => {
    const ids = ANIMATION_HARNESS.character.motions.map((preset) => preset.id)
    expect(ids).toEqual(expect.arrayContaining(['idle', 'walk', 'run', 'jump', 'attack', 'crouch']))
  })
})

describe('findAnimationMotion', () => {
  it('falls back to the asset type’s default for an unknown id', () => {
    expect(findAnimationMotion('object', 'crouch').id).toBe(ANIMATION_HARNESS.object.defaultMotionId)
  })
})

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

  it('treats the preset motion as the default text — no separate detail argument', () => {
    // ADR 0012: the preset's motion text is the editable box's prefill. A caller
    // who wants to change it just passes different text — there is no third
    // "extraDetail" argument to concatenate anymore.
    const edited = buildAnimationAction('raises the staff then swings it in one motion', 'character')
    expect(edited).toBe(`${ANIMATION_HARNESS.character.identityRules} raises the staff then swings it in one motion`)
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

  it('gives every non-custom preset a detail placeholder suggesting what to describe', () => {
    for (const { id } of ASSET_TYPES) {
      for (const preset of ANIMATION_HARNESS[id].motions.filter((p) => !p.isCustomInput)) {
        expect(preset.detailPlaceholder?.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('describes the attack as a gradual swing through a mid-point, not an instant pose jump', () => {
    const { motion } = findAnimationMotion('character', 'attack')
    expect(motion).toContain('through a clear mid-swing position before the strike')
  })

  it('offers idle, walk, run, jump, attack and crouch for characters', () => {
    const ids = ANIMATION_HARNESS.character.motions.map((preset) => preset.id)
    expect(ids).toEqual(expect.arrayContaining(['idle', 'walk', 'run', 'jump', 'attack', 'crouch']))
  })

  it('closes the loop on the first frame for idle and jump, never for walk', () => {
    expect(findAnimationMotion('character', 'idle').loopToFirstFrame).toBe(true)
    expect(findAnimationMotion('character', 'jump').loopToFirstFrame).toBe(true)
    expect(findAnimationMotion('character', 'walk').loopToFirstFrame).toBeFalsy()
  })

  it('tells every character motion to keep held items whole', () => {
    expect(ANIMATION_HARNESS.character.identityRules).toContain(
      'Held items keep their full length and shape in every frame, they never shrink or disappear.',
    )
    expect(ANIMATION_HARNESS.character.identityRules).toContain(
      'Held items keep the same angle as in the first frame, they never tilt or lie flat.',
    )
  })

  it('lets the attack swing its held item: no angle lock, closes on the first frame, 8 frames', () => {
    const attack = findAnimationMotion('character', 'attack')
    const action = buildAnimationAction(attack.motion, 'character', attack)
    expect(action).not.toContain('Held items keep the same angle as in the first frame')
    expect(action).toContain('Held items keep their full length and shape in every frame')
    expect(action.endsWith(attack.motion)).toBe(true)
    expect(attack.loopToFirstFrame).toBe(true)
    expect(attack.defaultFrames).toBe(8)
  })

  it('keeps the held-item angle lock for every other character motion', () => {
    const walk = findAnimationMotion('character', 'walk')
    expect(buildAnimationAction(walk.motion, 'character', walk)).toContain(
      'Held items keep the same angle as in the first frame, they never tilt or lie flat.',
    )
  })

  it('jumps with lively free arms while the held item stays upright', () => {
    const { motion } = findAnimationMotion('character', 'jump')
    expect(motion).toContain('the free arm swings down on the bend and up on the rise')
    expect(motion).toContain('the arm holding an item moves only a little and the item stays upright')
    expect(motion).toContain('both feet clearly leave the ground')
    expect(motion).not.toMatch(/staff/)
  })
})

describe('findAnimationMotion', () => {
  it('falls back to the asset type’s default for an unknown id', () => {
    expect(findAnimationMotion('object', 'crouch').id).toBe(ANIMATION_HARNESS.object.defaultMotionId)
  })
})

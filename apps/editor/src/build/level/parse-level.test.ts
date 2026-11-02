import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { parseLevel } from './parse-level'

function validLevel() {
  return {
    version: 1,
    name: 'Test level',
    width: 640,
    height: 360,
    spawn: { x: 32, y: 300 },
    platforms: [{ x: 0, y: 340, width: 640, height: 20 }],
    hazards: [{ x: 200, y: 330, width: 32, height: 10 }],
    goal: { x: 600, y: 300, width: 20, height: 40 },
  }
}

describe('parseLevel', () => {
  it('accepts a valid level and returns it unchanged', () => {
    const input = validLevel()

    const result = parseLevel(input)

    expect(result).toEqual({ ok: true, level: input })
  })

  it('accepts the level shipped in public/levels', () => {
    const file = path.resolve(__dirname, '../../../public/levels/level-1.json')
    const result = parseLevel(JSON.parse(readFileSync(file, 'utf8')))

    expect(result.ok).toBe(true)
  })

  it.each([
    ['not an object', null, 'Invalid level: level must be an object'],
    ['an unknown version', { ...validLevel(), version: 2 }, 'Invalid level: version must be 1'],
    ['a missing name', { ...validLevel(), name: '' }, 'Invalid level: name must be a non-empty string'],
    ['a zero width', { ...validLevel(), width: 0 }, 'Invalid level: width must be a positive number'],
    ['platforms that are not a list', { ...validLevel(), platforms: {} }, 'Invalid level: platforms must be a list'],
    ['no platforms', { ...validLevel(), platforms: [] }, 'Invalid level: platforms must have at least one item'],
    [
      'a platform with a negative height',
      { ...validLevel(), platforms: [{ x: 0, y: 340, width: 640, height: -1 }] },
      'Invalid level: platforms[0].height must be a positive number',
    ],
    [
      'a hazard with a text coordinate',
      { ...validLevel(), hazards: [{ x: '1', y: 0, width: 4, height: 4 }] },
      'Invalid level: hazards[0].x must be a number',
    ],
    ['a missing goal', { ...validLevel(), goal: undefined }, 'Invalid level: goal must be an object'],
    [
      'a goal outside the level',
      { ...validLevel(), goal: { x: 630, y: 300, width: 20, height: 40 } },
      'Invalid level: goal must be inside the 640x360 level',
    ],
    [
      'a spawn outside the level',
      { ...validLevel(), spawn: { x: -1, y: 300 } },
      'Invalid level: spawn must be inside the 640x360 level',
    ],
  ])('rejects %s with a clear error', (_case, input, error) => {
    expect(parseLevel(input)).toEqual({ ok: false, error })
  })
})

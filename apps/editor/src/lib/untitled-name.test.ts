import { describe, expect, it } from 'vitest'

import { nextUntitledName } from './untitled-name'

describe('nextUntitledName (ADR 0015: "Untitled N", next free number)', () => {
  it('starts at "Untitled 1" when no name is taken', () => {
    expect(nextUntitledName([])).toBe('Untitled 1')
  })

  it('takes the number after the highest "Untitled N" in use', () => {
    expect(nextUntitledName(['Untitled 1', 'Untitled 3', 'My hero'])).toBe('Untitled 4')
  })

  it('ignores names that only look like "Untitled N"', () => {
    expect(nextUntitledName(['Untitled sprite', 'Untitled 2x', 'untitled 7', 'Untitled 0'])).toBe('Untitled 1')
  })
})

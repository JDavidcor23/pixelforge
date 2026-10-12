import { describe, expect, it } from 'vitest'

import { isDeleteAccountConfirmed } from './delete-account-confirm'

describe('isDeleteAccountConfirmed', () => {
  it('is false for an empty value', () => {
    expect(isDeleteAccountConfirmed('')).toBe(false)
  })

  it('is false for a lowercase match (case-sensitive)', () => {
    expect(isDeleteAccountConfirmed('delete')).toBe(false)
  })

  it('is false for a value with surrounding whitespace', () => {
    expect(isDeleteAccountConfirmed(' DELETE ')).toBe(false)
  })

  it('is true for an exact match', () => {
    expect(isDeleteAccountConfirmed('DELETE')).toBe(true)
  })
})

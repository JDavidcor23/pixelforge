import { describe, expect, it } from 'vitest'

import { mapDeleteAccountError } from './map-delete-account-error'
import { DELETE_ACCOUNT_DEFAULT_ERROR_MESSAGE, DELETE_ACCOUNT_ERROR_MESSAGES } from '@/constants/account-deletion'

describe('mapDeleteAccountError', () => {
  it('maps UNAUTHENTICATED to plain language', () => {
    expect(mapDeleteAccountError('UNAUTHENTICATED')).toBe(DELETE_ACCOUNT_ERROR_MESSAGES.UNAUTHENTICATED)
  })

  it('maps DELETE_FAILED to plain language', () => {
    expect(mapDeleteAccountError('DELETE_FAILED')).toBe(DELETE_ACCOUNT_ERROR_MESSAGES.DELETE_FAILED)
  })

  it('falls back to the default message for UNAVAILABLE (function missing/network)', () => {
    expect(mapDeleteAccountError('UNAVAILABLE')).toBe(DELETE_ACCOUNT_DEFAULT_ERROR_MESSAGE)
  })
})

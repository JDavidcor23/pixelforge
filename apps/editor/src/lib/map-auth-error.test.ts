import { AuthApiError } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'

import { mapAuthError } from './map-auth-error'
import { AUTH_DEFAULT_ERROR_MESSAGE, AUTH_ERROR_MESSAGES } from '@/constants/auth'

describe('mapAuthError', () => {
  it('maps a known error code to plain language', () => {
    const error = new AuthApiError('Invalid login credentials', 400, 'invalid_credentials')
    expect(mapAuthError(error)).toBe(AUTH_ERROR_MESSAGES.invalid_credentials)
  })

  it('falls back to the default message for an unknown code', () => {
    const error = new AuthApiError('Something exotic happened', 500, 'something_exotic')
    expect(mapAuthError(error)).toBe(AUTH_DEFAULT_ERROR_MESSAGE)
  })
})

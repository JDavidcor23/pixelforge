import type { AuthError } from '@supabase/supabase-js'

import { AUTH_DEFAULT_ERROR_MESSAGE, AUTH_ERROR_MESSAGES } from '@/constants/auth'

/** Supabase's `AuthError.message` differs across versions/locales — `.code` is the stable key to map from. */
export function mapAuthError(error: AuthError): string {
  const code = error.code ?? error.message
  return AUTH_ERROR_MESSAGES[code] ?? AUTH_DEFAULT_ERROR_MESSAGE
}

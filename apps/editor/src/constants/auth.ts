/**
 * Plain-language copy for Supabase auth errors (editor-auth change). Keyed by
 * `AuthApiError.code` (stable across Supabase SDK versions — `.message` is
 * not). Unlisted codes fall back to `AUTH_DEFAULT_ERROR_MESSAGE`.
 */
export const AUTH_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  invalid_credentials: 'Wrong email or password.',
  email_not_confirmed: 'Confirm your email first — check your inbox for the link.',
  user_already_exists: 'An account with this email already exists. Try signing in instead.',
  weak_password: 'Use at least 6 characters.',
  same_password: 'That is already your current password.',
  over_email_send_rate_limit: 'Too many attempts — wait a moment and try again.',
}

export const AUTH_DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.'

/** How long the "Password updated" confirmation shows before redirecting into the editor. */
export const RESET_PASSWORD_REDIRECT_DELAY_MS = 1500

export const AUTH_COPY = {
  CHECK_EMAIL: 'Check your email to confirm your account.',
  RESET_EMAIL_SENT: 'If an account exists for that email, a reset link is on its way.',
  PASSWORD_UPDATED: 'Password updated — redirecting you to the editor.',
  ACCOUNTS_UNAVAILABLE: 'Accounts are not available in this build.',
} as const

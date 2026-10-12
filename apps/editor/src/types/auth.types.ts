/**
 * Account support is OPTIONAL (owner decision, editor-auth change): the editor
 * keeps working fully signed-out, with drafts local to the browser exactly as
 * before. These types model just enough of a Supabase session for the UI —
 * never the full `@supabase/supabase-js` `User`/`Session` shape, so components
 * don't need to know Supabase exists.
 */

/**
 * `'loading'` until the first `getSession()` resolves (session restore from
 * Supabase's own localStorage key, or none). `'signed-out'`/`'signed-in'`
 * after that, kept in sync by `onAuthStateChange`.
 */
export type AuthStatus = 'loading' | 'signed-out' | 'signed-in'

/** Minimal, UI-facing shape — see `authService`'s mapping from the Supabase `User`. */
export interface AuthUser {
  readonly id: string
  readonly email: string | null
  readonly displayName: string | null
  readonly avatarUrl: string | null
}

export interface AuthState {
  readonly status: AuthStatus
  readonly user: AuthUser | null
  /** `false` when `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are missing — the UI shows a calm "accounts not available" notice instead of a broken sign-in flow. */
  readonly isAvailable: boolean
}

export interface AuthActions {
  setSession: (user: AuthUser | null) => void
  clearSession: () => void
}

export type AuthStore = AuthState & AuthActions

/** Which form the login page's `AuthForm` renders — one page, three small flows. */
export type AuthFormMode = 'sign-in' | 'sign-up' | 'forgot'

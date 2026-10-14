import { FunctionsHttpError } from '@supabase/supabase-js'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'
import { EDITOR_ROUTES } from '@/constants/routes'
import { DELETE_ACCOUNT_ERROR_CODE } from '@/constants/account-deletion'
import type { AuthUser, DeleteAccountErrorCode, DeleteAccountResult } from '@/types'

/** Supabase's Google payload puts the name under `full_name` (OAuth) or `name` (fallback) — same shape GoTrue has used since launch. */
interface GoogleUserMetadata {
  readonly full_name?: string
  readonly name?: string
  readonly avatar_url?: string
}

/** Maps the Supabase `User` down to the small shape the UI actually needs. */
function mapUser(user: User): AuthUser {
  const metadata = user.user_metadata as GoogleUserMetadata
  return {
    id: user.id,
    email: user.email ?? null,
    displayName: metadata.full_name ?? metadata.name ?? null,
    avatarUrl: metadata.avatar_url ?? null,
  }
}

/** Row shape of `public.profiles` — the client has no generated `Database` types to infer this from. */
interface ProfileRow {
  readonly display_name: string | null
  readonly avatar_url: string | null
}

/**
 * Best-effort override from `public.profiles` (filled by the `on_auth_user_created`
 * trigger — see `supabase/migrations/20261011000000_init_pixelforge.sql`). Falls
 * back silently to whatever `mapUser` already read from `user_metadata`: a
 * missing/failed profile row must never block sign-in.
 */
async function applyProfileOverride(user: AuthUser): Promise<AuthUser> {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()
  const profile = data as ProfileRow | null

  if (error || !profile) return user

  return {
    ...user,
    displayName: profile.display_name ?? user.displayName,
    avatarUrl: profile.avatar_url ?? user.avatarUrl,
  }
}

/** The response envelope `supabase/functions/delete-account/index.ts` always replies with, success or failure. */
interface DeleteAccountEnvelope {
  readonly ok: boolean
  readonly data?: { readonly filesRemoved: number }
  readonly error?: { readonly code: string; readonly message: string }
}

/** Only the two codes the function can actually send pass through — anything else (including `undefined`) collapses to `UNAVAILABLE`. */
function toDeleteAccountErrorCode(code: string | undefined): DeleteAccountErrorCode {
  if (code === DELETE_ACCOUNT_ERROR_CODE.UNAUTHENTICATED || code === DELETE_ACCOUNT_ERROR_CODE.DELETE_FAILED) {
    return code
  }
  return DELETE_ACCOUNT_ERROR_CODE.UNAVAILABLE
}

/**
 * Calls the `delete-account` Edge Function (self-service account deletion,
 * see `supabase/functions/delete-account/index.ts`). `supabase.functions.invoke`
 * never throws for a non-2xx response — it comes back as `error instanceof
 * FunctionsHttpError`, whose `.context` is the raw `Response`; the actual
 * `{ok:false,error:{code,message}}` body has to be read off of it.
 * `UNAVAILABLE` is synthesized for every case the function itself never
 * produces: not deployed, offline, or a Supabase relay failure.
 */
async function deleteAccount(): Promise<DeleteAccountResult> {
  try {
    const { data, error } = await supabase.functions.invoke<DeleteAccountEnvelope>('delete-account', {
      method: 'POST',
    })

    if (error) {
      if (error instanceof FunctionsHttpError) {
        const body: DeleteAccountEnvelope | null = await error.context.json().catch(() => null)
        if (body && !body.ok && body.error) return { ok: false, code: toDeleteAccountErrorCode(body.error.code) }
      }
      return { ok: false, code: DELETE_ACCOUNT_ERROR_CODE.UNAVAILABLE }
    }

    if (data?.ok && data.data) return { ok: true, filesRemoved: data.data.filesRemoved }
    if (data && !data.ok && data.error) return { ok: false, code: toDeleteAccountErrorCode(data.error.code) }

    return { ok: false, code: DELETE_ACCOUNT_ERROR_CODE.UNAVAILABLE }
  } catch {
    return { ok: false, code: DELETE_ACCOUNT_ERROR_CODE.UNAVAILABLE }
  }
}

/** The current session's access token (refreshed by Supabase when expired), or null when signed out. */
async function getAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  return data.session?.access_token ?? null
}

export const authService = {
  getSession: () => supabase.auth.getSession(),

  getAccessToken,

  onAuthStateChange: (callback: (event: AuthChangeEvent, session: Session | null) => void) =>
    supabase.auth.onAuthStateChange(callback),

  signInWithGoogle: () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${EDITOR_ROUTES.SPRITES}` },
    }),

  signInWithPassword: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signUp: (email: string, password: string) => supabase.auth.signUp({ email, password }),

  resetPasswordForEmail: (email: string) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${EDITOR_ROUTES.RESET_PASSWORD}`,
    }),

  updatePassword: (password: string) => supabase.auth.updateUser({ password }),

  signOut: () => supabase.auth.signOut(),

  deleteAccount,

  mapUser,
  applyProfileOverride,
}

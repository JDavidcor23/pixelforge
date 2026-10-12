import type { DELETE_ACCOUNT_ERROR_CODE } from '@/constants/account-deletion'

/**
 * Self-service account deletion (editor-auth change). The Edge Function
 * (`supabase/functions/delete-account`) answers with one of these codes;
 * `UNAVAILABLE` is synthesized client-side (see `authService.deleteAccount`)
 * for every case the function itself never produces — not deployed,
 * offline, relay failure.
 */
export type DeleteAccountErrorCode = (typeof DELETE_ACCOUNT_ERROR_CODE)[keyof typeof DELETE_ACCOUNT_ERROR_CODE]

export interface DeleteAccountSuccess {
  readonly ok: true
  readonly filesRemoved: number
}

export interface DeleteAccountFailure {
  readonly ok: false
  readonly code: DeleteAccountErrorCode
}

export type DeleteAccountResult = DeleteAccountSuccess | DeleteAccountFailure

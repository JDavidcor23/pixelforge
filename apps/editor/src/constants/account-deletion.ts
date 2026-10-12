/**
 * Self-service "Delete my account" (editor-auth change). Copy, error codes
 * and the type-to-confirm word all live here. See `auth.service.ts`'s
 * `deleteAccount()` for the Edge Function contract these codes mirror
 * (`supabase/functions/delete-account/index.ts`).
 */
export const DELETE_ACCOUNT_ERROR_CODE = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  DELETE_FAILED: 'DELETE_FAILED',
  /** Synthesized client-side only — the function itself never sends this (not deployed, offline, relay failure). */
  UNAVAILABLE: 'UNAVAILABLE',
} as const

export const DELETE_ACCOUNT_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  UNAUTHENTICATED: 'Your session expired. Sign in again, then delete your account.',
  DELETE_FAILED: "We couldn't finish deleting your account. Try again — it's safe to retry.",
}

/** Covers `UNAVAILABLE` and anything else the map above doesn't recognize — same fallback shape as `AUTH_DEFAULT_ERROR_MESSAGE`. */
export const DELETE_ACCOUNT_DEFAULT_ERROR_MESSAGE =
  "Account deletion isn't available right now. Please try again later or contact support."

/** Case-sensitive — matches the destructive button's own copy exactly. */
export const DELETE_ACCOUNT_CONFIRM_WORD = 'DELETE'

export const DELETE_ACCOUNT_COPY = {
  TITLE: 'Delete your account?',
  BODY: "This permanently deletes your PixelForge account and everything saved in the cloud: your profile, projects, documents, generated assets and uploaded files. This can't be undone.",
  LOCAL_CHECKBOX_LABEL: 'Also delete the sprites and assets saved in this browser',
  CONFIRM_INPUT_LABEL: 'Type DELETE to confirm',
  CANCEL_BUTTON: 'Cancel',
  CONFIRM_BUTTON: 'Delete my account permanently',
  CONFIRM_BUTTON_PENDING: 'Deleting…',
  SUCCESS_MESSAGE: 'Your account was deleted.',
} as const

/** How long the post-deletion confirmation banner stays up before auto-dismissing. */
export const ACCOUNT_DELETED_NOTICE_AUTO_DISMISS_MS = 6000

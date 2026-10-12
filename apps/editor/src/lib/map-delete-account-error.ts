import {
  DELETE_ACCOUNT_DEFAULT_ERROR_MESSAGE,
  DELETE_ACCOUNT_ERROR_MESSAGES,
} from '@/constants/account-deletion'
import type { DeleteAccountErrorCode } from '@/types'

/** Same shape as `mapAuthError` — an unmapped (or synthesized `UNAVAILABLE`) code falls back to the default message. */
export function mapDeleteAccountError(code: DeleteAccountErrorCode): string {
  return DELETE_ACCOUNT_ERROR_MESSAGES[code] ?? DELETE_ACCOUNT_DEFAULT_ERROR_MESSAGE
}

import { DELETE_ACCOUNT_CONFIRM_WORD } from '@/constants/account-deletion'

/** Case-sensitive — matches the confirm button's own copy exactly ("DELETE", not "delete"). */
export function isDeleteAccountConfirmed(value: string): boolean {
  return value === DELETE_ACCOUNT_CONFIRM_WORD
}

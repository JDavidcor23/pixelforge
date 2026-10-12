import {
  useIsPersistent,
  useSaveError,
  useSaveStatus,
} from '@/sprites/hooks/useSpriteEditorStore.hook'
import type { SaveIndicator as SaveIndicatorValue } from '@/types/save-indicator'

const NOT_SAVED_UNAVAILABLE_TITLE = 'Drafts are not being saved — local storage is unavailable.'
const SAVE_ERROR_FALLBACK_TITLE = 'Your sprite could not be saved.'
const SAVED_TITLE = 'Your sprite is saved in this browser automatically. Cloud sync comes later.'

/**
 * TopBar's visible save-status indicator (Sprite Studio v2 batch 4) — a
 * presentation-ready projection of `saveStatus`/`saveError`/`isPersistent`
 * (see `document-status.slice.ts` and `document-persistence.controller.ts`
 * for the 'saving' -> 'saved'/'error' transitions this reads).
 */
export const useSaveIndicator = (): SaveIndicatorValue => {
  const saveStatus = useSaveStatus()
  const saveError = useSaveError()
  const isPersistent = useIsPersistent()

  if (!isPersistent) return { kind: 'not-saved', title: NOT_SAVED_UNAVAILABLE_TITLE }
  if (saveStatus === 'saving') return { kind: 'saving' }
  if (saveStatus === 'error') return { kind: 'not-saved', title: saveError ?? SAVE_ERROR_FALLBACK_TITLE }
  return { kind: 'saved', title: SAVED_TITLE }
}

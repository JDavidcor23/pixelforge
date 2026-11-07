import type { ResolvedDocumentRepository } from './resolve-document-repository.service'
import { DRAFT_MIGRATION_ASSET_STORAGE_KEY, OPEN_SPRITE_ASSET_STORAGE_KEY } from '@/constants/persistence'

export interface ClearLocalSpriteDataDeps {
  readonly resolveRepository: () => Promise<ResolvedDocumentRepository>
  readonly storage: Pick<Storage, 'removeItem'>
  /** Cancels the editor's pending/in-flight autosave first, so it cannot re-create a document after the wipe. */
  readonly discardPendingSaves?: () => Promise<void>
}

/**
 * "Delete what's saved in this browser": drops every stored sprite document
 * (the old draft and each per-asset document) and the localStorage keys that
 * point at them. Each step is isolated — a failure is logged and never blocks
 * the rest of the account-deletion flow.
 */
export async function clearLocalSpriteData({
  resolveRepository,
  storage,
  discardPendingSaves,
}: ClearLocalSpriteDataDeps): Promise<void> {
  try {
    await discardPendingSaves?.()
  } catch (error) {
    console.error('Failed to cancel the pending autosave before the local wipe', error)
  }
  try {
    const { repository } = await resolveRepository()
    await repository.clear()
  } catch (error) {
    console.error('Failed to clear the stored sprite documents after account deletion', error)
  }
  for (const key of [OPEN_SPRITE_ASSET_STORAGE_KEY, DRAFT_MIGRATION_ASSET_STORAGE_KEY]) {
    try {
      storage.removeItem(key)
    } catch (error) {
      console.error(`Failed to clear "${key}" after account deletion`, error)
    }
  }
}

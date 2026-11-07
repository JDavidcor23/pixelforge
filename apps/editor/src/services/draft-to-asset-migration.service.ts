import type { PixelBuffer } from '@/types'
import type { DocumentAssetsApi, DocumentId, DocumentRepository } from '@/types/document'
import { DRAFT_MIGRATION_ASSET_STORAGE_KEY, LOCAL_DRAFT_DOCUMENT_ID } from '@/constants/persistence'
import { documentHasContent, documentPreview } from '@/lib/document-preview'
import { nextUntitledName } from '@/lib/untitled-name'

/** The first frame is the Assets preview of a migrated draft — the old draft kept no current-frame index. */
const MIGRATED_PREVIEW_FRAME_INDEX = 0

export interface DraftMigrationDeps {
  readonly repository: DocumentRepository
  readonly assets: DocumentAssetsApi
  /** Holds the migration marker (`DRAFT_MIGRATION_ASSET_STORAGE_KEY`). */
  readonly storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
  readonly encodePng: (pixels: PixelBuffer) => string
}

const writeMarker = (storage: DraftMigrationDeps['storage'], assetId: DocumentId) => {
  try {
    storage.setItem(DRAFT_MIGRATION_ASSET_STORAGE_KEY, assetId)
  } catch (error) {
    console.error('Failed to record the draft migration marker', error)
  }
}

/**
 * ADR 0015, one-time: moves the phase-1 hidden `local-draft` into Assets.
 *
 * - No draft: nothing to do.
 * - Empty draft (every pixel transparent): removed, no asset — blank
 *   "Untitled" items must not pile up.
 * - Draft with content: the draft's document is saved under a new id, and
 *   only AFTER that save resolves is the "Untitled N" drawing added and the
 *   draft removed. A failed save adds no asset, keeps the draft and rethrows,
 *   so the next load retries and nothing is lost.
 * - A run interrupted between the save and the remove left a marker with the
 *   asset id: the retry only removes the draft and returns that same id.
 *
 * Returns the id of the asset now holding the draft, or `null`.
 */
export async function migrateDraftToAsset(deps: DraftMigrationDeps): Promise<DocumentId | null> {
  const { repository, assets, storage, encodePng } = deps

  const draft = await repository.load(LOCAL_DRAFT_DOCUMENT_ID)
  if (!draft) return null

  const markedId = storage.getItem(DRAFT_MIGRATION_ASSET_STORAGE_KEY)
  if (markedId && (await repository.load(markedId))) {
    await repository.remove(LOCAL_DRAFT_DOCUMENT_ID)
    storage.removeItem(DRAFT_MIGRATION_ASSET_STORAGE_KEY)
    return markedId
  }

  if (!documentHasContent(draft.payload)) {
    await repository.remove(LOCAL_DRAFT_DOCUMENT_ID)
    return null
  }

  // The document is stored BEFORE the Assets item exists: a failed write then
  // leaves Assets untouched, and nothing was evicted from a full library to
  // make room for an asset that never got stored.
  const assetId = crypto.randomUUID()
  await repository.save({ id: assetId, revision: draft.revision, updatedAt: Date.now(), payload: draft.payload })
  const { generations, addDrawing } = assets.getState()
  addDrawing({
    id: assetId,
    prompt: nextUntitledName(generations.map((g) => g.prompt)),
    ...documentPreview(draft.payload, MIGRATED_PREVIEW_FRAME_INDEX, encodePng),
  })

  writeMarker(storage, assetId)
  await repository.remove(LOCAL_DRAFT_DOCUMENT_ID)
  storage.removeItem(DRAFT_MIGRATION_ASSET_STORAGE_KEY)
  return assetId
}

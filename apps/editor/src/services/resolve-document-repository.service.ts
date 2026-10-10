import { createIndexedDbDocumentRepository } from './indexeddb-document.repository.service'
import { createInMemoryDocumentRepository } from './in-memory-document.repository.service'
import { LOCAL_DRAFT_DOCUMENT_ID } from '@/constants/persistence'
import type { DocumentRepository } from '@/types/document'

export interface ResolvedDocumentRepository {
  readonly repository: DocumentRepository
  /** `false` when IndexedDB failed to open — drafts will not be saved this session. */
  readonly isPersistent: boolean
}

/**
 * Tries IndexedDB first; a real open failure (private browsing, quota,
 * disabled storage) falls back to an in-memory repository so editing still
 * works — nothing persists across reloads (pixel-core "Storage unavailable").
 */
export async function resolveDocumentRepository(): Promise<ResolvedDocumentRepository> {
  try {
    const repository = createIndexedDbDocumentRepository()
    // Exercise the DB once so an open failure surfaces here, not on first autosave.
    await repository.load(LOCAL_DRAFT_DOCUMENT_ID)
    return { repository, isPersistent: true }
  } catch (error) {
    console.error('IndexedDB unavailable — drafts will not be saved this session.', error)
    return { repository: createInMemoryDocumentRepository(), isPersistent: false }
  }
}

import type { DocumentId, DocumentRepository, StoredDocument } from '@/types/document'

/**
 * In-memory `DocumentRepository`. Used by tests, and as the runtime fallback
 * when IndexedDB fails to open (the editor then shows a "drafts are not
 * saved" notice — editing still works, nothing persists across reloads).
 */
export function createInMemoryDocumentRepository(): DocumentRepository {
  const store = new Map<DocumentId, StoredDocument>()

  return {
    async load(id: DocumentId): Promise<StoredDocument | null> {
      return store.get(id) ?? null
    },

    async save(doc: StoredDocument): Promise<void> {
      store.set(doc.id, doc)
    },

    async remove(id: DocumentId): Promise<void> {
      store.delete(id)
    },
  }
}

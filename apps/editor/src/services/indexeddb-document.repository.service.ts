import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

import type { DocumentId, DocumentRepository, StoredDocument } from '@/types/document'
import {
  DOCUMENT_DB_NAME,
  DOCUMENT_DB_VERSION,
  DOCUMENT_STORE_NAME,
} from '@/constants/persistence'

interface PixelForgeDB extends DBSchema {
  [DOCUMENT_STORE_NAME]: {
    key: DocumentId
    value: StoredDocument
  }
}

/**
 * IndexedDB-backed `DocumentRepository` (D8, D12). Drafts are stored as
 * native binary (`Uint8Array` per layer via structured clone) — no base64,
 * no JSON stringify of pixel data. One versioned `upgrade` creates the
 * `drafts` object store, keyed by `id`.
 *
 * `openDB` is called once per repository instance and the resulting promise
 * is reused for every operation, so callers never race the upgrade.
 */
export function createIndexedDbDocumentRepository(): DocumentRepository {
  const dbPromise: Promise<IDBPDatabase<PixelForgeDB>> = openDB<PixelForgeDB>(
    DOCUMENT_DB_NAME,
    DOCUMENT_DB_VERSION,
    {
      upgrade(db) {
        if (!db.objectStoreNames.contains(DOCUMENT_STORE_NAME)) {
          db.createObjectStore(DOCUMENT_STORE_NAME, { keyPath: 'id' })
        }
      },
    }
  )

  return {
    async load(id: DocumentId): Promise<StoredDocument | null> {
      const db = await dbPromise
      const doc = await db.get(DOCUMENT_STORE_NAME, id)
      return doc ?? null
    },

    async save(doc: StoredDocument): Promise<void> {
      const db = await dbPromise
      await db.put(DOCUMENT_STORE_NAME, doc)
    },

    async remove(id: DocumentId): Promise<void> {
      const db = await dbPromise
      await db.delete(DOCUMENT_STORE_NAME, id)
    },
  }
}

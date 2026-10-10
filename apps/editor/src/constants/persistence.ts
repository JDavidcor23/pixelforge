/** Phase 1 uses exactly one local draft — multi-document support is out of scope. */
export const LOCAL_DRAFT_DOCUMENT_ID = 'local-draft'

/** Autosave debounce: how long to wait after the last edit before writing to IndexedDB. */
export const DOCUMENT_AUTOSAVE_DEBOUNCE_MS = 800

/** Bump when `DocumentPayload`'s shape changes in a way old drafts can't satisfy. */
export const DOCUMENT_SCHEMA_VERSION = 1

/** IndexedDB database + object store names for the document repository. */
export const DOCUMENT_DB_NAME = 'pixelforge'
export const DOCUMENT_DB_VERSION = 1
// `as const`: idb's DBSchema keys the object store map by this literal type.
export const DOCUMENT_STORE_NAME = 'drafts' as const

/** Legacy pre-phase-1 zustand `persist` key (`RgbaColor[][]`, no `version`). */
export const LEGACY_SPRITE_EDITOR_STORAGE_KEY = 'sprite-editor-core'

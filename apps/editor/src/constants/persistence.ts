/**
 * Phase 1's single hidden draft. ADR 0015 replaced it with one document per
 * sprite asset (keyed by the asset id); this id is only read once more, by
 * `draft-to-asset-migration.service.ts`, to move an old draft into Assets.
 */
export const LOCAL_DRAFT_DOCUMENT_ID = 'local-draft'

/** ADR 0015: localStorage key holding the id of the sprite asset Sprite Studio has open, so a reload reopens it. */
export const OPEN_SPRITE_ASSET_STORAGE_KEY = 'sprite-editor-open-asset'

/**
 * ADR 0015 draft migration marker: the asset id the old `local-draft` was
 * saved under, kept until the draft is removed, so a run interrupted between
 * the save and the remove never creates a second asset.
 */
export const DRAFT_MIGRATION_ASSET_STORAGE_KEY = 'sprite-editor-draft-migration-asset'

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

/**
 * zustand `persist` keys — one per store. Two stores on the same key overwrite
 * each other on every write (the document store used to share
 * `sprite-editor-prefs` and wiped the saved API key on each edit).
 */
export const PREFS_STORAGE_KEY = 'sprite-editor-prefs'
export const SPRITE_EDITOR_STORAGE_KEY = 'sprite-editor-colors'
/**
 * AI jobs store — sessionStorage, not localStorage, and only the pending
 * Animate job: a PixelLab job keeps running (and is billed) after a reload,
 * so its id must survive the reload for polling to resume (ADR 0009).
 */
export const AI_JOBS_STORAGE_KEY = 'sprite-editor-ai-jobs'

/**
 * Animation job ledger — localStorage (survives tab close), one entry per
 * submitted PixelLab job. PixelLab cannot list jobs, so a lost id is a lost
 * paid generation. Entries are tiny (no frames).
 */
export const ANIMATION_JOB_LEDGER_STORAGE_KEY = 'sprite-editor-animation-job-ledger'
/** Settled entries (completed/recovered/failed) kept beyond this are pruned, oldest first. Unfinished ones never are. */
export const ANIMATION_JOB_LEDGER_SETTLED_LIMIT = 50

/**
 * Assets library (AI generations + animations). Its own IndexedDB database, not
 * a store inside `DOCUMENT_DB_NAME`: bumping that DB's version would block on
 * the document repository's open connection. Replaces the old localStorage
 * history (~5 MB quota, 10 entries) — see `assets.store.ts`'s `hydrate`.
 */
export const ASSET_DB_NAME = 'pixelforge-assets'
export const ASSET_DB_VERSION = 1
export const ASSET_GENERATIONS_STORE = 'generations' as const
export const ASSET_ANIMATIONS_STORE = 'animations' as const
/** Per kind (generations and animations each). */
export const ASSET_LIBRARY_LIMIT = 200

/**
 * How long the document restore waits for the Assets library to hydrate when the
 * persisted open asset id is not in it yet. Bounded so a library that never loads
 * (IndexedDB blocked, hook not mounted) cannot hold the editor on "Restoring...".
 */
export const ASSET_HYDRATE_WAIT_MS = 5000

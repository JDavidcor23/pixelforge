import type { DocStatus, PixelBuffer, RgbaColor, SaveStatus } from '@/types'
import type { DocumentAssetsApi, DocumentId, DocumentPayload, DocumentRepository, StoredDocument } from '@/types/document'
import { migrateLegacyDraft } from './legacy-draft-migration.service'
import { migrateDraftToAsset } from './draft-to-asset-migration.service'
import { LOCAL_DRAFT_DOCUMENT_ID, OPEN_SPRITE_ASSET_STORAGE_KEY } from '@/constants/persistence'
import { SPRITE_EDITOR_CANVAS } from '@/constants'
import { blankDocument, createUntitledSprite, documentFromPixels, documentPreview } from '@/lib/document-preview'
import { resolveCoreImpl } from '@/lib/core/core-config'
import { waitForWasmModule } from '@/lib/core/wasm-pixel-core-resolver'

/**
 * Framework-agnostic slice of the zustand store API this controller needs —
 * deliberately NOT importing `useSpriteEditorStore` directly, so this whole
 * lifecycle is testable with a plain fake store and fake timers, no React
 * rendering or jsdom required.
 *
 * Phase 2 (D14): the payload producer/consumer changed from
 * `storeStateToPayload`/`payloadToStoreState` (phase 1's
 * `lib/document-payload.ts`, now removed) to `core.exportDocument()` /
 * `core.importDocument()` (`stores/slices/core.slice.ts`) — the repository
 * and adapters underneath are untouched. The autosave trigger changed from
 * watching `layers`/`timeline` reference identity to watching
 * `docRevision`, which `dispatch` bumps on every document-content change.
 */
export interface DocumentPersistenceStoreApi {
  getState: () => { docStatus: DocStatus; docRevision: number }
  setState: (
    patch: Partial<{
      docStatus: DocStatus
      primaryColor: RgbaColor
      secondaryColor: RgbaColor
      /** Batch 4 — visible save status (TopBar). See `scheduleSave`/`save` below for the transitions. */
      saveStatus: SaveStatus
      lastSavedAt: number
      saveError: string | null
    }>
  ) => void
  subscribe: (listener: (state: { docRevision: number }) => void) => () => void
  exportDocument: () => DocumentPayload
  importDocument: (payload: DocumentPayload) => void
}

/**
 * Module-scope (not per-call) revision counter (phase 2c fix). The zustand
 * store is a page-lifetime singleton, so a "remount" (component unmount +
 * remount WITHOUT a full page reload — e.g. navigating the editor shell
 * away and back) calls `startDocumentPersistence` again with a brand new,
 * EMPTY local closure. Without a module-scope counter, that fresh closure's
 * `revision` would restart at 0 and the next autosave would overwrite the
 * repository with a document stamped at a revision OLDER than what was
 * already saved. Tracking it here instead keeps autosave revision numbers
 * monotonic across remounts within the same session.
 */
let sessionRevision = 0

/**
 * ADR 0015: binds the document to the OPEN SPRITE ASSET instead of one fixed
 * hidden draft. Everything browser-only is injected (PNG encode/decode,
 * localStorage), so the controller stays testable in node.
 */
export interface DocumentAssetBinding {
  /** `useAssetsStore` (or a fake): creates, updates and opens sprite assets. */
  readonly assets: DocumentAssetsApi
  /** Keeps the open asset id across reloads (`OPEN_SPRITE_ASSET_STORAGE_KEY`) and the draft migration marker. */
  readonly openAssetStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
  /** The frame the user is looking at — the one flattened into the asset's PNG preview. */
  readonly currentFrameIndex: () => number
  readonly encodePng: (pixels: PixelBuffer) => string
  /** Decodes an asset's PNG, for an asset that has no stored document yet (e.g. an AI generation). */
  readonly decodePng: (base64: string) => Promise<PixelBuffer>
}

export interface DocumentPersistenceDeps {
  resolveRepository: () => Promise<{ repository: DocumentRepository; isPersistent: boolean }>
  storage: Pick<Storage, 'getItem' | 'removeItem'>
  store: DocumentPersistenceStoreApi
  debounceMs: number
  scheduleTimeout: (fn: () => void, ms: number) => unknown
  clearScheduledTimeout: (handle: unknown) => void
  onPersistentChange: (isPersistent: boolean) => void
  /**
   * Judgment-day round 2 (finding 8): polled at every checkpoint before a
   * side-effecting step (migration, restore/import, subscribing autosave).
   * Lets the caller (`useDocumentPersistence.hook.ts`) signal "this effect
   * instance was already cleaned up" from OUTSIDE this async function —
   * something the OLD code could never observe mid-flight, since the only
   * way to stop a call was through the `DocumentPersistenceController` it
   * returns, which does not exist until the whole async function has
   * already finished running (including migration/import!). Because
   * cancellation is tracked by the CALLER (a plain closure variable flipped
   * synchronously by React's effect cleanup), it reflects the truth
   * regardless of which of two concurrent calls' `resolveRepository()`
   * happens to resolve first — no extra queueing/serialization needed here.
   * Optional for backward compatibility with callers that don't need it
   * (e.g. this file's own tests, which never remount).
   */
  isCancelled?: () => boolean
  /**
   * ADR 0015. Without it the controller keeps phase 1's single document
   * under `LOCAL_DRAFT_DOCUMENT_ID` — only the autosave-core tests that
   * predate the asset model run that way; the editor always passes one.
   */
  assetBinding?: DocumentAssetBinding
}

export interface DocumentPersistenceController {
  /** Cancels any pending debounce and saves immediately (visibilitychange -> hidden). */
  flush: () => void
  /** Unsubscribes and cancels any pending debounce. Call on unmount. */
  stop: () => void
  /**
   * ADR 0015: saves the current asset's pending edits, then opens asset `id`
   * (its stored document, or one built from its PNG). Resolves `false` and
   * changes nothing when `id` has neither, or without an asset binding.
   */
  openAsset: (id: DocumentId) => Promise<boolean>
  /** ADR 0015: saves pending edits, then starts a blank default-size sprite with no open asset (stored on its first edit). */
  newSprite: () => void
}

const NOOP_CONTROLLER: DocumentPersistenceController = {
  flush: () => {},
  stop: () => {},
  openAsset: async () => false,
  newSprite: () => {},
}

/**
 * Orchestrates the document lifecycle (D8): resolve a repository, run the
 * one-time migrations (pre-phase-1 localStorage draft, then ADR 0015's
 * `local-draft` → Assets item), restore the open asset and hydrate the store, flip
 * `docStatus` to `'ready'`, and ONLY THEN start the debounced autosave
 * subscription. This ordering is the whole point — starting autosave before
 * restore finishes would overwrite a real draft with the store's blank
 * initial state (pixel-core "Restore runs before autosave").
 */
export async function startDocumentPersistence(
  deps: DocumentPersistenceDeps
): Promise<DocumentPersistenceController> {
  const {
    resolveRepository,
    storage,
    store,
    debounceMs,
    scheduleTimeout,
    clearScheduledTimeout,
    onPersistentChange,
    isCancelled,
    assetBinding,
  } = deps

  let stopped = false
  let timer: unknown = null
  let repository: DocumentRepository | null = null
  // judgment-day round 2 (finding 8): `flush()` must be a no-op when
  // nothing is pending/dirty — previously it called `save()`
  // unconditionally, so e.g. a `visibilitychange` fired with no edits since
  // the last save still wrote to the repository.
  let dirty = false
  // ADR 0015: `importDocument` resets `docRevision` to 0, which the autosave
  // subscription would otherwise read as an edit and re-save content that
  // was just loaded, unchanged.
  let importing = false
  // Bumped by every open/new request, so a slow `openAsset` load that a
  // later request superseded never imports over it.
  let openRequest = 0

  const bailedOut = () => stopped || (isCancelled?.() ?? false)

  /** The document id autosave writes to: the open asset, or `null` for a new sprite not stored yet (lazy creation). */
  const currentDocumentId = (): DocumentId | null =>
    assetBinding ? assetBinding.assets.getState().openAssetId : LOCAL_DRAFT_DOCUMENT_ID

  const setOpenAsset = (binding: DocumentAssetBinding, id: DocumentId | null) => {
    binding.assets.getState().setOpenAssetId(id)
    try {
      if (id) binding.openAssetStorage.setItem(OPEN_SPRITE_ASSET_STORAGE_KEY, id)
      else binding.openAssetStorage.removeItem(OPEN_SPRITE_ASSET_STORAGE_KEY)
    } catch (error) {
      console.error('Failed to remember the open sprite asset', error)
    }
  }

  /**
   * Resolves the asset this save writes to — creating "Untitled N" on the
   * first save of a new sprite (ADR 0015 lazy creation) — and returns the
   * Assets-preview refresh to run once the document is stored. A freshly
   * created asset already holds that preview, so it has none.
   */
  const resolveSaveTarget = (
    payload: DocumentPayload
  ): { readonly id: DocumentId; readonly refreshPreview: (() => void) | null } => {
    if (!assetBinding) return { id: LOCAL_DRAFT_DOCUMENT_ID, refreshPreview: null }
    const preview = documentPreview(payload, assetBinding.currentFrameIndex(), assetBinding.encodePng)
    const openId = currentDocumentId()
    if (openId) {
      return { id: openId, refreshPreview: () => assetBinding.assets.getState().updateDrawingContent(openId, preview) }
    }
    const created = createUntitledSprite(assetBinding.assets, preview)
    setOpenAsset(assetBinding, created.id)
    return { id: created.id, refreshPreview: null }
  }

  /** Loads `payload` into the core without the autosave subscription treating it as an edit. */
  const importQuietly = (payload: DocumentPayload) => {
    importing = true
    try {
      store.importDocument(payload)
    } finally {
      importing = false
    }
    if (timer !== null) {
      clearScheduledTimeout(timer)
      timer = null
    }
    dirty = false
  }

  const adoptRevision = (stored: StoredDocument) => {
    sessionRevision = Math.max(sessionRevision, stored.revision)
  }

  // Phase 2c fix: `save()` used to be fire-and-forget (`void repository
  // .save(...)`), so a rejected save (e.g. `QuotaExceededError`) became an
  // unhandled promise rejection and the UI never found out persistence had
  // stopped working. Now it's caught, logged, and reflected via
  // `onPersistentChange(false)` — the SAME "drafts are not being saved"
  // notice `SpriteEditorLayout` already renders for the IndexedDB-unavailable
  // case, so no new UI was needed.
  const save = () => {
    if (!repository || stopped) return
    dirty = false
    sessionRevision += 1
    const revision = sessionRevision
    const payload = store.exportDocument()
    const target = resolveSaveTarget(payload)
    repository
      .save({ id: target.id, revision, updatedAt: Date.now(), payload })
      .then(() => {
        target.refreshPreview?.()
        store.setState({ saveStatus: 'saved', lastSavedAt: Date.now(), saveError: null })
      })
      .catch((error: unknown) => {
        console.error('Failed to save document draft', error)
        onPersistentChange(false)
        store.setState({ saveStatus: 'error', saveError: error instanceof Error ? error.message : String(error) })
      })
  }

  const flush = () => {
    if (timer !== null) {
      clearScheduledTimeout(timer)
      timer = null
    }
    if (!dirty) return
    save()
  }

  const scheduleSave = () => {
    dirty = true
    // Batch 4: flip to "Saving…" the moment an edit is pending, not just
    // while `repository.save()`'s own promise is in flight — the debounce
    // window itself is part of what the owner asked to make visible.
    store.setState({ saveStatus: 'saving' })
    if (timer !== null) clearScheduledTimeout(timer)
    timer = scheduleTimeout(() => {
      timer = null
      save()
    }, debounceMs)
  }

  const resolved = await resolveRepository()
  if (bailedOut()) return NOOP_CONTROLLER
  repository = resolved.repository
  onPersistentChange(resolved.isPersistent)

  // Phase 2c fix: `docStatus` doubles as the "already hydrated THIS
  // SESSION" flag the architecture decision asked for. The zustand store is
  // a page-lifetime singleton, so a remount (unmount + remount WITHOUT a
  // full page reload) sees `docStatus` still `'ready'` from the PRIOR
  // mount's restore — in that case the core may already hold edits newer
  // than whatever is in the repository (e.g. a debounced save that hadn't
  // fired yet when the component unmounted), so re-running migration/
  // restore and `importDocument`-ing the stored draft over it would
  // silently roll those edits back (`persist.judge.test.ts`'s "remount
  // within debounce window loses last stroke" regression test). Skip
  // straight to subscribing autosave instead.
  const alreadyHydrated = store.getState().docStatus === 'ready'

  if (!alreadyHydrated) {
    // judgment-day round 2 (finding 8): bail BEFORE migration/import if this
    // call was already cancelled. React StrictMode's dev-only
    // mount/cleanup/mount runs synchronously — by the time THIS call's
    // `resolveRepository()` resolves (the first point it can check
    // `isCancelled`), a stale first-mount's cleanup has already flipped its
    // own `cancelled` flag, so it bails HERE, before ever touching
    // migration/restore/import — whichever of the two concurrent calls is
    // still "live" is the only one that reaches `migrateLegacyDraft`/
    // `importDocument`, regardless of which one's `resolveRepository()`
    // happens to resolve first.
    if (bailedOut()) return NOOP_CONTROLLER

    const migration = await migrateLegacyDraft(repository, storage)
    if (bailedOut()) return NOOP_CONTROLLER
    if (migration.colors) {
      store.setState({ primaryColor: migration.colors.primaryColor, secondaryColor: migration.colors.secondaryColor })
    }

    // ADR 0015: the old hidden draft becomes an Assets item (once), then the
    // asset that was open before the reload is restored. A persisted id
    // with no stored document starts blank with no open asset.
    let restoreId: DocumentId | null = LOCAL_DRAFT_DOCUMENT_ID
    if (assetBinding) {
      const migratedId = await migrateDraftToAsset({
        repository,
        assets: assetBinding.assets,
        storage: assetBinding.openAssetStorage,
        encodePng: assetBinding.encodePng,
      })
      if (bailedOut()) return NOOP_CONTROLLER
      restoreId = migratedId ?? assetBinding.openAssetStorage.getItem(OPEN_SPRITE_ASSET_STORAGE_KEY)
    }

    const stored = restoreId ? await repository.load(restoreId) : null
    if (bailedOut()) return NOOP_CONTROLLER
    if (assetBinding) setOpenAsset(assetBinding, stored ? stored.id : null)

    // Phase 7f (CRITICAL #1 — "the flag is dead"): `core.slice.ts`'s `core`
    // is bootstrapped lazily, exactly once, the FIRST time anything touches
    // it — either `store.importDocument` right below (when a draft exists)
    // or the user's first `dispatch` after `docStatus` flips to `'ready'`
    // (when it doesn't). Awaiting the Wasm module HERE, before either of
    // those can happen, is what makes `pf:core=wasm`/`VITE_PIXEL_CORE=wasm`
    // actually take effect: without this, that first bootstrap always races
    // ahead of the background `loadWasmModule()` and permanently falls back
    // to `TsPixelCore` for the whole session. The `'ts'` default path is
    // untouched — `waitForWasmModule()` is never even called.
    if (resolveCoreImpl() === 'wasm') await waitForWasmModule()
    if (bailedOut()) return NOOP_CONTROLLER

    if (stored) {
      adoptRevision(stored)
      store.importDocument(stored.payload)
    }

    // Restore (or the decision there's nothing to restore) is done — only
    // now is it safe to start autosave.
    store.setState({ docStatus: 'ready' })
  }

  if (bailedOut()) return NOOP_CONTROLLER

  let prevDocRevision = store.getState().docRevision
  const unsubscribe = store.subscribe((state) => {
    if (state.docRevision !== prevDocRevision) {
      prevDocRevision = state.docRevision
      if (!importing) scheduleSave()
    }
  })

  const openAsset = async (id: DocumentId): Promise<boolean> => {
    if (!assetBinding || !repository || stopped) return false
    const request = ++openRequest
    // Save the current asset BEFORE anything else: its pending edits must
    // land under its own id, never be dropped or written to `id`.
    flush()
    try {
      const stored = await repository.load(id)
      let payload = stored?.payload ?? null
      if (!payload) {
        const asset = assetBinding.assets.getState().generations.find((entry) => entry.id === id)
        if (!asset) return false
        payload = documentFromPixels(await assetBinding.decodePng(asset.base64))
      }
      if (request !== openRequest || stopped) return false
      if (stored) adoptRevision(stored)
      // Edits made while loading still belong to the previous asset.
      flush()
      importQuietly(payload)
      setOpenAsset(assetBinding, id)
      return true
    } catch (error) {
      console.error('Failed to open sprite asset', error)
      return false
    }
  }

  const newSprite = () => {
    if (!assetBinding || stopped) return
    openRequest += 1
    flush()
    importQuietly(blankDocument(SPRITE_EDITOR_CANVAS.DEFAULT_WIDTH, SPRITE_EDITOR_CANVAS.DEFAULT_HEIGHT))
    setOpenAsset(assetBinding, null)
  }

  return {
    flush,
    openAsset,
    newSprite,
    stop: () => {
      unsubscribe()
      // Phase 2c fix: FLUSH a pending debounced save instead of dropping it
      // — silently losing the last `debounceMs` worth of edits on unmount
      // was the other half of the "remount loses last stroke" bug (the
      // save that would have captured them never ran). This MUST run
      // before `stopped = true` below — `save()` is a no-op once stopped.
      if (timer !== null) {
        clearScheduledTimeout(timer)
        timer = null
        save()
      }
      stopped = true
    },
  }
}

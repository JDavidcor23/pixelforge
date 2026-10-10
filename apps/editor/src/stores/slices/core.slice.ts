import type { StateCreator } from 'zustand'

import type { Layer, Timeline } from '@/types'
import type { SpriteEditorStore } from '@/types'
import type { DocumentPayload } from '@/types/document'
import type { Command, DispatchResult } from '@/lib/core/commands'
import { createEmptyBuffer } from '@/lib/pixel-buffer'
import type { DocSnapshot } from '@/lib/core/ts-core'
import { resolveCore } from '@/lib/core/core-config'
import type { DocMetaSnapshot, FrameMeta, LayerMeta, PixelCore } from '@/lib/core/pixel-core'
import { requestImmediateFlush } from '@/services/document-persistence-flush-bus.service'

import type { CoreSlice } from '../types/slices'

/**
 * Wasm-boundary blocker B3 (closed — design.md "Pixel cache contract"):
 * `PixelCore.snapshot()` is metadata-only now, so this slice keeps a
 * `Map<layerId, Uint8ClampedArray>` pixel cache — keyed GLOBALLY by layer id
 * (safe: `frame.paste`/`doc.replace` always mint fresh ids, and
 * `payloadToDoc` de-duplicates any id collision on import — see
 * `ts-core.ts`), refreshed from `readLayer` and immediately COPIED (the
 * view is only valid until the next dispatch, design D7) — never read off
 * `core`'s TS-internal state. This is what lets onion-skin rendering, the
 * eyedropper, selection/clipboard, export and persistence keep reading
 * `layer.pixels` off the store completely unchanged: `buildTimeline` below
 * rebuilds the full `Timeline` (every frame, every layer) from the
 * metadata `snapshot()` returns PLUS this cache on every dispatch that
 * changes the document.
 *
 * C1 fix (phase 4f — judgment-day): refresh/evict are now driven ENTIRELY by
 * `DispatchResult.dirty`/`.evicted` — explicit `(frameId, layerId)` pairs the
 * core computes itself, never by this slice guessing "the dirty layer
 * belongs to whatever frame is current after this dispatch". That guess was
 * the root cause of a real cache-poisoning bug: a command that both (a)
 * force-commits an open stroke bound to the OLD current frame and (b) moves
 * "current" to a DIFFERENT frame in the SAME dispatch (e.g. `frame.add` while
 * a stroke is open) used to read the stroke's dirty layer id back from the
 * NEW current frame instead of the frame it was actually drawn on — either
 * silently aliasing the wrong frame's bytes onto that layer id, or (if the
 * two frames don't happen to share that id) caching a 0-byte miss. Every
 * `ts-core.ts` dirty-producing path now tags its OWN frame id, so this slice
 * no longer needs to special-case any command by type — structural commands
 * (`frame.add`/`layer.add`/`frame.paste`/`doc.replace`) report dirty pairs
 * for every layer they create, `frame.remove`/`layer.remove` report
 * `evicted` pairs for every layer they delete, and `undo`/`redo` report the
 * EXACT pairs the popped history entry touched (W8: no more "refresh every
 * layer of every frame" sweep on every undo/redo).
 */

/**
 * Owns the document (phase 2, D3): `dispatch` is the single entry point for
 * every undoable mutation.
 *
 * Phase 2f (Wasm-boundary blocker B1, decision): the slice holds a
 * `PixelCore` instance (from `resolveCore()`) and calls ONLY its interface
 * methods — `dispatch`/`undo`/`redo`/`exportDocument`/`importDocument`/
 * `snapshot` — never the TS-internal `dispatchCommand`/`createCoreState`
 * functions directly. Swapping `resolveCore()`'s implementation (phase 4+: a
 * `WasmPixelCore`) needs no change here. `layerRevisions` crosses the
 * boundary as part of `DispatchResult` (B2, `commands.ts`) — never read off
 * `core`'s TS-internal state.
 *
 * `buildTimeline`/`buildLayer` below rebuild the store's `layers`/
 * `timeline.frames[*].layers` from `snapshot()`'s metadata plus the pixel
 * cache on every dispatch — the ONLY readers of `DocMetaSnapshot` in this
 * file; nothing here reaches for TS-internal `CoreState`.
 *
 * The `core` instance below is NOT zustand state (a class/closure holding
 * `Uint8Array` history patches shouldn't round-trip through zustand's
 * immutable-update machinery) — it lives in this slice creator's closure,
 * bootstrapped exactly ONCE, lazily, from whatever the store's initial state
 * happens to be at first use (`ensureCore`). From that point on, `core` is
 * the ONLY writer; zustand's `layers`/`activeLayerId`/`timeline`/
 * `canvasWidth`/`canvasHeight` fields are a strictly one-way (core ->
 * zustand), read-only DERIVED cache written back after each dispatch —
 * never read FROM again. `importDocument` is the one explicit "replace the
 * whole document" path, and it always rebuilds `core` from scratch.
 *
 * This means a test can no longer seed the document via
 * `useSpriteEditorStore.setState({ timeline, layers, ... })` and expect the
 * next `dispatch` to pick it up — tests seed through the core API instead,
 * via `importDocument(payload)` (see `lib/core/test-helpers.ts`'s
 * `timelineToDocumentPayload`), the same path production code uses to
 * restore a draft.
 */
export const createCoreSlice: StateCreator<
  SpriteEditorStore,
  [['zustand/persist', unknown]],
  [],
  CoreSlice
> = (set, get) => {
  let core: PixelCore | null = null
  /** layerId -> pixel bytes, GLOBAL across every frame (see module doc). Never read/written outside this slice. */
  const pixelCache = new Map<string, Uint8ClampedArray>()

  /**
   * C1 fix: refreshes exactly the ONE (frameId, layerId) pair the caller
   * asks for — never "whatever frame happens to be current". Returns
   * `false` (and leaves the PREVIOUS cache entry untouched) if `readLayer`'s
   * result isn't exactly `w*h*4` bytes — that shape mismatch is itself a
   * bug signal (a stale/mid-transition core, a corrupted import that slipped
   * past `payloadToDoc`'s own validation), never something to cache and
   * render as-is. The caller (`dispatch` below) treats a `false` return as
   * "the targeted refresh can't be trusted — fall back to a full sweep".
   */
  const refreshLayer = (c: PixelCore, frameId: string, layerId: string, expectedLength: number): boolean => {
    // `readLayer`'s return is a VIEW valid only until the next dispatch (design D7) — copy it out immediately.
    const view = c.readLayer(frameId, layerId)
    if (view.length !== expectedLength) {
      console.error(
        `[core.slice] readLayer("${frameId}", "${layerId}") returned ${view.length} bytes, expected ${expectedLength} — keeping the previous cache entry and falling back to a full refresh`
      )
      return false
    }
    pixelCache.set(layerId, new Uint8ClampedArray(view))
    return true
  }

  const refreshAllLayers = (c: PixelCore, meta: DocMetaSnapshot): void => {
    const expectedLength = meta.canvasWidth * meta.canvasHeight * 4
    for (const frame of meta.timeline.frames) {
      for (const layer of frame.layers) refreshLayer(c, frame.id, layer.id, expectedLength)
    }
  }

  const evictLayers = (refs: ReadonlyArray<{ readonly layerId: string }>): void => {
    for (const { layerId } of refs) pixelCache.delete(layerId)
  }

  const buildLayer = (meta: LayerMeta, w: number, h: number): Layer => {
    const data = pixelCache.get(meta.id)
    if (!data) {
      console.error(`[core.slice] pixel cache miss for layer "${meta.id}" — rendering a blank buffer`)
    }
    return { ...meta, pixels: { w, h, data: data ?? createEmptyBuffer(w, h).data } }
  }

  const buildTimeline = (meta: DocMetaSnapshot): Timeline => ({
    ...meta.timeline,
    frames: meta.timeline.frames.map((frame: FrameMeta) => ({
      ...frame,
      layers: frame.layers.map((layer) => buildLayer(layer, meta.canvasWidth, meta.canvasHeight)),
    })),
  })

  /**
   * Phase 7f (CRITICAL #2): a `DocSnapshot` built from whatever the store
   * CURRENTLY holds — the metadata + pixel cache written back after the last
   * successful `dispatch`/`importDocument`. This is the recovery source a
   * mid-session Wasm trap rebuilds a `TsPixelCore` from (never the trapped
   * Wasm instance itself — see `wasm-pixel-core-resolver.ts`'s
   * `TrapSafePixelCore` doc). Safe to call at any time, not just during a
   * trap: it never reads from `core`, only from zustand state.
   */
  const getRecoverySnapshot = (): DocSnapshot => {
    const s = get()
    return { canvasWidth: s.canvasWidth, canvasHeight: s.canvasHeight, timeline: s.timeline }
  }

  /** Lazily bootstraps `core` ONCE from the store's state at first use — never re-reads zustand state again after that (see module doc). */
  const ensureCore = (): PixelCore => {
    if (!core) {
      const s = get()
      const doc: DocSnapshot = {
        canvasWidth: s.canvasWidth,
        canvasHeight: s.canvasHeight,
        timeline: s.timeline,
      }
      core = resolveCore(doc, getRecoverySnapshot)
      // Warm the pixel cache straight from the SAME zustand state `doc` was
      // just seeded with — these are the live `Layer.pixels` objects already
      // in hand, so no `readLayer` round-trip is needed at bootstrap.
      pixelCache.clear()
      for (const frame of s.timeline.frames) {
        for (const layer of frame.layers) pixelCache.set(layer.id, layer.pixels.data)
      }
    }
    return core
  }

  return {
    docRevision: 0,
    canUndo: false,
    canRedo: false,
    isStrokeOpen: false,
    layerRevisions: {},

    dispatch: (cmd: Command) => {
      const c = ensureCore()
      let result: DispatchResult
      try {
        result = c.dispatch(cmd)
      } catch (error) {
        // Phase 7f (CRITICAL #2): `c` is a trap-safe wrapper — ANY exception
        // means it already demoted itself to a recovered `TsPixelCore`
        // internally (see `wasm-pixel-core-resolver.ts`) before rethrowing.
        // THIS command is not applied (its effect is lost, not replayed),
        // but everything dispatched successfully before it is preserved —
        // the recovered core was rebuilt from exactly that content. Sync the
        // store from the recovered core, flush autosave immediately (undo
        // history was just dropped; don't wait out the debounce), and
        // degrade gracefully instead of throwing further (there is no
        // `ErrorBoundary` anywhere in this app to catch it).
        console.error('[core.slice] dispatch failed and the core recovered — this command was not applied; undo history was reset.', error)
        requestImmediateFlush()
        const meta = c.snapshot()
        const timeline = buildTimeline(meta)
        const frame = timeline.frames[timeline.currentFrameIndex]
        set({
          canvasWidth: meta.canvasWidth,
          canvasHeight: meta.canvasHeight,
          layers: frame.layers,
          activeLayerId: frame.activeLayerId,
          timeline,
          canUndo: c.canUndo,
          canRedo: c.canRedo,
          isStrokeOpen: false,
          layerRevisions: {},
        })
        return {
          changed: false,
          contentChanged: false,
          historyChanged: true,
          canUndo: c.canUndo,
          canRedo: c.canRedo,
          strokeOpen: false,
          revision: get().docRevision,
          contentRevision: get().docRevision,
          dirty: [],
          evicted: [],
          layerRevisions: {},
        }
      }

      // Phase 2e (task "stop detecting commits by `core.history !== prev.history`
      // reference comparison"): `result.historyChanged` is the explicit
      // replacement. It can be true even when `result.changed` is false — a
      // `stroke.begin` that force-commits an already-open stroke reports
      // `changed:false` for ITSELF (opening a stroke isn't a content change)
      // but DOES push a history entry for the stroke it just closed, so
      // `canUndo`/`canRedo` must still be refreshed.
      if (result.changed || result.historyChanged) {
        const meta = c.snapshot()

        if (result.changed) {
          // C1/W8 fix: refresh/evict EXACTLY the (frameId, layerId) pairs the
          // core itself reported dirty/evicted — no more command-type
          // special-casing (`STRUCTURAL_REFRESH_COMMANDS`) and no more
          // "assume the current frame" guess. `evicted` first, so a pair that
          // is simultaneously evicted-then-redirtied in the same dispatch
          // (cannot happen today, but costs nothing to order defensively)
          // ends up refreshed, not deleted.
          evictLayers(result.evicted)
          // Fix-agent 5f.1: a command that force-commits an open stroke AND
          // deletes that exact (frameId, layerId) pair in the SAME dispatch
          // (`layer.remove`, `frame.remove`, `doc.replace`) reports that pair
          // in BOTH `dirty` (from the force-commit) and `evicted` (from the
          // delete). `evicted` always wins — the pair no longer exists, so
          // there is nothing to refresh, and attempting to (`readLayer`
          // returns a 0-byte view for a gone frame/layer, never throws) used
          // to be misread as cache corruption and triggered an expensive,
          // unnecessary full-document sweep on every one of these commands.
          const evictedKeys = new Set(result.evicted.map((e) => `${e.frameId}:${e.layerId}`))
          const expectedLength = meta.canvasWidth * meta.canvasHeight * 4
          let needsFullRefresh = false
          for (const { frameId, layerId } of result.dirty) {
            if (evictedKeys.has(`${frameId}:${layerId}`)) continue
            if (!refreshLayer(c, frameId, layerId, expectedLength)) needsFullRefresh = true
          }
          if (needsFullRefresh) refreshAllLayers(c, meta)
        }

        set({
          ...(result.changed
            ? (() => {
                const timeline = buildTimeline(meta)
                const frame = timeline.frames[timeline.currentFrameIndex]
                return {
                  canvasWidth: meta.canvasWidth,
                  canvasHeight: meta.canvasHeight,
                  layers: frame.layers,
                  activeLayerId: frame.activeLayerId,
                  timeline,
                }
              })()
            : {}),
          // judgment-day round 2 (finding 5): autosave watches `docRevision`,
          // which must bump ONLY for document-CONTENT changes
          // (`result.contentRevision`), never for view/playback-only
          // commands.
          docRevision: result.contentRevision,
          canUndo: result.canUndo,
          canRedo: result.canRedo,
          layerRevisions: result.layerRevisions,
        })
      }

      // judgment-day round 2 (finding 9): reflected unconditionally, even
      // for a dispatch that reports `changed: false` (e.g. a force-ended
      // stroke with zero net pixel change, or `stroke.begin` itself, which
      // opens a stroke without changing document content) — the explicit
      // `DispatchResult.strokeOpen` field (phase 2e) is the single source
      // for this, never a `core.strokeState !== null` re-check here.
      set({ isStrokeOpen: result.strokeOpen })

      return result
    },

    undo: () => {
      // Bug #3: commit (or cancel) any floating selection into its SOURCE
      // layer/frame BEFORE undo/redo can change which frame/layer is current.
      if (get().selection?.floatingPixels) get().commitTransformation()
      get().dispatch({ type: 'undo' })
    },
    redo: () => {
      if (get().selection?.floatingPixels) get().commitTransformation()
      get().dispatch({ type: 'redo' })
    },

    exportDocument: () => ensureCore().exportDocument(),

    importDocument: (payload: DocumentPayload) => {
      const c = ensureCore()
      c.importDocument(payload)
      const meta = c.snapshot()
      pixelCache.clear()
      refreshAllLayers(c, meta)
      const timeline = buildTimeline(meta)
      const frame = timeline.frames[timeline.currentFrameIndex]
      set({
        canvasWidth: meta.canvasWidth,
        canvasHeight: meta.canvasHeight,
        layers: frame.layers,
        activeLayerId: frame.activeLayerId,
        timeline,
        docRevision: 0,
        canUndo: false,
        canRedo: false,
        isStrokeOpen: false,
        layerRevisions: {},
      })
    },
  }
}

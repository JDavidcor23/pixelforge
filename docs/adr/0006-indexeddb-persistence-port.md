# 0006 — `DocumentRepository` port + IndexedDB adapter

**Status**: Accepted (phase 1)

## Context

Zustand's `persist` middleware wrote `layers`/`timeline`/canvas size straight
to `localStorage` as JSON. A `Uint8ClampedArray` does not round-trip through
`JSON.stringify` (and even if it did, base64-encoding it costs +33% size and
a synchronous encode on every autosave, against a ~5 MB localStorage quota
that large sprites/animations would blow through quickly).

## Decision

- A `DocumentRepository` port (`load`/`save`/`remove`, all `async`) with two
  adapters: `IndexedDbDocumentRepository` (native binary storage via
  structured clone — no base64) and `InMemoryDocumentRepository` (tests, and
  the runtime fallback when IndexedDB fails to open).
- **D13**: `idb` (~1.2 KB gz) over the raw `indexedDB` API — typed `DBSchema`,
  promise-based, versioned `upgrade`, instead of hand-rolling promisification
  with `any`-typed `IDBRequest.result`.
- Zustand `persist` is kept, but narrowed: it only ever holds UI/tool
  preferences (`partialize` excludes layers/timeline/canvas size entirely),
  renamed `sprite-editor-prefs` to make the split unambiguous.
- A one-time, idempotent legacy migration: if the old `sprite-editor-core`
  localStorage key holds a draft, convert it via `rowsToBuffer`, save it to
  IndexedDB, and only remove the legacy key **after** the save resolves (a
  failed save keeps the legacy key so the next load retries).

## Consequences

- Autosave is debounced (800 ms) and gated strictly behind restore completing
  (`docStatus === 'ready'`) — an early autosave would otherwise overwrite a
  real draft with an empty document on first mount.
- If IndexedDB fails to open, the editor falls back to an in-memory
  repository and shows a "drafts are not being saved" notice, rather than
  crashing or silently losing work.
- This port is what makes `supabase-project-sync` (a later, separate change)
  a drop-in second adapter instead of a rewrite — see ADR 0007.

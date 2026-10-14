# 0010 — The canvas is always a named Assets item

**Status**: Accepted (phase 1, **D13**)

## Context

PixelForge has two persistence tracks that don't talk to each other:

1. **The canvas**: a single, fixed-id working draft (`LOCAL_DRAFT_DOCUMENT_ID`,
   ADR 0007), auto-saved to IndexedDB every `DOCUMENT_AUTOSAVE_DEBOUNCE_MS`.
   It has no name — `SPRITE_DOCUMENT_DEFAULT_NAME` ("Untitled sprite") is a
   hardcoded constant, not editable state. ADR 0007 explicitly scoped this
   out: *"multi-document/multi-project support is a separate, later concern"*.
2. **Assets**: a named, typed library (`AssetLibraryItem` — `types/ai-generation.ts:150`,
   already carries `label` and `assetType: AssetType`). Every AI generation
   (`useGeneratePanel.hook.ts`'s `addGeneration`) and every sprite-sheet import
   (`useImportSpriteSheet.hook.ts`'s `addAnimation`) lands here automatically.

The gap: **anything drawn by hand on the canvas has no path into Assets.**
Only AI-generated or imported content ever gets a name and a permanent,
findable slot. The owner's own confusion testing the app (2026-10-14)
confirmed this is a real product problem, not a misunderstanding — he
expected a Photoshop-style `Save As` and found nothing, because for
hand-drawn work nothing like it exists.

## Decision

**The canvas becomes a snapshot source for Assets items, not a separate thing
from them.** A new `Save As…` action (File menu) takes whatever is currently
on the canvas — hand-drawn, imported, or AI-generated — and saves it as a new
named, typed `AssetLibraryItem`, reusing the existing Assets repository
(`indexeddb-asset-library.repository.service.ts`) and the existing
asset-type chips (`ASSET_TYPES` — Character/Object/Weapon/Costume/Effect,
already used by `AssetTypeSelector`).

The hidden singleton draft (`LOCAL_DRAFT_DOCUMENT_ID`) is **not removed** —
it keeps doing exactly what it does today: crash/reload safety net for
whatever is on the canvas right now, regardless of whether it has been
`Save As`'d yet. `Save As` is an explicit, additional action, not a
replacement for autosave.

Renaming or recategorizing an existing Assets item happens through small
icon-button actions on its tile (a "rename" pencil and a "move to" folder
icon), following the hover-icon-button pattern `AssetTile.tsx` already uses
for Delete/Download/Download-source — not a new right-click context-menu or
drag-and-drop pattern, which exists nowhere else in this app today. The owner
asked for a context menu and drag-and-drop; those are deferred to a possible
phase 2 once the icon-button version has been tried, to avoid introducing an
unprecedented interaction pattern in the first pass (see
`docs/sprite-save-as-implementation-plan.md`).

## Consequences

- Hand-drawn sprites become first-class, findable Assets items, closing the
  gap that caused the confusion.
- `AssetLibraryItem.kind` gains a third value alongside `'generation'` /
  `'animation'` for canvas-originated saves (exact name TBD at build time —
  e.g. `'drawing'`).
- No multi-document switching, no tabs, no "currently open document" concept
  yet — `Save As` always creates a new item; updating an already-saved item
  later is a `Save As` again (phase 1) until a tracked "this canvas = this
  asset id" link is worth building (not scoped here).
- `SPRITE_DOCUMENT_DEFAULT_NAME`/"Untitled sprite" in the top bar is
  unaffected by this decision — it still names the hidden autosave draft, not
  an Assets item. A later decision may address whether the top bar should
  instead show the name of the last-saved-as Assets item.
- Context menu / drag-and-drop for Assets items (copy, cut, move between
  categories by dragging) is explicitly deferred, not rejected — tracked as
  phase 2 in the implementation plan, contingent on the owner's reaction to
  phase 1's icon-button version.

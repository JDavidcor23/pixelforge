> AI-generated source notes. Reference material, not the owner's writing.

# Implementation plan — Save As into Assets (ADR 0010)

Branch: its own `feat/sprite-save-as` (per ADR 0010's build pipeline rule —
not part of `feat/sprite-studio-v3-menu`). Pipeline per phase:
frontend-agent → cleancode-agent.

## Phase 1 — `Save As…` creates a named, typed Assets item

**Scope**: File menu gains `Save As…`. Opens a small dialog: name (text,
required) + asset type (the existing `ASSET_TYPES` chips). On confirm,
exports the current canvas (reuse the same pixel/frame export path
`useGeneratePanel`'s `addGeneration` already uses) and adds a new
`AssetLibraryItem` to the Assets store with that name/type and a new `kind`
value for canvas-originated saves.

**Acceptance**:
- Draw something from a blank canvas (no AI, no import), `File > Save As…`,
  name it, pick a type → it appears under that type's filter in the Assets
  grid, survives a page reload (same IndexedDB repository as generations).
- Saving does not touch or depend on the hidden autosave draft — closing the
  tab without `Save As`ing still behaves exactly as it does today (draft
  recovered on reopen, nothing in Assets).
- Existing AI-generation and import saves are unaffected (regression check).

## Phase 2 — Rename and recategorize an existing Assets item

**Scope**: Two new icon buttons on `AssetTile.tsx`'s existing hover row
(next to Delete/Download): a rename pencil (inline text edit or a small
dialog, owner's call at build time) and a "move to" folder icon (reuses the
asset-type chip picker from Phase 1's dialog).

**Acceptance**:
- Rename an existing item, its label updates in the grid and persists.
- Move an item from one type filter (e.g. Characters) to another (e.g.
  Objects); it disappears from the old filter's list and appears in the new
  one, count badges in the left sidebar update.
- Works on items of every `kind` (generation, animation, and the new
  canvas-save kind from Phase 1).

## Phase 3 (not committed yet — revisit after Phase 1/2 ship)

Context menu (right-click: rename, move to, delete, download) and
drag-and-drop between the left sidebar's category rows. Deferred per ADR
0010: this app has no existing right-click-menu or drag-and-drop pattern
anywhere, so it's a new interaction convention, not a reuse of one — worth
doing only if the Phase 2 icon-button version turns out to be too slow in
practice with many assets. Revisit with the owner before building.

## Out of scope (this plan)

- Multi-document switching / tabs / "currently open document" tracking.
- Renaming the hidden autosave draft itself ("Untitled sprite" in the top bar).
- Cloud sync of any of this (ADR 0007 still applies — local-first only).

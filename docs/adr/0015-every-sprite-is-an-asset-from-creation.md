# 0015 — Every sprite is an asset from the moment it is created

**Status**: Accepted
**Date**: 2026-10-28
**Applies to**: apps/editor (Sprite Studio, `/build` deep links), Assets library
**Supersedes**: the hidden single draft and "Save As always creates a copy" parts of ADR 0010

## Context

- Sprite Studio edits exactly one hidden working draft, `LOCAL_DRAFT_DOCUMENT_ID = 'local-draft'`
  (`constants/persistence.ts`), autosaved to IndexedDB. It has no name and no link to any
  Assets item.
- `File > Save As…` (ADR 0010) copies that draft into the Assets library as a new item. The
  draft stays as it was; the copy and the draft never talk again. ADR 0010 already named the
  gap: *"until a tracked 'this canvas = this asset id' link is worth building"*.
- `assets.store.ts` can add, rename, re-type and delete items. It cannot replace the content
  of an existing item.
- ADR 0014 needs both things this model lacks:
  - Phase 4 deep link: "Edit" in the Biblioteca opens `/sprites?asset=<id>`. With one draft
    slot, opening an asset overwrites any unsaved work in it.
  - Phase 3 live sync: an edit must reach the same asset (and bump its revision) so the chat
    chip, the Biblioteca row and the running game update. Today an edit only reaches the draft.
- Product rule from the owner (2026-10-28): "if an asset was created, it was created". Assets
  made from the chat get a name from the AI; assets made in the editor start as "Untitled N",
  like Figma or Photoshop.

**Not measured**: nothing to measure; this is a data-model decision, not a performance one.

## Prior art

| Who | Technique | Result | Source |
|---|---|---|---|
| Figma | Every new file is a real file named "Untitled"; autosave writes to it; rename any time | No separate draft concept | https://help.figma.com/hc/en-us/articles/360038511473-Rename-files-and-folders |
| Google Docs | New document is "Untitled document", saved as you type, no save button | Same | https://support.google.com/docs/answer/49114 |
| Figma users | Blank "Untitled" files pile up when people open and close new files | Known cost of the model | https://forum.figma.com/suggest-a-feature-11/don-t-save-blank-new-files-4828 |
| This repo | Assets library already persists named items in IndexedDB | Storage to reuse | `stores/assets.store.ts` |

## Options considered

| Option | Gain | Lose | Risk |
|---|---|---|---|
| A. Keep the single draft + Save As copy | No change | Deep link overwrites unsaved work; edits never reach the asset, so ADR 0014 phases 3–4 cannot work | Lost user work |
| B. One draft per asset, kept next to the asset | Deep link is safe | Two copies of every asset (draft and saved) that drift; users must still "save" | Confusing "which one is real?" |
| **C. The sprite is the asset from creation (chosen)** | One copy; autosave writes to the asset; opening another asset loses nothing; "edit an asset" exists | Migration of the current draft; a rule for empty files | Low |

## Decision

- **Create = asset.** A new sprite in Sprite Studio becomes an Assets item named
  "Untitled N" (next free number). Sprites created from the chat are named by the AI.
- **Autosave writes to the open asset** and bumps its revision (the revision ADR 0014 D3
  uses). There is no separate hidden draft anymore.
- **The editor always has one open asset**, identified by ID. Opening another asset (from the
  Assets grid or from `/sprites?asset=<id>`) switches the ID; nothing is overwritten.
- **Rename and re-type** keep working as in ADR 0010 phase 2.
- **Save As** becomes "duplicate": a new asset copied from the open one.
- **Lazy creation**: an untouched new sprite is not stored until its first edit, so blank
  "Untitled" items do not pile up (the Figma complaint above).

## Consequences

- Easy: ADR 0014 phase 4 (deep link) is safe by construction, and phase 3 (live updates in
  the chat, Biblioteca and game) gets a real "edit this asset" event to react to.
- Easy: the user never asks "did I save?"; what is on screen is the asset.
- New cost: migrate the existing `local-draft` once into an Assets item ("Untitled 1") if it
  has content.
- New cost: the Assets store needs an "update content" operation, and the document layer
  (core, history) must be keyed by asset ID instead of the fixed draft ID.
- Open: `ASSET_LIBRARY_LIMIT` (200 per kind) evicts old items. Evicting the asset that is
  open, or one used by the game, must not happen. Decide the rule when building.
- Reuse: the Sound Editor can adopt the same model later (sound selection is in memory only
  today). Not planned now.

## Performance budget / acceptance

| Metric | Before | Target | Measured after |
|---|---|---|---|
| Unsaved work lost when opening another asset | Yes (single draft) | Never | |
| Blank "Untitled" items created by opening and closing | n/a | 0 | |
| Existing draft after upgrade | `local-draft` | Same pixels, now an Assets item | |

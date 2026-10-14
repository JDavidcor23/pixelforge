# sprite-save-as

Objective: implement ADR 0010 (docs/adr/0010-canvas-is-always-an-asset.md) Phase 1 + Phase 2.
Branch: feat/sprite-save-as. Delivery: ask-on-risk. Test runner: vitest (apps/editor).
Pipeline per ADR: frontend-agent → cleancode-agent per phase.

## Specs

S1. "File menu gains `Save As…`. Opens a small dialog: name (text, required) + asset type
(the existing `ASSET_TYPES` chips). On confirm, exports the current canvas (...) and adds
a new `AssetLibraryItem` to the Assets store with that name/type and a new `kind` value for
canvas-originated saves." (ADR 0010, Phase 1 Scope)

S2. "Draw something from a blank canvas (no AI, no import), `File > Save As…`, name it,
pick a type → it appears under that type's filter in the Assets grid, survives a page
reload (same IndexedDB repository as generations)." (ADR 0010, Phase 1 Acceptance)

S3. "Saving does not touch or depend on the hidden autosave draft — closing the tab without
`Save As`ing still behaves exactly as it does today (draft recovered on reopen, nothing in
Assets)." (ADR 0010, Phase 1 Acceptance)

S4. "Existing AI-generation and import saves are unaffected (regression check)." (ADR 0010,
Phase 1 Acceptance)

S5. "Two new icon buttons on `AssetTile.tsx`'s existing hover row (next to Delete/Download):
a rename pencil (inline text edit or a small dialog, owner's call at build time) and a
'move to' folder icon (reuses the asset-type chip picker from Phase 1's dialog)." (ADR 0010,
Phase 2 Scope)

S6. "Rename an existing item, its label updates in the grid and persists." (ADR 0010, Phase
2 Acceptance)

S7. "Move an item from one type filter (e.g. Characters) to another (e.g. Objects); it
disappears from the old filter's list and appears in the new one, count badges in the left
sidebar update." (ADR 0010, Phase 2 Acceptance)

S8. "Works on items of every `kind` (generation, animation, and the new canvas-save kind
from Phase 1)." (ADR 0010, Phase 2 Acceptance)

Correction (discovered during mapping, 2026-10-14): the ADR's Phase 1 wording "reuse the
same pixel/frame export path `useGeneratePanel`'s `addGeneration` already uses" is
imprecise — `addGeneration`'s base64 comes from the Retro Diffusion API response, not a
canvas export. The actual canvas-to-base64 export is `layersToBase64` (`export-utils.ts:90`),
already used by `useAnimateTab.hook.ts:136-139` for the same purpose. S1/S2 implementation
uses `layersToBase64`, not `addGeneration`'s path.

Assumption: `kind` value for canvas-originated saves is `'drawing'` (ADR names this "exact
name TBD at build time").

## Tasks

- T1 [S1,S2,S3,S4] Phase 1: Save As dialog + store action + repository wiring — route: delegated (frontend-agent, project mandatory-agent rule) — status: done (SaveAsDialog + useSaveAsDialog.hook.ts, addDrawing in assets.store.ts reusing addGeneration's repository path, useAssetsPanel.hook.ts kind-branch fix as flagged exception)
- T2 [S1,S2,S4] Phase 1 cleancode review — route: delegated (cleancode-agent) — status: done (one whitespace fix in assets.store.ts, no other defects, confirmed addDrawing shares addGeneration's persistence path, useAssetsPanel fix is minimal/correct)
- T3 [S2,S3,S4] Phase 1 focused tests + regression check — route: inline — status: done (pnpm --filter editor run typecheck: clean; pnpm --filter editor run test -- --run: 75 files/658 tests passed, includes S4 regression assertion for addGeneration/addAnimation)
- T4 [S5,S6,S7,S8] Phase 2: rename + move-to icons on AssetTile + store actions — route: delegated (frontend-agent) — status: pending
- T5 [S5,S6,S7,S8] Phase 2 cleancode review — route: delegated (cleancode-agent) — status: pending
- T6 [S6,S7,S8] Phase 2 focused tests + regression check — route: inline — status: pending

## Log

L1 (2026-10-14): User request verbatim: "docs/adr/0010-canvas-is-always-an-asset.md. implementa." (implement the ADR)
L2 (2026-10-14): User chose scope "Fase 1 + Fase 2" when asked (Phase 3 explicitly not committed in the ADR, excluded).
L3 (2026-10-14): Mapping explorer handoff — key files: constants/file-menu.ts, useTopBar.hook.ts (File menu entries), export-utils.ts (layersToBase64), types/ai-generation.ts:150-158 (AssetLibraryItem), constants/index.ts:290-298 (ASSET_TYPES), indexeddb-asset-library.repository.service.ts (putGenerations/putAnimations — no rename method, upsert by id), AssetTypeSelector.tsx (reusable chip picker), AssetTile.tsx (hover icon pattern), stores/assets.store.ts (useAssetsStore — no rename/move action yet), ImportSpriteSheetDialog.tsx (dialog pattern to mirror for SaveAsDialog).
L4 (2026-10-14): Phase 1 (T1-T3) implemented and reviewed. Decision: no new IndexedDB object store for 'drawing' — reuses the 'generations' store/action tagged with an optional kind field, per the feature doc's own "smaller, lower-risk" guidance. frontend-agent flagged one edit-surface exception (useAssetsPanel.hook.ts) not in its original authorized list — justified because without it S2 (drawings appearing in the grid) would fail; verified minimal and correct by cleancode-agent and by the parent. Known follow-up out of scope: AssetTile.tsx's "Download source (JSON)" button stays gated to kind==='generation', not extended to 'drawing' (pre-existing file, not part of S1-S4). Verification: typecheck clean, 658/658 tests pass. Risk: item 3 (addGeneration internals refactored into shared addGenerationEntry closure; public signature/behavior unchanged, all pre-existing tests pass unmodified).

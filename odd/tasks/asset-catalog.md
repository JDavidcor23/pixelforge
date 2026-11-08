# Feature: asset-catalog

Build screen phase 4 of `docs/build-screen-implementation-plan.md` (ADR 0016: the asset catalog is derived on every load, not stored; refines ADR 0014 D3).
Branch `feat/asset-catalog` (from `feat/sprite-asset-deep-link`, not pushed, not in master). Delivery: ask-on-risk; forecast is over 400 authored lines, so the chain strategy is asked before the first PR (nothing is pushed yet). TDD: on (source: practice of the previous feature `odd/tasks/sprite-asset-deep-link.md`, RED → GREEN per task). Runner: vitest (`pnpm --filter @pixelforge/editor test`), typecheck `pnpm --filter @pixelforge/editor typecheck`. No lint script in apps/editor.

## Objective

One normalized catalog (`byId` + `allIds`; `id`, `revision`, `kind`, optional `levelId` / `chatTurnId`, storage pointer) derived in memory from the sprite assets store (IndexedDB) and the sounds library (Supabase, signed-in only). The Biblioteca reads by id, and Phaser can subscribe per id outside React.

## Specs

- S1 (ADR 0016): the catalog is rebuilt from the two stores on every load and never stored. Tags stay `undefined` (no level or chat turn ids exist).
- S2 (ADR 0014 D3): bytes stay where they are; an entry holds a storage pointer, not bytes. Identity = stable id + revision (no content hash).
- S3: a sound edit bumps an in-memory `revision` on the sound (sounds have none today).
- S4: opening `/build` directly hydrates sprite assets from IndexedDB and, for signed-in users, sounds from Supabase (`listAudioAssets`, unused today), without duplicating sounds already in the session.
- S5: Biblioteca reads by id with granular selectors; editing one asset re-renders only its row. Search and kind filter work (the pills and the search box are disabled placeholders today). Level grouping is out (no levels).
- S6: Phaser-facing API: subscribe to one id outside React (`store.subscribe`) and get called only when that id's revision changes.
- Out of scope (owner decision L3): the game using a user asset, chat chips. The plan's "Done when" is corrected.

## Done when

- Editing a sprite or a sound bumps its catalog revision, re-renders only its Biblioteca row, and fires only that id's subscribers (tests).
- `/build` opened directly lists stored sprites and the signed-in user's sounds.
- Suite and typecheck green.

## Tasks

- [x] T1 — S1, S2, S3 catalog core: entry types, pure derivation with structural sharing (unchanged entries keep identity), catalog store derived from both stores, sound `revision` bumped by `updateAsset` — delegated (writer trigger: types + derive + store + sounds slice + tests) — RED: 2 suites missing modules, slice 3/4 failing → GREEN; tsc ok; suite 880/880 (parent re-ran) — commit below
- [x] T2 — S4 `/build` hydration: sprite assets + signed-in sounds from Supabase, deduped — delegated (writer trigger: 2 hooks + 3 services + tests) — RED 2 suites missing modules; follow-up RED 1 suite + 2 tests (user switch) → GREEN; tsc ok (parent re-ran); suite 892/892 — commit below
- [x] T3 — S5 Biblioteca by id + search + kind filter — delegated, project pipeline (no new visuals, so the design step is the existing placeholders) → frontend-agent → cleancode-agent — RED 2 files / 3 tests (missing module, `toLibraryRow`) → GREEN; suite 898/898, tsc ok (parent re-ran) — commit below
- [x] T4 — S6 per-id subscription for Phaser: `subscribeToCatalogEntry(id, listener)` + `getCatalogEntry(id)` in `lib/asset-catalog/catalog-subscription.ts`, no fire on subscribe, reference comparison — delegated (context) — RED module missing → GREEN 7 tests; suite 905/905, tsc ok — commit below
- [x] T5 — correct the plan's phase 4 "Done when" (and mark phase 3 done) — inline — f81e488. Done-when evidence: revision bump + per-id subscribers + filter covered by tests (905/905, tsc ok); row isolation is by construction (memo + per-id selector + structural sharing), with no React render test (no jsdom); `/build` hydration has no browser check (hooks untested, covered by service tests + typecheck). Stray empty `lib/asset-catalog/.tmp` from T1 removed — de6e4f6.
- [ ] Native review of `ad72c44..HEAD`: assess = medium, `slice_budget_reached` (~1342 lines). Preflight STATUS asked for an intended-untracked selection; every payload was refused (`must be exact ...selection/v1 JSON`). Owner (2026-11-07): "si ya terminaste dale subelo", so he continued without review and without reporting it. Pushed 2026-11-08 with the `JDavidcor23` token (first attempt got 403 from the work credential).

## Log

- L1 (2026-11-07, owner decision): catalog stored vs rebuilt → "b" (rebuilt on every load). ADR 0016, commit d1aae78.
- L2: map (2 explorers): sprites in IDB `pixelforge-assets` (`generations`, `animations`), `AIGeneration.revision?` bumped by `updateDrawingContent`; hydration only mounted in the sprite editor (`useSpriteEditorLayout.hook.ts` L37). Sounds: bucket `audio-assets`, no table, no revision, library array not persisted, `listAudioAssets` has no caller. Phaser (`src/build/game/`) loads no textures or sounds, draws rectangles; no store subscriptions there. No chips, no chat turns, no level ids. Biblioteca (`useLibraryTab.hook.ts`) selects whole arrays, `LibraryRow` not memoized. Vitest env `node`, no jsdom.
- L3 (2026-11-07, owner decision): scope "1": catalog without the game; the game using a sprite and chips get their own phase.
- L4 (T1): sound `updateAsset` bumps `revision` only when a field changes; a no-op returns the same state. `toAssetName` moved to `lib/asset-catalog/asset-name.ts` (one copy). The catalog store subscribes at module import.
- L5 (T2): sprite hydration moved from the sprite layout to `EditorLayout` (wraps /sprites, /sounds, /build), so there is one mount point and one load per page. Signed-in sounds: `useSoundLibraryHydration` lists the bucket once per user and merges inside `setState`. Session sounds win, dedupe by id or `supabaseUrl`. Listed sounds are marked `fromBucketListing` and dropped on sign-out or user change. A stale in-flight listing is discarded (parent asked for this after the first report). Known gap: `uploadAudio` has no caller and creates its own uuid, so when uploads are wired they must reuse the sound id or store the url, or sounds will duplicate after a reload.
- L6 (T3): the list selects `visibleIds` with `useShallow(filterCatalogIds)`; `LibraryRow` is memoized on `id` and reads `selectCatalogEntry(id)`. Pills map `sprites` → sprite and `audio` → sound; `music` and `video` have no catalog kind and show nothing. Open for design (owner): a "no results" copy (the empty state is reused today), and what Música and Video mean.

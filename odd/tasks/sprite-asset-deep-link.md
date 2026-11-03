Build screen phase 3 of `docs/build-screen-implementation-plan.md` (ADR 0015: every sprite is an asset from creation, plus deep links from `/build`).
Branch `feat/sprite-asset-deep-link` (from `feat/build-level`, which is not in master yet). Delivery: ask-on-risk. Test runner: vitest (`pnpm --filter @pixelforge/editor test`).

## Specs

- S1: "A new sprite is an Assets item named "Untitled N", stored on its first edit. Autosave writes to the open asset and bumps its revision. No hidden draft." ADR 0015: "Untitled N" is the "next free number"; "Lazy creation: an untouched new sprite is not stored until its first edit".
- S2: "Migrate the existing draft once into an Assets item if it has content." ADR 0015: "Same pixels, now an Assets item" ("Untitled 1").
- S3: "Save As becomes "duplicate"." ADR 0015: "a new asset copied from the open one."
- S4: "Biblioteca "Edit" → `/sprites?asset=<id>` or `/sounds?asset=<id>`. Sprite Studio and Sound Editor open the asset from the URL; Back returns to `/build`."
- S5 (done when): "opening another asset never loses work; reload on `/sprites?asset=<id>` keeps the same asset; an old draft survives the upgrade as an Assets item."
- S6 (owner decision L2): a sprite asset stores the full document (layers and frames) in IndexedDB under the asset id, plus a flattened PNG for the grid and the game.
- S7 (owner decision L3): the `/build` Biblioteca gets a minimal list of sprites and sounds (name + Edit) that reads the current stores; phase 4 switches it to the catalog. UI goes through design-agent → frontend-agent → cleancode-agent.
- S8 (ADR 0015 open item): eviction by `ASSET_LIBRARY_LIMIT` must never evict the open asset.

## Tasks

- [x] T1 — S1, S6, S8 asset content model: optional `revision`/`updatedAt` on `AIGeneration`, `updateDrawingContent`, `nextUntitledName`, `openAssetId` eviction guard — inline — Risk: item 1 (persisted format) — RED 8 failing + missing module → GREEN 37/37; tsc ok; suite 781/781 — commit below
- [ ] T2 — S1, S5 editor keyed by open asset id: autosave writes document + PNG + revision, lazy creation, switching asset flushes first — inline
- [ ] T3 — S2, S5 one-time `local-draft` → "Untitled 1" migration — inline — Risk: item 1 (existing stored data)
- [ ] T4 — S3 Save As → Duplicate — inline
- [ ] T5 — S4, S5 `/sprites?asset=<id>` and `/sounds?asset=<id>` (wait for hydrate, unknown id), Back to `/build` — inline
- [ ] T6 — S4, S7 Biblioteca minimal list + Edit — delegated: design-agent → frontend-agent → cleancode-agent (project pipeline)
- [ ] T7 — S5 browser check of the done-when list + independent verifier (items 1) — delegated

## Log

- L1 (2026-11-03): "Sí, arranca con la Fase 3 con ODD en la rama nueva feat/sprite-asset-deep-link."
- L2 (2026-11-03, owner decision): asset content = "Documento + vista PNG (Recommended)".
- L3 (2026-11-03, owner decision): Biblioteca = "Lista mínima + Edit (Recommended)".
- L4: map (explorer): draft is `local-draft` in IDB db `pixelforge` store `drafts` (`StoredDocument {id, revision, updatedAt, payload}`); sprite assets live in db `pixelforge-assets` (`generations`, `animations`) with no `revision`/`updatedAt` and no content-update op; Save As (`useTopBar.hook.ts` `runSaveAs`) exports one frame to PNG via `addDrawing`; no `useSearchParams` in the app; Biblioteca is a static placeholder; no Back button in either editor; sound selection is in memory only. ADR 0015 lists the Sound Editor model as "not planned now"; S4 only needs `/sounds?asset=<id>` to select that sound.
- L5 (T1): per-asset document storage needs no new store: `DocumentRepository` is already keyed by `DocumentId`, so T2 saves the document under the asset id in the existing `drafts` store (no DB version bump). Eviction keeps the open asset and it counts toward the limit (the next oldest goes instead). Pre-existing defect fixed on the way: the localStorage fallback parser dropped `kind`, so a drawing came back as a generation; it now keeps `kind`, `revision`, `updatedAt`.

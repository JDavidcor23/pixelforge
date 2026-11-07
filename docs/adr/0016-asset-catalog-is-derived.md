# 0016 — The asset catalog is derived, not stored

**Status**: Accepted
**Date**: 2026-11-07
**Applies to**: apps/editor (Build screen, Biblioteca, chat chips, Phaser preview), Assets library, Sound Editor
**Supersedes**: nothing. Refines D3 of ADR 0014 (how the catalog is kept).

## Context

- ADR 0014 D3: asset bytes stay where they are; a catalog indexes them by stable ID and
  revision, and tags each entry with kind, level and chat turn. Phase 4 of
  `docs/build-screen-implementation-plan.md` builds it. The open question was whether the
  catalog is stored (so tags survive a reload) or rebuilt from the two storages on every load.
- Sprites live in IndexedDB, database `pixelforge-assets`, stores `generations` and
  `animations` (`services/indexeddb-asset-library.repository.service.ts`,
  `constants/persistence.ts`). `AIGeneration` has `revision?` and `updatedAt?` since ADR 0015.
  `ASSET_LIBRARY_LIMIT` is 200 per kind. There is no separate index record.
- Sounds live in the Supabase Storage bucket `audio-assets`, path
  `<userId>/sounds/<uuid>.wav`. There is no metadata table and `AudioAsset` has no revision.
  Signed-out sounds are session-only and are not persisted.
- Levels: only the static `apps/editor/public/levels/level-1.json` exists, and the `Level`
  type has no id. Chat turns: nothing is persisted and they have no ids. So nothing produces
  `levelId` or `chatTurnId` today.
- Without a per-ID revision, Phaser cannot hot-swap a texture or sound, and Phase 4 cannot close.

**Not measured**: the cost of rebuilding the catalog on load. At most 200 sprite items per
kind plus the signed-in user's sound listing; to be measured when built (see budget).

## Prior art

| Who | Technique | Result | Source |
|---|---|---|---|
| Redux | Normalized state: entities in `byId` plus an `allIds` list; derive views from it | One copy per entity, cheap lookups by ID | https://redux.js.org/usage/structuring-reducers/normalizing-state-shape |
| Adobe Lightroom Classic | Stored catalog that points at files on disk | Catalog and disk drift: "missing photos" that the user must locate | https://helpx.adobe.com/lightroom-classic/help/locate-missing-photos.html |
| This repo | Assets library persists items in IndexedDB; sounds in Supabase Storage | The two sources of truth the catalog would index | `stores/assets.store.ts` |

## Options considered

| Option | Gain | Lose | Risk |
|---|---|---|---|
| A. Keep current (no catalog; Library reads the two arrays) | No work | No per-ID revision; Phaser cannot hot-swap; Phase 4 does not close | Blocks ADR 0014 |
| **B. Rebuild on every load (chosen)** | One source of truth; no orphan entries after delete or eviction | `levelId` and `chatTurnId` tags do not survive a reload | Rebuild cost on load (not measured) |
| C. Stored catalog (new IndexedDB store) | Tags survive a reload | Two sources of truth that drift (the Lightroom problem); a migration | Stale or orphan entries |
| D. Rebuild + small stored tag sidecar keyed by asset id | Tags survive; no orphan entries (the sidecar only holds tags) | A second store to keep in step | Premature today: nothing produces tags |

## Decision

- **The catalog is derived state.** It is built in memory from the sprite store
  (IndexedDB) and the sound listing (Supabase) on every load. It is never written to disk.
- **Shape**: a Zustand slice with normalized entities, `byId` plus `allIds`. Each entity has
  `id`, `revision`, `kind`, optional `levelId`, optional `chatTurnId`, and a storage pointer.
- **Revision source**: sprites use `AIGeneration.revision` (ADR 0015). Sounds have none, so
  the catalog keeps an in-memory revision per sound id, bumped when the sound is edited or
  replaced in the session. That is enough for a live swap; it resets on reload.
- **Tags in this phase**: `levelId` and `chatTurnId` stay undefined for rebuilt entries and
  are lost on reload. This is accepted because no code produces them yet.
- **Upgrade path is D**: add a small tag sidecar keyed by asset id, still rebuilding the
  entities. Do not add a stored catalog (C).

## Consequences

- Easy: delete or eviction (`ASSET_LIBRARY_LIMIT`) cannot leave an orphan entry; the next
  rebuild is correct by construction. No migration, no new IndexedDB store.
- Easy: Phase 4 can close; chips, Biblioteca rows and Phaser read one entity by ID and react
  to its revision.
- New cost: the rebuild runs on each load (cost to be measured), and sound listing needs a
  signed-in session; signed-out sounds are in memory only.
- New cost: sound revisions exist only in memory, so they restart on reload; consumers must
  compare revisions within a session, never across sessions.
- Open: "grouped by level" in the Biblioteca will show nothing until levels have stable ids.
- Where else this applies:
  - Sound Editor: its library can read the same catalog instead of its own list.
  - Scene builder: scene references to assets resolve by catalog ID, with no copy of the
    bytes or of the index.
- **Trigger to move to D**: levels or chat turns get stable ids, and a tag the user cares
  about is lost on reload. Then add the sidecar; keep rebuilding the entities.

## Performance budget / acceptance

| Metric | Before | Target | Measured after |
|---|---|---|---|
| Catalog rebuild on load (200 sprites per kind + sound listing) | n/a | To set when first measured | |
| Orphan catalog entries after delete or eviction | n/a | 0 | |
| Persisted catalog records | n/a | 0 (derived only) | |
| Edit of one asset re-renders other rows | n/a | 0 | |

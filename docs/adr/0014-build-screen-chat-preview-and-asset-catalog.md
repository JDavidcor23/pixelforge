# 0014 — Build screen: chat + live Phaser preview, one asset catalog

**Status**: Accepted
**Date**: 2026-10-28
**Applies to**: apps/editor (new `/build` screen, Sprite Studio, Sound Editor), `stores/`

## Context

- Milestone 1 ("From a text to a playable platformer", `docs/vision.md`)
  needs an in-app screen to build the game. The owner approved the UX on
  2026-10-24: chat on the left, live game preview on the right (Pencil
  `design.pen`, frames `opmIw` and `w6xpSA`). Not a node editor. GitHub
  issue #18 ("Wire Phaser into the editor"), phase 1a, due 2026-11-08.
- Today the editor has two flat, static routes under one shell:
  `/sprites` and `/sounds` (`apps/editor/src/App.tsx:23-27`). No route
  params, no query strings, no lazy loading.
- Phaser is not installed anywhere. Current stable line is Phaser 4
  (v4.2.1, 2026-07-09, https://github.com/phaserjs/phaser/releases).
- The editor already suffered re-render storms: the wide `useTimeline`
  selector re-rendered on every pixel while drawing
  (`sprites/hooks/useSpriteEditorStore.hook.ts:80-89`). Rule: granular
  selectors only (`AGENTS.md`). A game loop redraws ~60 times per second.
- Assets live in two places: sprite assets in IndexedDB
  (`pixelforge-assets`, `stores/assets.store.ts`), sounds in a Supabase
  bucket (`sounds/features/library/services/audio-storage.service.ts`).
  Sprite Studio always opens the fixed draft `'local-draft'`
  (`constants/persistence.ts:2`); sound selection is in-memory only
  (`stores/slices/audio-library.slice.ts:40`). No URL can open an asset.
- In the mock, every generated asset appears twice: as a chip in the chat
  turn that created it, and in the Biblioteca tab grouped by level.
- Product rule from the owner: **one user builds one game** ("like opening
  one image in Photoshop"). There is no multi-game model.

**Not measured yet**: Phaser's bundle weight in this app, preview FPS with
the chat open, React commits per second while the game runs. Phase 0 of the
plan measures them.

## Prior art

| Who | Technique | Result | Source |
|---|---|---|---|
| Phaser official React template | Mount the game once from a ref; React and Phaser talk through an EventBus | Game loop never goes through React state | https://github.com/phaserjs/template-react |
| Zustand | `getState()` / `subscribe()` outside React (transient updates) | Non-React code reads state without re-renders | https://zustand.docs.pmnd.rs/reference/apis/create-store |
| Redux docs | Normalized state: entities `byId` + `allIds`, referenced by ID | One record, many views | https://redux.js.org/usage/structuring-reducers/normalizing-state-shape |
| Domain-Driven Design (Evans) | Entity = defined by identity, not attributes | Edits keep the same identity | https://martinfowler.com/bliki/EvansClassification.html |
| Git | Content addressing (hash = identity of one frozen version) | Good for dedupe/cache, wrong for live edits | https://git-scm.com/book/en/v2/Git-Internals-Git-Objects |
| Claude Artifacts | Chat + live preview side by side, version selector | Same UX shape as this screen | https://support.anthropic.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them |
| This repo | `useSoundsStore.subscribe` "observed without re-rendering" | Pattern already works here | `sounds/features/timeline/hooks/useTimelinePlayback.hook.ts:130` |

## Options considered

### D1. Where the screen lives

| Option | Gain | Lose | Risk |
|---|---|---|---|
| A. Panel inside `/sprites` | No router change | Mixes two screens; Phaser loads while drawing | Slower Sprite Studio |
| **B. Sibling route `/build`, lazy-loaded (chosen)** | Third rail item like the mock; Phaser downloads only on `/build` | Single game only | None for M1 |
| C. Per-game tree `/projects/:id/...` | Multi-game model | Rewrites routes and persistence | Solves a problem the product does not have |

### D2. Game loop vs React

| Option | Gain | Lose | Risk |
|---|---|---|---|
| A. Shared reactive state | Simplest wiring | Chat re-renders at game FPS | Known re-render storm |
| **B. Phaser isolated, EventBus messages (chosen)** | Official pattern; zero React work per frame | A typed message contract to maintain | Low |
| C. iframe sandbox | Full isolation for AI-written code | Slower messaging, asset sharing gets hard | Not needed: in M1 the AI writes level JSON, not code |

### D3. Who owns the asset list

| Option | Gain | Lose | Risk |
|---|---|---|---|
| A. Each view keeps its own list | Quick start | Chips and Biblioteca drift apart | Sure desync |
| **B. One normalized catalog, views hold IDs (chosen)** | Single source of truth; edits show everywhere | New slice + adapters to two storages | Low |
| C. Copy assets into a build-only list | Chat and Biblioteca agree | Edits in Sprite Studio never reach the game | Stale copies |

Identity inside D3: **stable ID + revision number**. A content hash was
rejected as identity because every edit produces a new hash, so the chat
would keep pointing at the old version. Hashes may be added later,
internally, for dedupe or caching.

### D4. Editing from the Biblioteca

| Option | Gain | Lose | Risk |
|---|---|---|---|
| A. Copy editing tools into `/build` | Never leave the screen | Two editors to maintain | Drift |
| **B. Deep link to the existing editor (chosen)** | One editor; URL survives reload; Back returns to chat | Editors must learn to open an asset by ID | Draft handling (see Consequences) |
| C. Editor as an overlay over the game | Chat stays visible | Phaser + Konva running at once; editors are full-screen | Performance |

## Decision

- **D1**: a new sibling route `/build` under `EditorLayout`, third rail
  item, loaded with `React.lazy` (route-based code splitting). Code lives in
  `apps/editor/src/build/` next to `sprites/` and `sounds/`.
- **D2**: Phaser 4 is mounted once per visit from a ref and destroyed on
  unmount (`game.destroy()` is async; wait for its DESTROY event). React
  sends commands (`load-level`, `pause`, `resume`, `restart`,
  `fullscreen`) and Phaser emits events (`player-died`, `level-complete`)
  through one typed EventBus. Phaser reads stores with `getState()` /
  `subscribe()`, never through React props or selectors.
- **D3**: one **normalized asset catalog** (Zustand slice). Each asset is an
  **entity** with a **stable ID**, a **revision number**, and tags: kind
  (sprite, audio, music, video), level, and the chat turn that created it.
  Bytes stay where they are today (IndexedDB for sprites, Supabase for
  sounds); the catalog indexes them. Chat chips, the Biblioteca and the
  game hold only IDs.
- **Sync**: editing an asset bumps its revision; subscribers of that ID are
  notified (**Observer / publish-subscribe**). Only the views showing that
  asset re-render, and Phaser swaps that texture or sound live, without
  restarting the level.
- **D4**: "Edit" in the Biblioteca navigates to `/sprites?asset=<id>` or
  `/sounds?asset=<id>` (**deep linking**, URL as state). Browser Back
  returns to `/build`.

## Consequences

- Easy: chips and Biblioteca can never disagree; an edit in Sprite Studio
  shows up in the running game.
- Easy: Sprite Studio and Sound Editor do not pay for Phaser.
- New cost: a typed EventBus contract and a catalog slice with two storage
  adapters.
- Open (phase 4): Sprite Studio today always opens `'local-draft'`. Opening
  an asset by ID must not lose unsaved draft work; check how ADR 0010
  ("the canvas is always a named Assets item") already handles it before
  building.
- Moving to multi-game later is a route wrapper plus a `gameId` tag on the
  catalog. Not planned.
- Reuse: the catalog is the base for the scene/level builder and for
  publishing (every asset the game needs is listed by ID).

## Performance budget / acceptance

| Metric | Before | Target | Measured after |
|---|---|---|---|
| Phaser in `/sprites` and `/sounds` initial bundle | 0 KB (not installed) | 0 KB | 0 KB (Phaser only in the lazy `BuildScreen` chunk) |
| `/sprites` initial JS (gzip -9, raw) | 414.0 KB, 1,357.8 KB | unchanged | 414.3 KB, 1,359.0 KB (+0.3 KB: lazy route + rail item) |
| `/build` chunk size (gzip) | 381 KB (1,696 KB raw, Phaser 4.2.1 + screen) | ≤ 400 KB | 381 KB |
| Preview FPS with chat open | not measured | ≥ 55 on the owner's machine | |
| Chat panel React commits while the game runs and nobody types | not measured | 0 per second | |
| Edit in Sprite Studio → visible in preview | n/a | after returning to `/build`, no level restart | |

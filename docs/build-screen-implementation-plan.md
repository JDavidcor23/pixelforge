# Build screen — implementation plan

Decisions: [ADR 0014](adr/0014-build-screen-chat-preview-and-asset-catalog.md),
[ADR 0015](adr/0015-every-sprite-is-an-asset-from-creation.md).
Milestone 1, phase 1a (GitHub #18, due 2026-11-08), then #19 and #20.
Visual reference: `design.pen` frames `opmIw` (chat) and `w6xpSA` (Biblioteca).
Every phase ships on its own `feat/*` branch. UI follows
design-agent → frontend-agent → cleancode-agent.

| Phase | Status | Evidence |
|---|---|---|
| 0 — Measure | Done | `037f2e4` (ADR 0014 budget table) |
| 1 — Empty screen + Phaser | Done | `3dafa87`, `1a67a94` |
| 2 — Hand-made level | Automated done; manual playtest pending | `odd/tasks/build-level.md` |
| 3 — Sprite is an asset + deep link | Not started | |
| 4 — Asset catalog | Not started, one decision open | |

## Phase 0 — Measure (half a day) — done

- Add Phaser 4.2.1 to `apps/editor`.
- Record: `/build` chunk size, `/sprites` initial bundle size (must not
  change), preview FPS, chat React commits per second (React Profiler).
- Write the numbers into the ADR 0014 budget table.

**Done when**: the "Before" column has real numbers.

## Phase 1 — Empty screen + Phaser mounted (#18) — done

- Route `/build` (lazy) and a third rail item in `EditorLayout`.
- Layout of `opmIw`: chat panel (Chat / Biblioteca tabs, empty states)
  and preview with toolbar (play, pause, restart, fullscreen).
- `build/game/`: mount Phaser once from a ref, destroy on unmount
  (wait for the DESTROY event; safe under React Strict Mode).
- Typed EventBus: commands `pause`, `resume`, `restart`, `fullscreen`;
  events `player-died`, `level-complete`.

**Done when**: toolbar controls the game; 0 chat commits per second while
the game runs; FPS ≥ 55; `/sprites` bundle within +1 KB (lazy route and
rail item only).

## Phase 2 — Hand-made level, run and jump (#19, #20)

- One level as JSON (platforms, hazards, goal), shipped as a static file and
  validated before use. The build screen sends it to Phaser with the
  `load-level` command.
- The level scene replaces the placeholder scene; `restart` must restart the
  level scene, not the placeholder.
- The level scene emits `player-died` (hazard or fall) and `level-complete`
  (goal). Nothing emits them today.
- Run and jump tuned for feel (coyote time, jump buffer) inside Phaser only.

**Done when**:
- Automated: an invalid level is rejected with a clear error; touching a
  hazard emits `player-died`; reaching the goal emits `level-complete`.
- Manual: a real user finishes the level without help.

## Phase 3 — Sprite is an asset + deep link to the editors (ADR 0015)

Comes before the catalog: the catalog needs "edit an existing asset" to
exist.

- A new sprite is an Assets item named "Untitled N", stored on its first
  edit. Autosave writes to the open asset and bumps its revision. No hidden
  draft.
- Migrate the existing draft once into an Assets item if it has content.
- Save As becomes "duplicate".
- Biblioteca "Edit" → `/sprites?asset=<id>` or `/sounds?asset=<id>`.
  Sprite Studio and Sound Editor open the asset from the URL; Back returns
  to `/build`.

**Done when**: opening another asset never loses work; reload on
`/sprites?asset=<id>` keeps the same asset; an old draft survives the
upgrade as an Assets item.

## Phase 4 — Asset catalog

**Decide first**: is the catalog stored (so level and chat-turn tags survive
a reload) or rebuilt from the two storages on every load?

- Zustand slice: entities `byId` + `allIds`; each entity has `id`,
  `revision`, `kind`, optional `levelId`, optional `chatTurnId`, and a
  storage pointer.
- Adapters to the existing storage: sprite assets (IndexedDB) and sounds
  (Supabase, signed-in users only). Existing assets get catalog entries
  without tags.
- Chat chips and the Biblioteca (search, kind filter, grouped by level)
  read by ID with granular selectors.
- Phaser subscribes per ID outside React; a revision bump swaps that
  texture or sound live.

**Done when**: editing an asset updates its chip, its Biblioteca row and
the running game, with no level restart and no re-render of other rows.

## Out of scope

- Multi-game projects, iframe sandbox, AI-written game code, chat → AI
  level generation (phase 1c), video assets.

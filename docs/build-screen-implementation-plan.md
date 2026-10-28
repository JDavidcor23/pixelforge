# Build screen — implementation plan

Decision: [ADR 0014](adr/0014-build-screen-chat-preview-and-asset-catalog.md).
Milestone 1, phase 1a (GitHub #18, due 2026-11-08), then #19 and #20.
Visual reference: `design.pen` frames `opmIw` (chat) and `w6xpSA` (Biblioteca).
Every phase ships on its own `feat/*` branch. UI follows
design-agent → frontend-agent → cleancode-agent.

## Phase 0 — Measure (half a day)

- Add Phaser 4.2.1 to `apps/editor`.
- Record: `/build` chunk size, `/sprites` initial bundle size (must not
  change), preview FPS, chat React commits per second (React Profiler).
- Write the numbers into the ADR 0014 budget table.

**Done when**: the "Before" column has real numbers.

## Phase 1 — Empty screen + Phaser mounted (#18)

- Route `/build` (lazy) and a third rail item in `EditorLayout`.
- Layout of `opmIw`: chat panel (Chat / Biblioteca tabs, empty states)
  and preview with toolbar (play, pause, restart, fullscreen).
- `build/game/`: mount Phaser once from a ref, destroy on unmount
  (wait for the DESTROY event; safe under React Strict Mode).
- Typed EventBus: commands `pause`, `resume`, `restart`, `fullscreen`;
  events `player-died`, `level-complete`.

**Done when**: toolbar controls the game; 0 chat commits per second while
the game runs; FPS ≥ 55; `/sprites` bundle unchanged.

## Phase 2 — Hand-made level, run and jump (#19, #20)

- One level as JSON (platforms, hazards, goal) loaded by a Phaser scene
  through the `load-level` command.
- Run and jump tuned for feel (coyote time, jump buffer) inside Phaser only.

**Done when**: a real user finishes the level without help.

## Phase 3 — Asset catalog

- Zustand slice: entities `byId` + `allIds`; each entity has `id`,
  `revision`, `kind`, `levelId`, `chatTurnId`, and a storage pointer.
- Adapters to the existing storage: sprite assets (IndexedDB) and sounds
  (Supabase). No data migration: existing assets get catalog entries.
- Chat chips and the Biblioteca (search, kind filter, grouped by level)
  read by ID with granular selectors.
- Phaser subscribes per ID outside React; a revision bump swaps that
  texture or sound live.

**Done when**: editing an asset updates its chip, its Biblioteca row and
the running game, with no level restart and no re-render of other rows.

## Phase 4 — Deep link to the editors

- Biblioteca "Edit" → `/sprites?asset=<id>` or `/sounds?asset=<id>`.
- Sprite Studio and Sound Editor open the asset from the URL; Back
  returns to `/build`.
- First, check how ADR 0010 handles the current draft so opening an asset
  never loses unsaved work.

**Done when**: reload on `/sprites?asset=<id>` keeps the same asset; the
change is visible in `/build` after Back.

## Out of scope

- Multi-game projects, iframe sandbox, AI-written game code, chat → AI
  level generation (phase 1c).

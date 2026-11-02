Build screen phase 2 of `docs/build-screen-implementation-plan.md` (hand-made level, run and jump; GitHub #19, #20).
Branch `feat/build-level`. Test runner: vitest (`pnpm --filter @pixelforge/editor test`). Phaser cannot run in vitest (node env, no WebGL): rules live in pure modules the scene calls.

## Specs

- S1: "One level as JSON (platforms, hazards, goal), shipped as a static file and validated before use. The build screen sends it to Phaser with the `load-level` command."
- S2: "The level scene replaces the placeholder scene; `restart` must restart the level scene, not the placeholder."
- S3: "The level scene emits `player-died` (hazard or fall) and `level-complete` (goal). Nothing emits them today."
- S4: "Run and jump tuned for feel (coyote time, jump buffer) inside Phaser only." #20: "Coyote time + jump buffer + variable jump feel good".
- S5 (done when, automated): "an invalid level is rejected with a clear error; touching a hazard emits `player-died`; reaching the goal emits `level-complete`."
- S6 (done when, manual): "a real user finishes the level without help." (#19: "One level is playable start to finish")

## Tasks

- [x] T1 — S1 level types, validator, static `level-1.json`, `load-level` command — inline — RED (missing modules, load-level no-op) → GREEN — dd053fa + 215df48
- [x] T2 — S4 run/jump controller (coyote, buffer, variable jump), pure — inline — RED (module removed) → GREEN 13/13 — dd053fa
- [x] T3 — S3, S5 level rules (hazard, fall, goal → events), pure — inline — RED → GREEN 6/6 — dd053fa
- [x] T4 — S1, S2, S3 `LevelScene` replaces `PreviewScene`; preview loads and sends the level — inline — tsc ok, suite 767/767 — 215df48
- [ ] T5 — S5, S6 browser smoke check done (L4); manual playtest is the owner's — open

## Log

- L1 (2026-11-02): "Implementa con ODD la Fase 2 de docs/build-screen-implementation-plan.md en la rama feat/build-level"
- L2: #19 title says "with our own sprites"; the plan's phase 2 does not list sprites (assets arrive in phases 3–4). Level drawn with token-colored rectangles.
- L3: keys are added with `enableCapture: false` so Phaser does not swallow Space/arrows for the page; side effect: WASD/arrows also move the player while typing in the chat (chat input is disabled in this phase). A failed level load is reported with `console.error` only; an in-UI error state needs design-agent.
- L4: Playwright (headed Chromium, dev server, `/build`): level-1 renders; walking into the first spike emits `player-died`; via `load-level` test levels, reaching the goal emits `level-complete` and shows "Level complete", falling off emits `player-died`, idling emits nothing; `restart` returns the player to spawn (x 140 → 48); 0 page/console errors. A blind scripted full run of level-1 did not reach the goal (timing), so S6 stays with the owner.

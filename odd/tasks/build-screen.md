Build screen, phases 0 and 1 of `docs/build-screen-implementation-plan.md` (ADR 0014, GitHub #18).
Branch `feat/build-screen`. Delivery: ask-on-risk. Test runner: vitest (`pnpm --filter @pixelforge/editor test`).

## Specs

- S1 (phase 0): "Add Phaser 4.2.1 to `apps/editor`."
- S2 (phase 0): "Record: `/build` chunk size, `/sprites` initial bundle size (must not change), preview FPS, chat React commits per second (React Profiler)." "Write the numbers into the ADR 0014 budget table." Done when: "the \"Before\" column has real numbers."
- S3 (phase 1): "Route `/build` (lazy) and a third rail item in `EditorLayout`."
- S4 (phase 1): "Layout of `opmIw`: chat panel (Chat / Biblioteca tabs, empty states) and preview with toolbar (play, pause, restart, fullscreen)."
- S5 (phase 1): "`build/game/`: mount Phaser once from a ref, destroy on unmount (wait for the DESTROY event; safe under React Strict Mode)."
- S6 (phase 1): "Typed EventBus: commands `pause`, `resume`, `restart`, `fullscreen`; events `player-died`, `level-complete`."
- S7 (phase 1 done when): "toolbar controls the game; 0 chat commits per second while the game runs; FPS ≥ 55; `/sprites` bundle unchanged."
- Constraint: UI follows design-agent → frontend-agent → cleancode-agent; visual reference `design.pen` frame `opmIw`.

## Tasks

- [x] T0 — commit ADR docs on `feat/build-screen` — inline — be220a1
- [x] T1 — S1, S2 bundle numbers — inline — 3dafa87 + ADR table
- [x] T2 — S5, S6 game mount + typed EventBus with tests — inline — 3dafa87 (RED: 3 files missing modules; GREEN 14/14; suite 728/728)
- [x] T3 — S3, S4 route, rail item, layout — delegated: frontend-agent → cleancode-agent (project pipeline); tsc ok, suite 730/730
- [x] T4 — S2, S7 after-numbers — inline — ADR table filled (bundle L8, browser L9)

## Log

- L1 (2026-10-28): "PixelForge, repo game-builder. Implementa la fase 0 y la fase 1 del plan docs/build-screen-implementation-plan.md (ADR 0014). Primero commitea los docs del ADR en una rama feat/build-screen. Sin explicaciones largas."
- L2: baseline measurement build before Phaser (single entry chunk, no lazy routes yet): `index.js` 1,357.77 kB / 416.64 kB gzip; CSS 64.18 kB / 10.80 kB gzip; wasm 108.63 kB / 43.68 kB gzip.
- L3: `phaser@4.2.1` installed in `apps/editor` (pinned exact).
- L4: Phaser runs `runDestroy` inside `step`, so DESTROY fires on the next frame; `createGameMounter` chains each mount on the previous teardown, and a Strict Mode first mount is cancelled before it creates a game. Root `.gitignore` `build/` hid `apps/editor/src/build/`; added a negation.
- L5: `.claude/agents/design-agent.md` does not exist; design role run as a read-only agent. Pencil desktop app not reachable, so frame `opmIw` could not be read. T3 blocked until Pencil is open.
- L6: Pencil reconnected; spec read from `opmIw`/`w6xpSA`. Neither frame has empty states; rail item is `Gamepad2`; design has Play but no Pause.
- L7 (2026-10-28, user decision): on frame vs DESIGN.md conflicts "Manda el frame (Recommended)" — chat 420px, input `bg-hover`, toolbar buttons `size-6`, rail icons `muted`, radius `rounded-lg`. DESIGN.md to be updated later. Defaults taken: Play/Pause toggle, rail label "Build", minimal empty states.
- L8: after build (gzip -9): `/sprites` entry 414,007 → 414,296 B (+289 B, no Phaser); `BuildScreen` chunk 1,696,290 B raw / 380,901 B gzip. Target set to ≤ 400 KB gzip (owner may change). FPS and chat commits/s need a browser run.
- L9: Playwright (headed Chromium, dev server, `/build`, 5 s window): 60.0 FPS; 0 React commits/s for the whole app; Pause stops canvas changes, Resume restarts them, Restart changes the frame, Fullscreen sets `document.fullscreenElement`; 0 page errors. S7 met. Phase 0 and 1 complete.

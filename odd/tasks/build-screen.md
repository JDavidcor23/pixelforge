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
- [ ] T1 — S1, S2 bundle numbers (baseline + Phaser) — inline
- [ ] T2 — S5, S6 game mount + typed EventBus with tests — inline
- [ ] T3 — S3, S4 route, rail item, layout — design-agent → frontend-agent → cleancode-agent (project pipeline)
- [ ] T4 — S2, S7 after-numbers: `/build` chunk, `/sprites` unchanged; FPS and commits/s need a browser run

## Log

- L1 (2026-10-28): "PixelForge, repo game-builder. Implementa la fase 0 y la fase 1 del plan docs/build-screen-implementation-plan.md (ADR 0014). Primero commitea los docs del ADR en una rama feat/build-screen. Sin explicaciones largas."
- L2: baseline measurement build before Phaser (single entry chunk, no lazy routes yet): `index.js` 1,357.77 kB / 416.64 kB gzip; CSS 64.18 kB / 10.80 kB gzip; wasm 108.63 kB / 43.68 kB gzip.
- L3: `phaser@4.2.1` installed in `apps/editor` (pinned exact).

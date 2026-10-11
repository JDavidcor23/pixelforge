# Code map: where each piece lives

**The two apps**
- `apps/landing/`: the Next.js marketing site. Its sections live in `src/app/(landing)/components/`.
- `apps/editor/`: the editor, a Vite + React single-page app.

**Pixels: how the drawing is stored and changed**
- `apps/editor/src/lib/pixel-buffer.ts`: the drawing as one flat list of bytes (4 per pixel: red, green, blue, alpha).
- `apps/editor/src/lib/core/commands.ts`: every change to the drawing is a command, sent through one entry point.
- `apps/editor/src/lib/core/history.ts`: undo and redo. It saves only the rectangle that changed.
- `apps/editor/src/lib/flood-fill.ts`, `quantize.ts`, `downscale.ts`: the bucket fill, color reduction and image shrinking.

**The engine switch: TypeScript or Rust**
- `packages/core/src-ts/ts-core.ts`: the TypeScript engine (the default).
- `packages/core/src-ts/wasm-core.ts`: loads the Rust engine compiled to WebAssembly.
- `packages/core/src-ts/resolve-core.ts`: picks the engine. If WebAssembly crashes, it switches back to TypeScript for the rest of the session.
- `packages/core/src/`: the Rust code (`flood_fill.rs`, `quantize.rs`, `downscale.rs`, `history.rs`, `document.rs`).

**Saving drafts**
- `apps/editor/src/services/indexeddb-document.repository.service.ts`: saves drafts in the browser (IndexedDB).
- `apps/editor/src/services/document-persistence.controller.ts`: decides when to save and when to load.

**AI and shared styles**
- `apps/editor/api/ai/`: small server functions that call the AI services, so secret keys never reach the browser.
- `packages/tokens/`: colors and styles shared by both apps.

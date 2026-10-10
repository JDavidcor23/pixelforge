# 0002 — A single `dispatch(cmd)` seam; the core owns the document

**Status**: Accepted (phase 2, confirmed in phase 2e/2f)

## Context

Before this change, the Zustand store mutated layers/frames directly from
many call sites, and UI state (which layer is active, which frame is viewed)
was tangled with document data (pixels, layer stack, timeline). This makes it
impossible to swap the implementation behind a stable boundary (the whole
point of the Rust/Wasm migration) and was itself a source of real bugs (two
copies of "current frame" that could desync — see 0003).

## Decision

- **D3**: The **core owns the document** — frames, layer order/metadata,
  pixels, and history. The Zustand store holds UI state plus `docRevision`
  and a read-only `DocSnapshot` derived cache. Every mutation, undoable or
  not, goes through `core.dispatch(cmd)` — never a direct `set({layers})`.
- **D5**: Two seams, not one: `PixelKernels` (stateless buffer ops — phases
  4–6) sits *under* `PixelCore` (the stateful document — phase 7). Porting the
  stateless kernels to Rust first is far lower risk than porting history/undo
  state management in one jump.
- **D6**: The Rust API surface stays flat: `u32` handles, slices, `rgba: u32`,
  no `serde-wasm-bindgen`. A serde-based command boundary would be easier to
  grow but adds crate surface and magic that isn't worth it for ~12 functions.

## Consequences

- `lib/core/{commands,ts-core,history,pixel-core,core-config}.ts` form the
  boundary a future `WasmPixelCore` must satisfy — confirmed end-to-end by
  `lib/core/pixel-core.contract.test.ts` (`describe.each` over implementations).
- The UI layer (hooks, Konva components) only ever calls `dispatch`/`undo`/
  `redo`/`readLayer`/`snapshot` — it has no idea whether the core is TS or
  Wasm. This is what let phase 3 move the whole editor into a new Vite app
  without touching this boundary.

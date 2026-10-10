# 0004 — Rust/Wasm boundary: flat handles, no serde, copy semantics

**Status**: Accepted for phase 4+ (not yet implemented — core is TS-only through phase 3)

## Context

Phases 4–7 will move `PixelKernels` and then `PixelCore` into Rust compiled to
`wasm32-unknown-unknown`. The TS↔Wasm boundary needs to be decided *before*
any Rust is written, because the TS core (phases 1–2f) was deliberately shaped
to match it in advance — this is what makes the eventual port mechanical
instead of a rewrite.

## Decision

- **D6**: Flat methods, `u32` handles (string ids map to handles at the
  facade), slices (`&mut [u8]`), and `rgba: u32` (packed, documented byte
  order — see `lib/core/color-codec.ts`'s `packRgba`/`unpackRgba`). No
  `serde-wasm-bindgen`.
- **D7**: Buffers live in Wasm linear memory; JS reads a *view*
  (`new Uint8ClampedArray(memory.buffer, ptr, len)`) valid only until the next
  `dispatch` (memory growth detaches old views — confirmed in the
  wasm-bindgen docs). `WasmCore.readLayer` rebuilds the view after every
  dispatch. Copying out every frame instead was rejected: 256 KB/frame at
  256² is wasted work on every single dispatch.
- Points are batched as `Int32Array` (interleaved x,y) — no per-pixel FFI
  calls, ever.
- **D9**: `pkg/` (the wasm-pack output) is committed; CI rebuilds it and
  diffs against the committed copy (drift check), with a pinned toolchain and
  wasm-pack version. Rejected: building Rust on Vercel directly, or
  publishing the package to npm (deferred to a 1.0 change).

## Consequences

- The Rust surface stays small — about a dozen functions
  (`flood_fill`, `Document::{new, stroke_begin, stroke_points, stroke_end,
  fill, undo, redo, layer_ptr, layer_len, revision}`).
- `core-config.ts`'s `resolveCore()` (phase 3: reads `import.meta.env.VITE_PIXEL_CORE`,
  falls back to a `localStorage['pf:core']` override, then `'ts'`) is already
  wired for a `'wasm'` value — it only needs a real `WasmPixelCore` behind it;
  no call site elsewhere in the app changes.
- `pixel-core.contract.test.ts`'s `describe.each` is the parity gate: the same
  command script run against `'ts'` and (once it exists) `'wasm'` must produce
  byte-equal buffers and equal undo state.

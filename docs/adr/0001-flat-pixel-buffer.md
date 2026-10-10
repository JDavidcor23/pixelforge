# 0001 — Flat pixel buffer, copy-on-write per batch

**Status**: Accepted (phase 1 of `migrate-to-rust-core`)

## Context

The editor originally stored each layer's pixels as `RgbaColor[][]` — a 2D
array of objects. This is slow to repaint (one object allocation per pixel,
no way to hand the data to `putImageData`/a Wasm boundary without a full
conversion) and makes a future Rust/Wasm core impossible without a rewrite.

## Decision

- **D1**: Replace `RgbaColor[][]` with `PixelBuffer { w, h, data: Uint8ClampedArray }`,
  row-major, `i = (y*w+x)*4`. This is the native shape both `putImageData`
  and a `wasm-bindgen` `&mut [u8]` boundary expect.
- **D2** (phase 1 only): mutate via copy-on-write **per batch** (e.g. once per
  pointer-stroke), not in place. An in-place-plus-revision-counter scheme was
  considered but rejected for phase 1 because it breaks the `useMemo` identity
  Konva's renderer relied on at the time; phase 2 later replaces identity-based
  memoization with an explicit revision counter (see the "render contract"
  note in `design.md`'s phase 2d section), making in-place mutation safe.

## Consequences

- Full 256×256 repaint went from ~4.2ms (baseline) to ~0.08ms — all phase 1–2
  gains build on this.
- Every `lib/*` module touching pixels needed a rewrite (`pixel-buffer`,
  `flood-fill`, `quantize`, `downscale`, `pixel-transform`, `image-decode`,
  `sprite-pipeline`, `retro-diffusion-utils`, `export-utils`, `canvas-renderer`).
- This is also the exact shape the Rust core's buffer functions take
  (`&mut [u8]`), so no second buffer-format migration is needed at phase 4+.

//! `pixelforge-core` — the Rust half of design.md's D5 "two seams":
//! `PixelKernels` (stateless, phases 4–6, this crate) under `PixelCore`
//! (stateful document, phase 7).
//!
//! Crate layout (hexagonal — see `LEARNING.md` for a plain-words walkthrough):
//! - `pixels` — the pure-Rust domain. No wasm-bindgen import anywhere in it;
//!   testable with plain `cargo test`, no wasm runtime needed.
//! - `flood_fill` — phase 5's compute-heavy kernel (4-connected, stack-based
//!   flood fill), built on top of `pixels`' validated-buffer primitives.
//!   Same hexagonal rule: no wasm-bindgen import.
//! - `bindings` — the ONLY module that imports `wasm_bindgen`. A thin
//!   pass-through to `pixels`/`flood_fill`, never business logic of its own.

mod flood_fill;
mod pixels;

pub mod bindings;

// Re-exported so `cargo test` (which compiles this crate as a plain `rlib`,
// see Cargo.toml) can exercise the domain directly; `wasm-pack build` only
// ever looks at what `bindings` marks `#[wasm_bindgen]`.
pub use pixels::*;

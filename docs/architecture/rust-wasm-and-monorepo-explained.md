# The monorepo and Rust/WebAssembly migration, explained simply

This page explains what changed in October 2026, why, and what the
measurements showed. It is the easy version. The detailed records are the ADRs
in `docs/adr/` and `openspec/changes/migrate-to-rust-core/`.

## The short version

1. The project was split into separate apps (a **monorepo**).
2. The way pixels are stored was changed. **This gave the biggest speed-up.**
3. Part of the pixel engine was rewritten in **Rust** and compiled to
   **WebAssembly**.
4. Rust was measured against TypeScript. It is faster for some tasks and slower
   for others, so **TypeScript is still the default** and Rust is behind a
   switch.

## Why the change started

Many companies report big speed-ups after moving code to Rust or Go. The idea
was: if the pixel engine runs in Rust, the editor will be faster. One rule was
set before starting: **every change must be measured against the previous
version.** That rule changed the conclusion.

## 1. Splitting the project (monorepo)

Before, one Next.js app served both the marketing page and the editor. The
editor only draws on a canvas in the browser. It does not need server
rendering, so it was paying for features it did not use.

```text
Before                          After (pnpm monorepo)
┌──────────────────────┐        apps/landing    → Next.js  (marketing page)
│ one Next.js app      │        apps/editor     → Vite + React (the editor)
│  - marketing page    │  ───▶  packages/core   → pixel engine (Rust → WebAssembly)
│  - editor            │        packages/tokens → shared colors and styles
└──────────────────────┘
```

Each app is deployed separately on Vercel and only redeploys when its own code
changes. Decision record: `docs/adr/0005-monorepo-split.md`.

## 2. Changing how pixels are stored (the real win)

Before, **every pixel was a JavaScript object**. A 256×256 image had 65,536
objects, so the computer had to create, track and clean up a lot of them.

After, the image is **one flat list of numbers**: 4 numbers per pixel (red,
green, blue, alpha), one after another. This is exactly the format the browser
uses to paint a canvas.

```text
Before:  [ {r,g,b,a}, {r,g,b,a}, {r,g,b,a}, ... ]   65,536 objects
After:   [ r,g,b,a, r,g,b,a, r,g,b,a, ... ]          one list of bytes
```

Undo was changed too. Before, every undo step saved a copy of the whole image.
Now it saves **only the small rectangle that changed**.

Results, still in TypeScript, before any Rust:

| Action | Before | After |
|---|---|---|
| Fill an area with the bucket tool (256×256) | 50 ms | 2.6 ms |
| Memory for undoing a 1-pixel stroke | 576 KB | 8 bytes |

Decision records: `docs/adr/0001-flat-pixel-buffer.md`,
`docs/adr/0003-dirty-rect-undo-history.md`.

## 3. What WebAssembly really is

A common belief is that WebAssembly "turns Rust into JavaScript". It does not.

- Rust is compiled into a **binary file** (`.wasm`).
- The browser runs that file in its own engine, **next to** JavaScript.
- WebAssembly has **its own memory**, separate from JavaScript's.
- Every time JavaScript sends data to WebAssembly, the data is **copied across
  a border**, like goods passing through customs.

```text
 JavaScript (the editor)          WebAssembly (Rust engine)
┌──────────────────────┐  copy   ┌──────────────────────┐
│ UI, tools, store     │ ──────▶ │ pixel calculations   │
│                      │ ◀────── │ (own memory)         │
└──────────────────────┘  copy   └──────────────────────┘
        each call pays the "customs" cost
```

So Rust wins when there is **a lot of work per call**, and loses when there are
**many tiny calls**.

## 4. What the measurements showed

| Task | TypeScript | Rust (WebAssembly) | Winner |
|---|---|---|---|
| Reduce the colors of an image (heavy math, few calls) | 5.51 ms | 1.51 ms | Rust, 3.6× faster |
| Shrink an image 512 → 64 (after fixing the algorithm) | 3.81 ms | 1.33 ms | Rust, 2.8× faster |
| Drawing with the pencil (many small calls) | — | 1.5–2× slower | TypeScript |
| 2,000 single-pixel calls | 0.098 ms | 145.5 ms | TypeScript, by far |

Two guesses were wrong and only measuring revealed it:

- The copy across the border was blamed for slowness. It was only **~1.6%** of
  the time. The real cost was the algorithm visiting pixels one by one.
- One Rust function was slower than TypeScript because of an inefficient data
  structure, not because of the language. After fixing it, Rust became 2.8×
  faster.

Source: `openspec/changes/migrate-to-rust-core/baseline-bench.md`.

## 5. The decision

- **TypeScript stays the default engine.** Rust is behind a switch
  (`VITE_PIXEL_CORE` / `pf:core`), so it can be turned on without redeploying.
- **Parity tests** run the same actions on both engines and check the results
  are byte-for-byte identical. A random "fuzz" test with 300 scenarios found a
  real bug this way.
- **CI watches performance**: it compares Rust and TypeScript in the same run
  and fails if Rust gets slower than the allowed ratio, or if the `.wasm` file
  grows past 150 KB (gzip).

## 6. How AI was used

The migration was carried out by AI coding agents, directed with rules:

- Decisions written down first (ADRs), with benchmarks as the judge.
- Separate agents per role: one for visual design, one to implement, one to
  review code quality.
- The design tool (Pencil) is connected through its MCP server, and the
  `/implementar` command turns a designed screen into code through that
  pipeline.

## What was learned

- The biggest gain came from **how data is stored**, not from the language.
- A faster language helps only where there is heavy work per call.
- **Measure before and after.** It turns a trend into an engineering decision.

## Where to read more

| Topic | File |
|---|---|
| Monorepo split | `docs/adr/0005-monorepo-split.md` |
| Flat pixel buffer | `docs/adr/0001-flat-pixel-buffer.md` |
| Undo by changed rectangle | `docs/adr/0003-dirty-rect-undo-history.md` |
| Rust ↔ JavaScript border | `docs/adr/0004-rust-wasm-boundary-shape.md` |
| All measurements | `openspec/changes/migrate-to-rust-core/baseline-bench.md` |
| Rust notes for a JavaScript developer | `packages/core/LEARNING.md` |

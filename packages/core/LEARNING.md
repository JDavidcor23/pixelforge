# Learning notes — Rust for a JS/React developer

Plain-words notes on the Rust concepts this crate uses, written while
porting the pixel-buffer kernels (phase 4, tasks 4.2a/4.5a). Each note points
at the exact lines where the concept shows up, so you can read the code next
to the explanation.

## 1. Ownership & borrowing — why `&[u8]` instead of `Vec<u8>`

In JS, every object/array is a reference — you never think about who "owns"
a `Uint8Array`, and the garbage collector cleans up whenever nothing points
at it anymore. Rust has no garbage collector. Instead, every value has
exactly ONE owner, and the compiler tracks this at compile time.

- `Vec<u8>` is an OWNED, growable byte buffer — like a `Uint8Array` you just
  `new`'d. Whoever holds the `Vec<u8>` is responsible for it; when it goes
  out of scope, Rust frees its memory automatically (no `free()` call, no
  GC pause — just a compile-time-inserted cleanup).
- `&[u8]` is a BORROWED, read-only VIEW into bytes someone else owns — like
  passing a `Uint8Array` to a function that promises not to keep a
  reference to it after the function returns. Inside PLAIN Rust (one Rust
  function calling another), this is zero-copy: no copy, no ownership
  transfer, just "let me look at your bytes for the duration of this call."
- `&mut [u8]` is a borrowed, WRITABLE view — "let me mutate your bytes in
  place, but I still don't own them and can't keep the reference." Also
  zero-copy between two Rust functions.

**Correction (this note originally got this wrong): that "no copy" guarantee
is a PLAIN-RUST fact, not a wasm-bindgen fact.** The moment one of these
types crosses the actual JS<->Wasm boundary (a `#[wasm_bindgen]` function
called FROM JS), wasm-bindgen's generated glue DOES copy: a `&[u8]` argument
is copied INTO Wasm linear memory for the call, and a `&mut [u8]` argument is
copied in AND copied back out once the call returns (see §4 below for the
full mechanics and why that costs real time). "Borrowed, not copied" is true
of the Rust-to-Rust borrow INSIDE the function body once the bytes are
already in Wasm memory — it says nothing about how those bytes got there.

See `src/pixels/mod.rs:51` (`get_pixel(data: &[u8], ...)`) — it only needs
to READ the buffer, so it borrows immutably. Compare `src/pixels/mod.rs:60`
(`put_pixel(data: &mut [u8], ...)`) — it WRITES into the buffer in place, so
it needs a mutable borrow. Neither function takes ownership (`data: Vec<u8>`)
because that would force the CALLER to give up the buffer just to read one
pixel from it — in JS terms, like a function that "consumes" your array so
you can never use it again after calling it.

`src/pixels/mod.rs:75` (`clone_buffer`) is the one function that returns an
OWNED `Vec<u8>` — it explicitly copies the input into a brand new buffer the
caller now owns, mirroring `pixel-buffer.ts`'s `cloneBuffer` (design D2: one
copy per batch, never aliased).

## 2. Slices and bounds-checking

A "slice" (`&[u8]`, `&mut [u8]`) is a pointer + a length, checked by Rust at
EVERY index access — `data[i]` panics (crashes that thread) if `i` is out of
range, it never silently reads garbage memory or wraps into the next row the
way a raw pointer would in C.

That's why every function in `src/pixels/mod.rs` checks bounds BEFORE
indexing — but `in_bounds` (a coordinate inside `0..w`/`0..h`) is only HALF
of it (phase 4f correction: this note originally described only the
coordinate check and skipped the other half of what actually guards every
function today). The other half is `valid_buffer`/`buffer_len` — the slice
LENGTH itself must match the DECLARED `w*h*4` before any coordinate math
even runs, because a `u32` coordinate coming from JS can be an arbitrary
value (wasm-bindgen coerces a negative JS number into a huge `u32`), and
plain `u32` arithmetic computing a byte offset can WRAP in a release build
(`overflow-checks` is off by default) — passing a bogus-but-"in-bounds-after-
wrapping" index straight at `data[i]`. `get_pixel` (`src/pixels/mod.rs`)
checks `valid_buffer(data, w, h)` AND `in_bounds(w, h, x, y)` before ever
computing an index, and the index computation itself (`index`) uses
`checked_add`/`checked_mul` so even a correctly-bounds-checked-but-huge `w`/
`h` combination can't silently overflow into a wrong offset. This is a
DELIBERATE design choice (see "Result/Option" below), not Rust forcing it —
Rust would have caught an out-of-range index with a panic either way; these
checks turn a potential crash (or worse, a silent wrap into the wrong memory
address) into a normal, recoverable "no" answer.

## 3. `Option`/`Result` at the FFI boundary — why not exceptions

JS has `throw`/`try`/`catch`. Rust has two plain enum types for "this might
not produce a value" (`Option<T>` = `Some(value)` or `None`) and "this might
fail with an error" (`Result<T, E>` = `Ok(value)` or `Err(error)`). Neither
unwinds the call stack the way a JS exception does.

This crate uses ONLY `Option`/`bool` returns, never `Result`/panics, at the
JS boundary — see `src/bindings.rs`: `get_pixel` (line 21) returns a plain
`u32` (0 for "out of range", chosen because wasm-bindgen can return `u32`
directly with zero marshalling, and the TS facade re-derives `undefined` the
same way the TS reference implementation would — see
`src-ts/wasm-core.ts`'s `getPixel` wrapper); `put_pixel`/`write_rect` (lines
30, 68) return `bool`; `diff_rect`/`extract_rect` (lines 44, 52) return
`Option<...>`, which wasm-bindgen turns into `undefined` on the JS side for
`None`.

**Correction (this note originally got the panic behavior wrong):** a Rust
panic that crosses into Wasm does NOT silently abort in a way JS can't react
to — wasm-bindgen's generated glue turns it into a real, CATCHABLE
`WebAssembly.RuntimeError` on the JS side (confirmed via a throwaway probe
script during judgment-day: `try { mod.put_pixel(tooShortBuffer, ...) } catch
(e) { /* e instanceof WebAssembly.RuntimeError */ }` catches it cleanly, and
a SUBSEQUENT call into the same Wasm instance can still succeed). What a
panic DOES leave behind is messier than a clean "no": this crate's
`panic = "abort"` profile (`Cargo.toml`) means a panic never unwinds and runs
Rust-side cleanup (`Drop` impls) — any memory the panicking call had
allocated on the Wasm heap (e.g. a partially-built `Vec` return value) is
simply never freed, a real per-panic memory leak for the life of that Wasm
instance, even though the instance itself keeps running. THIS is the actual
reason the boundary must never panic: not because one panic kills the whole
program (it doesn't), but because every panic a long-lived session survives
is a small, permanent leak, and panicking is simply the wrong tool for
"the caller sent bad input" when `None`/`false` says the same thing without
the leak. A boundary function that might receive bad input from JS (an
out-of-range coordinate, a mismatched patch length) must turn that into a
plain "no" value, never a panic — see the crate-level rule: no `.unwrap()` on
anything that came from JS.

## 4. How wasm-bindgen copies `&mut [u8]` in and out

This is the one piece of "ownership" that genuinely surprised a JS
background: calling a Wasm function is NOT like calling a JS function in the
same process. Wasm has its OWN separate memory (a `WebAssembly.Memory`, a
big `ArrayBuffer`), isolated from JS's heap. There is no way for JS and Rust
to point at the "same" `Uint8ClampedArray` the way two JS closures can share
one array.

So when JS calls `put_pixel(data, w, h, x, y, rgba)` with a JS
`Uint8ClampedArray` for `data`:

1. wasm-bindgen's generated glue COPIES `data`'s bytes INTO Wasm's linear
   memory (a `malloc`-like allocation inside the Wasm instance).
2. The Rust function (`src/bindings.rs:30`) runs, mutating that COPY in
   place (it has no idea it's a copy — from Rust's point of view it's just a
   normal `&mut [u8]`).
3. Because the parameter was declared `&mut [u8]` (not `&[u8]`), the
   generated glue copies the (now-mutated) bytes back OUT into the ORIGINAL
   JS `Uint8ClampedArray` once the call returns.

Net effect: the caller's array ends up mutated, exactly as if it had been
passed by reference — but under the hood it cost TWO copies (in, then out),
not zero.

**Correction (this note originally misattributed WHY this is so slow):** the
cost isn't a fixed per-call tax — it's `O(buffer size)`, because EVERY call
copies the WHOLE `data` array, not just the bytes the function actually
touches. `put_pixel` only ever reads/writes 4 bytes, but every single call
still pays for copying the ENTIRE layer buffer (256 KB for a 256×256 layer)
in, and then copies the entire buffer back out again — the "4 useful bytes"
are a vanishingly small fraction of the "256 KB moved" cost. This is
confirmed in design.md's "Interfaces / Contracts" section and is exactly why
the bench in `bench/pixel-kernels.bench.ts` measures a per-pixel Wasm call as
~1480x SLOWER than the equivalent TS call (see `baseline-bench.md`'s "Phase
4" section): it isn't that Wasm is 1480x slower at writing one pixel, it's
that each call is secretly a full-buffer `memcpy` in each direction, and
THAT cost scales with the buffer, not with the one pixel actually written.
The fix isn't "make Wasm faster", it's "call it less often, with a bigger
buffer each time, so the fixed copy cost is amortized over more real work per
call" — which is exactly why `stroke.points` (design D6/D7) batches an
entire pointer-drag gesture into ONE `Int32Array`+one dispatch, never one
call per point, and why `extractRect`/`writeRect` operate on a whole
dirty-rect patch at once (still a whole-buffer copy per call, but doing real
work proportional to the PATCH size, not a single pixel, each time it pays
that cost).

A `Vec<u8>`/`Box<[u32]>` RETURN value (`clone_buffer`, `diff_rect`,
`extract_rect` — `src/bindings.rs:37,44,52`) is always a fresh copy handed to
JS as a new `Uint8Array`/array-like — there's no way to hand JS a "view" into
Wasm memory through wasm-bindgen's safe, high-level API at all; that's a
lower-level technique (raw pointers + `memory.buffer`) design.md's phase 7
`Document` surface uses instead (`layer_ptr`/`layer_len`), deliberately
deferred past this phase.

## 5. Why the domain module has no wasm-bindgen imports (hexagonal)

`src/pixels/mod.rs` never writes `use wasm_bindgen::...` or
`#[wasm_bindgen]` anywhere — it is pure, ordinary Rust that could be compiled
for ANY target (a native CLI tool, a different WASM runtime, whatever).
`src/bindings.rs` is the ONLY file that imports `wasm_bindgen` (see its
module doc) — every exported function there is a thin one-line pass-through
to `crate::pixels` (e.g. line 21's `get_pixel` just calls
`pixels::get_pixel(...).unwrap_or(0)`).

This mirrors the SAME hexagonal split this codebase already uses on the TS
side — `lib/core/ts-core.ts` (the engine) vs. the `PixelCore`
interface/`core.slice.ts` (the adapter that talks to Zustand). The payoff is
identical in both languages: `cargo test` runs `src/pixels/mod.rs`'s tests
(see §6) with ZERO Wasm runtime involved — no browser, no Node wasm loader,
just plain native Rust, which is why those 9 tests finish in under a
millisecond. If `bindings.rs` had any real logic in it (not just
pass-throughs), testing it would require a Wasm runtime for every test run.

## 6. Running `cargo test`

```sh
cd packages/core
cargo test
```

This compiles the crate TWICE under the hood: once as a normal native binary
(to run the `#[cfg(test)] mod tests` block at the bottom of
`src/pixels/mod.rs`, line 197) and once as a doc-test harness (0 doc-tests
here — none of the `///` comments contain runnable ` ```rust ` examples).
It does NOT touch `wasm32-unknown-unknown` or produce any `.wasm` file —
that only happens via `pnpm run build:wasm` (which runs `wasm-pack build`,
see §4's note on why that's a separate, slower step). `Cargo.toml`'s
`crate-type = ["cdylib", "rlib"]` is what makes BOTH possible from the same
source: `cdylib` is what `wasm-pack` needs, `rlib` is what lets `cargo test`
link and run a normal test binary.

Lint/format gates (same commands CI runs):

```sh
cargo fmt --check          # formatting only, no logic changes
cargo clippy --all-targets -- -D warnings   # lints, treated as hard errors
```

## Phase 5 — flood-fill: `Vec` as a stack, `while let`, no recursion, `u32` packing, and how the result gets back to JS

Written while porting `flood_fill` (`src/flood_fill.rs`), this package's first
COMPUTE-HEAVY kernel (a graph walk, not a near-memcpy buffer op like phase
4's kernels).

### 7. `Vec<usize>` as a stack — no special "stack" type needed

JS doesn't have a Rust equivalent you'd reach for by default either — you'd
just use a plain `[]` with `push`/`pop`. Rust's `Vec<T>` (the same growable,
heap-allocated, owned array type from §1) already has exactly those two
methods, with exactly stack semantics (`pop` removes and returns the LAST
element pushed) — see `src/flood_fill.rs:90` (`let mut pending: Vec<usize> =
Vec::with_capacity(...)`) and the push/pop calls at the bottom of the loop.
There is no dedicated "stack" type in the standard library because `Vec`
already IS one; "stack" here describes how you're USING the type (always
push/pop at one end), not a different data structure.

### 8. `while let Some(p) = pending.pop()` — pattern-matching a loop condition

`Vec::pop()` returns `Option<T>`: `Some(value)` if there was something to pop,
`None` if the vec is empty (same `Option` type from §3 — "might not produce a
value", here meaning "might be empty"). `while let Some(p) = pending.pop() {
... }` (`src/flood_fill.rs:98`) is Rust's idiom for "keep looping, binding the
unwrapped value to `p`, for as long as this expression keeps matching
`Some(...)`; stop the instant it's `None`." The closest JS equivalent is:

```js
let p
while ((p = pending.pop()) !== undefined) { /* ... */ }
```

— except Rust's version can never accidentally loop forever on a real `None`
the way the JS version would misbehave if `undefined` were itself a valid
stack value; `Option` makes "empty" a distinct, unambiguous case from any
actual value `T` could be (including `0`, `false`, or JS's own `undefined`).

### 9. Why no recursion — a concrete number, not just "it's unsafe"

A textbook recursive flood fill looks tempting: "fill this pixel, then
recursively fill each unvisited neighbor." In Rust (or any language), each
recursive call adds one frame to the CALL stack — a fixed-size region
(typically a few MB) completely separate from the heap `Vec<T>`/`String`/etc.
allocate into. A fully-connected 256x256 region (65,536 pixels, the
`bounded_stack_handles_a_large_fully_connected_canvas_without_overflow` test
at the bottom of `src/flood_fill.rs`) would recurse 65,536 levels deep — at
even a conservative ~100 bytes of stack per frame (the pixel coordinates,
return address, saved registers), that's ~6.4 MB, likely past the limit
before the fill ever finishes. Worse in Wasm specifically: this crate's
`panic = "abort"` profile (`Cargo.toml`) means a stack overflow aborts the
WHOLE Wasm instance with no `WebAssembly.RuntimeError` to catch (unlike an
ordinary panic — see §3) — the page would need to reload the module
entirely, not just fall back for one call. The fix (`pending: Vec<usize>`,
an EXPLICIT stack on the HEAP) has no such limit: a `Vec` can grow until the
heap itself is exhausted (far larger than the call stack, and Rust's own
allocator fails with a clean, catchable error rather than a silent
instance-ending abort). Same reasoning explains why `lib/flood-fill.ts`
(the TS reference this mirrors) was ALREADY stack-based before this port —
the JS call stack has the identical limit, for the identical reason.

### 10. `u32` packing: `pack_rgba`/`unpack_rgba` round-trip a color as one number

A color is 4 separate `u8` values (0-255 each), but the FFI boundary (design
D6: "no serde") can only carry plain numbers, not a `{r,g,b,a}` struct,
without extra marshalling machinery this crate deliberately avoids. The fix:
pack all 4 bytes into the 4 BYTE-POSITIONS of a single `u32` — `pack_rgba`
(`src/pixels/mod.rs:44`, called from `src/flood_fill.rs:83` to unpack the
caller's fill color) does `(r << 24) | (g << 16) | (b << 8) | a`: shift each
byte left by a multiple of 8 bits into its own "slot," then OR them together
(`|` never loses a bit here because each byte only ever occupies ITS OWN 8
bits of the 32, nothing overlaps). `unpack_rgba` reverses it: shift the whole
`u32` right by each color's offset, then mask with `& 0xff` to keep only the
lowest 8 bits (discarding whatever shifted into the higher bits). This is
pure arithmetic — no `DataView`, no endianness dependency on either side of
the FFI boundary, which is exactly why `apps/editor/src/lib/core/color-codec.ts`'s
`packRgba`/`unpackRgba` use the identical shift amounts: the SAME `u32` value
means the SAME color regardless of whether a browser happens to be
little-endian or big-endian internally.

### 11. How `flood_fill`'s result crosses back to JS: a tuple that isn't allowed to exist at the boundary

`crate::flood_fill::flood_fill` (the pure-Rust domain function,
`src/flood_fill.rs:59`) returns `Option<(u32, u32, u32, u32)>` — `None` for
"nothing changed," or a plain 4-tuple `(x, y, w, h)` for the dirty rect. A
Rust tuple is a perfectly normal type ON THE RUST SIDE, but wasm-bindgen's
`#[wasm_bindgen]` macro (`src/bindings.rs`) cannot export a function that
returns one directly — the glue code it generates only knows how to convert
a fixed set of types (numbers, strings, `Option`, `Vec`/`Box<[T]>`, and a few
others) into their JS equivalents, and a tuple isn't one of them. The wrapper
in `bindings.rs:106` bridges this with `.map(...)`: `Option::map` runs a
closure on the INSIDE value only if it's `Some(...)`, leaving `None` as
`None` — exactly the same `Option`-as-"maybe a value" idea from §3, just
used to TRANSFORM the value instead of reject it. The closure
`|(fx, fy, fw, fh)| vec![fx, fy, fw, fh].into_boxed_slice()` destructures the
tuple into 4 named values, then builds a `Vec<u32>` from them (`vec![...]`,
the same macro `src/pixels/mod.rs`'s tests use for a literal byte buffer) and
converts it to a `Box<[u32]>` — a type wasm-bindgen DOES know how to export
(as a JS `Uint32Array`-like value). So the full path a dirty rect takes is:
Rust tuple -> (only if `Some`) a freshly-allocated `Vec`/`Box<[u32]>` -> a
JS-visible typed array of exactly 4 numbers, or `undefined` for `None`. This
is the SAME pattern `diff_rect` already used one function above it
(`src/bindings.rs:44`) — `flood_fill` just reuses it for a different-shaped
tuple.

### 12. One optimization attempt that failed, and WHY (the value of measuring, not guessing)

`src/flood_fill.rs`'s module doc ("One optimization attempt, reverted")
describes a change that looked obviously correct and strictly cheaper on
paper — drop the `visited` array, rely on "already filled, can't match
`target` anymore" instead — and turned out to make the Wasm bench NUMBERS
WORSE, not better, when actually measured (`baseline-bench.md`'s "Phase 5"
section has the before/after tables). The lesson generalizes past Rust: a
"fewer allocations" argument sounds right, but `visited[p]` is ONE byte read;
rejecting a duplicate via the color check instead needs FOUR byte reads
(`data[i]` through `data[i+3]`) every single time a duplicate entry is popped
— and a 4-connected flood fill produces up to 4 duplicate entries per pixel,
so this tiny per-check cost gets paid often enough to outweigh what the
allocation would have saved. The fix for an underperforming "optimization"
here wasn't more cleverness, it was reverting to the version that was already
faster and writing down WHY, so the next person (or agent) doesn't repeat the
same experiment from scratch.

## Phase 5f — scanline span fill, `opt-level`, and correcting a wrong guess about the FFI boundary

Fix-agent pass after phase 5's flood-fill shipped at ~2.3x-2.6x faster than
TS (below the proposal's 3x target). Two blind judges (scratchpad `judgeB5`)
measured WHERE the remaining time actually went, instead of guessing — the
previous handoff's "next steps" note guessed the per-call FFI whole-buffer
copy might be worth attacking; the measurement said otherwise.

### 13. The "FFI copy" guess was wrong — measured at ~1.6% of total time, not the bottleneck

`judgeB5/decomp.mts` isolated the FFI marshalling cost on its own, with a
bench that does nothing but pay the copy: calling `put_points` with ZERO
points on a 256KB `&mut [u8]` buffer (every other variable held constant —
same buffer size as the flood-fill benches, just no actual fill work). That
measured at roughly **1.6% of a full flood-fill call's time** — i.e. if the
whole-buffer copy in and back out were somehow made FREE, the fastest
theoretically possible speedup from that alone is ~1.6%, nowhere near enough
to close a 3x-vs-2.3x gap. The real cost was always compute: the OLD
per-pixel stack algorithm did one 4-byte color-compare-and-maybe-write PER
PIXEL, including rejected duplicate pops (up to 4 per pixel for a
4-connected fill) — `O(w*h)` operations of CPU work, not `O(1)` FFI
overhead. The lesson: "the boundary is probably the bottleneck" is a
reasonable intuition for a near-memcpy kernel (phase 4's buffer ops, where
it WAS measured true — see §4's ~1480x-slower-per-pixel-call finding), but
it does not automatically carry over to every kernel; a compute-heavy kernel
needs its OWN measurement, not an inherited assumption.

### 14. Scanline span fill: trading per-pixel work for per-span work

`src/flood_fill.rs` was rewritten from "one stack entry per PIXEL" to "one
stack entry per contiguous horizontal RUN of same-colored pixels" (a
`Vec<(usize, usize)>` of seed POINTS, not per-pixel indices). `fill_span_row`
expands left/right from a seed column until the color stops matching, then
fills the WHOLE run with one tight loop — no per-pixel "is this still
unvisited?" branch inside that loop, because a pixel this function has just
filled can never match `target` again (the same property that makes a
separate `visited` array unnecessary here — simpler than §12's story, since
the scanline version never needed one to begin with, not even as a reverted
experiment). For a large open region this cuts stack push/pop traffic from
`O(w*h)` to roughly `O(h)` (one span discovered per row), which is where the
real speedup came from — both TS and Wasm got dramatically faster in
ABSOLUTE terms (see `baseline-bench.md`'s "Phase 5f" section: Wasm's mean
time roughly HALVED or better on both bench shapes).

### 15. A faster algorithm can SHRINK the Wasm/TS ratio even while making Wasm itself faster

Counterintuitive result, re-confirmed over 3 consecutive bench runs (not a
one-off fluke): after the scanline rewrite, Wasm's absolute flood-fill time
dropped a lot — but TS's dropped by MORE, proportionally, so the Wasm/TS
RATIO actually moved further from the 3x target than phase 5's per-pixel
version was (full-fill: ~1.3x faster now vs ~2.5x then; maze/holes: ~2.0x
faster now vs ~2.4x then — see `baseline-bench.md` for the full numbers).
The mechanism: JS pays more PER-OPERATION overhead than compiled Wasm does
(bounds checks, inline-cache misses, typed-array access indirection) — the
per-pixel algorithm did many more operations, so TS was paying that
per-operation tax many more times than Wasm's compiled code effectively was.
Cutting the operation COUNT (per-span instead of per-pixel) removes
proportionally MORE of that JS-specific tax than it removes of Wasm's
already-smaller per-operation cost, so the GAP between them narrows even
though BOTH got faster. The takeaway for future kernel ports: "make it
faster" and "make Wasm win by a bigger margin" are not the same goal, and a
genuinely better algorithm can legitimately move the ratio the "wrong" way
while still being an unambiguous net win (lower absolute latency for every
real user, on either implementation).

### 16. `opt-level`: "optimize for size" isn't always smaller once a kernel does real compute

`Cargo.toml`'s `[profile.release]` switched from `opt-level = "z"`
(optimize for size) to `opt-level = 3` (optimize for speed) for this phase.
Measured, not assumed: the gzip'd `.wasm` at `opt-level = 3` came out
SMALLER than at `"z"` on the SAME scanline source (10,273 bytes vs 11,833
bytes) — `"z"` is tuned to avoid inlining/loop-unrolling that grows code
size on a large codebase with many call sites sharing logic; at this
crate's small size, with `lto = true` and `codegen-units = 1` already
doing aggressive whole-program dead-code elimination, `opt-level = 3`'s
extra inlining does not add enough NEW code to outweigh the (modest, for a
crate this size) runtime-focused codegen improvements — so this crate gets
BOTH a faster and a smaller binary from the switch, not a size-for-speed
tradeoff. This is a result specific to this crate's current size and shape,
not a universal "opt-level 3 is always smaller" rule — re-measure if this
crate grows substantially (phases 6-7 add real surface area).

## Phase 6 — quantize + downscale: `f64` vs JS `number`, iterators, `Vec::with_capacity`, why NOT sorting, and the simplest possible wasm-bindgen return

Written while porting `quantize.rs`/`downscale.rs` — this package's first
kernels that return a brand NEW owned buffer (not mutate in place) and the
first that do real floating-point math, not just integer byte-shuffling.

### 17. `f64` IS a JS `number` — not "close enough", bit-identical

A JS background teaches you to be suspicious of floating point across
languages ("floats never match exactly"). That caution does NOT apply here:
JS has exactly ONE numeric type for everything that isn't a `BigInt`, and
that type is defined by the ECMAScript spec as IEEE 754 double-precision —
the EXACT SAME 64-bit format as Rust's `f64`. `(mx - mn) / mx` on a JS
`number` and `(mx - mn) / mx` on a Rust `f64` are the same hardware
operation, not an approximation of one. `quantize.rs:73-82`'s `saturation`
casts its `u8` inputs to `f64` BEFORE doing any arithmetic
(`let (r, g, b) = (r as f64, g as f64, b as f64);`, line 74) specifically so
every later operation runs in that exact format — casting to `f32` instead
(a tempting "we only need 0-255 precision" shortcut) would have rounded
differently than the JS oracle at the very first subtraction, and every
downstream centroid computation would have silently drifted from it. The
module doc at the top of `quantize.rs` (lines 13-34) explains the one place
this parity needs a human decision anyway: `Math.round` and `f64::round`
actually DISAGREE for negative half-values (JS rounds toward +Infinity,
Rust rounds away from zero) — irrelevant here only because every value
either language ever rounds in this file is a weighted mean of non-negative
channel bytes, never negative.

### 18. `127.5`: a constant that is NOT allowed to become an integer

`downscale.rs`'s module doc (lines 17-27) documents the one spot where
"just use an integer, it's basically the same" would have silently changed
behavior: the oracle's fallback core-alpha threshold is `ALPHA_OPAQUE / 2`
= `255 / 2`, which is the EXACT floating-point value `127.5` in JS, not the
truncated integer `127`. `OPAQUE_TRANSPARENT_SPLIT: f64 = 127.5` (line 36)
and `core_alpha: f64` (never `u8`/`u32`) throughout `dominant_color`
(`a as f64) < core_alpha`, line 100) keep that half-integer alive end to
end — an alpha byte of exactly `127` must compare LESS than it (excluded
from "core") while `128` must compare GREATER (included), and a rounded
integer constant of `127` would flip which side `127` itself falls on.
`alpha_127_vs_128_falls_on_opposite_sides_of_the_fallback_core_threshold`
(`downscale.rs:337-351`) is a permanent regression test for exactly this —
it would fail immediately if that constant were ever "simplified" to `127`.

### 19. Iterators vs index loops — same algorithm, different idiom, same order

The oracle (`quantize.ts`) uses classic `for (let i = 0; i < n; i++)`
index loops almost everywhere Lloyd's algorithm needs to track WHICH
centroid is closest. Rust CAN write that same index loop (and
`downscale.rs`'s `has_solid_core`, lines 50-60, does — a manual
`while i < data.len() { ...; i += channels; }`, because it needs to stride
by `CHANNELS` through a flat byte buffer, which an iterator over bytes
doesn't naturally express). But wherever the Rust port ALSO needs the
index (not just the value) alongside idiomatic iteration, `.iter().
enumerate()` is the standard replacement — see `build_palette`
(`quantize.rs:139`, `for (pi, p) in points.iter().enumerate()`, and line
171, `for (ci, c) in centroids.iter().enumerate()`): `enumerate()` pairs
each element with its position, so the loop body reads almost identically
to the JS `for (let i = 0; i < centroids.length; i++)` version while the
compiler still proves `c`/`p` can never be an out-of-bounds access (no
separate `centroids[i]` indexing that COULD panic if the index were ever
wrong — the iterator can only ever hand out valid elements it actually
holds). Importantly, this change of IDIOM never changes the ORDER of
iteration — both forms visit `points`/`centroids` in exactly the same
left-to-right sequence the oracle does, which matters for this algorithm's
tie-breaking rules (see note 21).

### 20. `Vec::with_capacity` — telling Rust how big a `Vec` will get, ahead of time

A JS `Array` (or `push`) never asks you to think about this — V8 handles
growing the backing storage invisibly. Rust's `Vec<T>` does the same thing
automatically (`Vec::new()` starts empty and grows/reallocates as you
`push`), but every reallocation COPIES every existing element into the new,
bigger backing memory — wasted work if you already know the final size (or
a safe upper bound). `quantize.rs:225` (`let mut points: Vec<Point> =
Vec::with_capacity(data.len() / channels);`) reserves space for the
WORST CASE up front — "at most one point per pixel" is knowable the
instant you know `data.len()`, even though the ACTUAL count will usually be
smaller (pixels below `alpha_threshold` are skipped) — so the loop that
follows (lines 226-241) never reallocates even once. This is the exact
same optimization `flood_fill.rs`'s `pending: Vec<(usize, usize)>` uses
(`LEARNING.md` §7, `Vec::with_capacity(height.max(1))`) for a different
reason (a provable upper bound on outstanding seeds, not buffer size) —
the lesson generalizes: wherever you can state an upper bound on a `Vec`'s
final length BEFORE the loop that fills it starts, `with_capacity` turns
"maybe several reallocating copies" into "exactly one allocation, zero
copies."

### 21. Why this phase does NOT sort or dedup its buckets (and what it does instead)

A natural instinct on seeing `downscale.rs`'s `dominant_color` collect
pixels into per-color buckets (`buckets: HashMap<u32, BucketStats>`, line
86) is "sort them by count, take the first" — `Vec::sort`/`sort_by_key`
would do that in one line. This port deliberately does NOT do that,
because the oracle's tie-break rule (`downscale.ts`'s `dominantColor`) is
"the FIRST bucket a JS `Map` encounters, among those sharing the max
count" — and a JS `Map`'s iteration order is INSERTION order, which has
nothing to do with sorted order. Sorting by count would silently change
WHICH bucket wins a tie whenever two colors have the same pixel count but
were discovered in a different relative order than a sort would put them
in — a real, observable behavior change, not a performance-neutral
rewrite. The fix: `order: Vec<u32>` (line 85) is a second, parallel
collection that records each NEW key's position the first time it's seen
(`order.push(key)`, line 126, inside the `None =>` branch only — an
EXISTING key never gets pushed again), so the tie-break loop at lines
136-144 walks keys in the exact order the oracle's `Map` would — a
`HashMap` alone has no defined iteration order at all, so this "order"
vec is not an optimization, it is the ONLY thing making the tie-break
deterministic and oracle-correct. `Vec::dedup` doesn't apply here either,
for a related reason: it only removes ADJACENT duplicate elements (it
assumes you already sorted, or don't care about ties), while this
algorithm needs to accumulate stats across entries that were never
adjacent and never gets "duplicates" to remove in the first place (each
key appears in `buckets` exactly once, by construction of `get_mut`/
`insert` at lines 109-128).

### 22. The simplest possible wasm-bindgen return: when you DON'T need the tuple trick

§11 of this file explained why `flood_fill`'s Rust-side `Option<(u32, u32,
u32, u32)>` needs a manual `.map(|(fx,fy,fw,fh)| vec![...].into_boxed_
slice())` in `bindings.rs` (lines 113-116 today) — wasm-bindgen cannot
export a function that returns a raw tuple. `quantize`/`downscale`'s
bindings (`bindings.rs:125-140` and `147-156`) need NONE of that
machinery: both already return `Option<Vec<u8>>` from their pure-Rust
functions (`quantize.rs:208-214`, `downscale.rs:165-179`), and `Vec<u8>` —
unlike a tuple — IS one of the types wasm-bindgen knows how to convert
directly (into a JS `Uint8Array`), so the `#[wasm_bindgen]` wrapper
functions are pure one-line pass-throughs with no reshaping at all. Note
that MULTIPLE values absolutely still flow through this code — `nearest`
(`quantize.rs:95`) returns `Option<(f64, f64, f64)>`, and `dominant_color`
(`downscale.rs:75-83`) returns a plain `(u8, u8, u8, u8)` tuple — but
NEITHER of these crosses the wasm-bindgen boundary: they are Rust-calling-
Rust, where a tuple is just an ordinary, zero-ceremony type (no `#[wasm_
bindgen]` macro ever sees them). The lesson: the "tuples need packing"
rule from §11 is specifically an FFI-boundary rule, not a general Rust
rule — the moment a multi-value return stays on the Rust side of
`crate::bindings`, plain tuples are the normal, idiomatic choice again.

## Phase 6f (fix-agent pass — judges A6/B6)

### 23. Why the `HashMap` per cell in §21 was actually slow — and what replaced it

§21 above is now a description of OLD code, kept for its explanation of
*why* an insertion-order tie-break matters — but `downscale.rs`'s
`dominant_color` no longer uses a `HashMap` at all. Judge B6's adversarial
bench pass found the REAL cost phase 6's handoff mis-diagnosed as "FFI-copy
dominated" (same mistake §15 already warns about for flood-fill — always
measure the actual bottleneck, never guess from the shape of the problem):
a fresh `HashMap<u32, BucketStats>` allocated PER CELL. Two separate taxes,
both paid `target_w * target_h` times per call: (1) **hashing** — `HashMap`
defaults to SipHash, a cryptographically-strong but comparatively slow
hash function, to resist hash-flooding attacks the crate has no attacker
model for (this key is a plain `u32` derived from pixel data, not untrusted
request routing); (2) **heap allocation** — every NEW bucket key triggers
at least one allocation (the map's internal table growing), and a typical
64x64-target downscale of a photographic-noise source creates many
distinct buckets per cell.

The fix: two buffers, each allocated ONCE per `downscale` call (not once
per cell) and reused: `slot: Vec<u32>` (`1 << 15` entries — every possible
bucket key, since 3 channels x 5 bits each = 15 bits) as a direct array
index (`slot[key]`, zero hashing) mapping a key to its 1-based position in
`stats: Vec<BucketStats>` (0 means "not seen this cell"). `stats.clear()`
between cells is O(1) (keeps its allocated capacity — the SAME
`Vec::with_capacity`-adjacent lesson as §20, just via `clear` instead of
`with_capacity` up front, since a cell's bucket count isn't knowable in
advance). Resetting `slot` back to empty after a cell is done loops over
`stats` (the buckets THIS cell actually touched), not the whole 32K-entry
table — so the reset cost scales with "how many distinct colors appeared",
not with the table's total size. Result: ~2.8x FASTER than TS where phase
6 measured ~1.18x SLOWER — a correctness-neutral (byte-identical, fuzzed to
40,007 cases) rewrite of the DATA STRUCTURE, not the algorithm.

### 24. `wasm32`'s `usize` is 32 bits — your `cargo test` host's is probably not

`target_w as usize * target_h as usize * CHANNELS` (and similarly `ty *
src_h`, `tx * src_w`) looks like ordinary, safe arithmetic when you write
and test it on a 64-bit development machine, where `usize` is 64 bits and
the numbers involved (bounded by `u32`) can never realistically overflow.
But this crate COMPILES to `wasm32-unknown-unknown`, where `usize` is only
32 bits — exactly the same width as the `u32` dimensions themselves. Two
individually-"valid" `u32` values (e.g. `target_w = target_h = 32768`) can
have a PRODUCT that overflows a 32-bit `usize` even though neither factor
is anywhere near `u32::MAX` — `32768 * 32768 * 4 == 2**32`, which wraps to
`0` on a 32-bit `usize`, confirmed to trap the real compiled `.wasm`
(`RuntimeError: unreachable`) via direct execution. A `cargo test` run on
the development machine would NEVER catch this: the identical Rust source,
compiled for the host's 64-bit target, computes the "same" multiplication
without wrapping, because the host's `usize` is simply wider. The fix
(`downscale.rs`'s `cell_range` helper and the allocation-size check)
widens every such product to `u64` BEFORE multiplying — `u32::MAX as u64
* u32::MAX as u64` (~1.8e19) never overflows `u64` (~1.8446e19), so this
is unconditionally safe for any two `u32`-range inputs regardless of which
target the code eventually runs on — and the result is range-checked back
into `usize` (`checked_mul`/`try_from`) rather than assumed to fit. The
test suite proves this WITHOUT needing an actual `wasm32` test runner or
a multi-gigabyte allocation: `cell_range` is called directly with
`u32::MAX`-scale inputs, which stays cheap (no buffer, just arithmetic) and
genuinely exercises the overflow-prone code path regardless of the test
host's own pointer width — the LESSON generalizes to any `usize` math in a
crate that targets `wasm32`: trusting "it worked when I ran `cargo test`"
is not evidence it is safe on the actual deployment target, if the
computation's magnitude is anywhere near `u32::MAX` on a target where
`usize` is narrower than the host that ran the test.

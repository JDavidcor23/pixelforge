#!/usr/bin/env node
// W1 (phase 4f, judgment-day): makes the committed `pkg/` OS-independent.
//
// Confirmed via a binary scan of the PRE-FIX `pkg/pixelforge_core_bg.wasm`:
// it embeds the literal string `src\pixels\mod.rs` — a Windows-style
// backslash path baked in by rustc's `file!()` macro (used by the compiler
// for a slice-index panic location it can't fully prove unreachable, even
// though every reachable call path in this crate validates bounds first).
// On Linux CI, the SAME source compiles to `src/pixels/mod.rs` (forward
// slash) — a byte-for-byte DIFFERENT `.wasm`, even with zero actual logic
// changes. That means `git diff --exit-code packages/core/pkg` (the CI
// drift check) would ALWAYS report drift on Linux CI for a `pkg/` built on
// a Windows dev machine, defeating the whole point of committing `pkg/` and
// diffing it (design D9).
//
// Fix: `--remap-path-prefix` tells rustc to replace this crate's absolute
// build path with a FIXED virtual path in every embedded string, so the
// embedded path is identical regardless of which OS or checkout directory
// actually built it. The "FROM" side is computed HERE, per invocation, from
// this script's own location — so it always matches rustc's real absolute
// build path for that specific run, on whichever OS is running it.
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join, relative } from 'node:path'
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))
const crateDir = resolve(here, '..') // packages/core

const VIRTUAL_CRATE_PATH = '/pixelforge-core'
const VIRTUAL_CARGO_HOME = '/cargo-home'
const VIRTUAL_RUSTUP_HOME = '/rustup-home'

// Fix-agent 5f.6: `--remap-path-prefix` only rewrites paths it is told
// about. The crate's own source dir was already remapped (W1, phase 4f) —
// but ANY dependency this crate adds later lives under `$CARGO_HOME`
// (`~/.cargo/registry/src/...`, `~/.cargo/git/checkouts/...`) and the
// toolchain's own std-lib sources live under `$RUSTUP_HOME`. Either one
// embedding a `file!()`-macro path (the exact same bounds-check-panic
// mechanism W1 found for THIS crate's own sources) would reproduce the
// identical cross-OS drift-check false-positive the moment a new dependency
// is added, silently, with no new W1-style investigation to explain why.
// Remapped here up front so that day never requires re-discovering this.
const cargoHome = process.env.CARGO_HOME ? resolve(process.env.CARGO_HOME) : join(homedir(), '.cargo')
const rustupHome = process.env.RUSTUP_HOME ? resolve(process.env.RUSTUP_HOME) : join(homedir(), '.rustup')

const remapFlags = [
  `--remap-path-prefix=${crateDir}=${VIRTUAL_CRATE_PATH}`,
  `--remap-path-prefix=${cargoHome}=${VIRTUAL_CARGO_HOME}`,
  `--remap-path-prefix=${rustupHome}=${VIRTUAL_RUSTUP_HOME}`,
].join(' ')
const existingRustflags = process.env.RUSTFLAGS ? `${process.env.RUSTFLAGS} ` : ''

console.log(`[build-wasm] RUSTFLAGS: ${existingRustflags}${remapFlags}`)

const result = spawnSync('wasm-pack', ['build', '--target', 'web', '--out-dir', 'pkg', '--release'], {
  cwd: crateDir,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, RUSTFLAGS: `${existingRustflags}${remapFlags}` },
})

if (result.error) {
  console.error('[build-wasm] failed to spawn wasm-pack:', result.error)
  process.exit(1)
}
if ((result.status ?? 1) !== 0) {
  process.exit(result.status ?? 1)
}

// W1 (phase 4f, judgment-day), part 2: `--remap-path-prefix` above only
// rewrites an ABSOLUTE path prefix. It does NOT fix the separate problem a
// binary scan found: `rustc`'s `file!()` macro (used by the bounds-check
// panic location every slice index embeds, even on an unreachable path the
// compiler couldn't fully prove dead) records this crate's `.rs` files
// relative to the crate root, joined with the HOST'S NATIVE path separator —
// `src\pixels\mod.rs` on a Windows build, `src/pixels/mod.rs` on Linux CI.
// Two builds of byte-IDENTICAL source would therefore never byte-match
// across OSes, which is exactly what the CI drift check
// (`git diff --exit-code packages/core/pkg`) diffs against. Cargo's own fix
// for this (`profile.trim-paths`) is still unstable on this pinned stable
// toolchain (confirmed: `cargo` refuses the manifest with "feature
// `trim-paths` is required... not stabilized"), so this is a deliberate,
// narrow, deterministic substitute: replace ONLY the exact backslash form of
// every known `.rs` source path under `src/` with its forward-slash form, as
// a same-length in-place byte substitution (both separators are a single
// ASCII byte, so the file's total length — and every length-prefixed
// section elsewhere in the `.wasm` — is untouched). Scoped to known file
// paths (never a blind global `\`->`/` replace, which WOULD corrupt
// unrelated opcode/LEB128 bytes elsewhere in the binary that happen to equal
// 0x5C).
function listRustFiles(dir, base, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      listRustFiles(full, base, out)
    } else if (entry.endsWith('.rs')) {
      out.push(relative(base, full))
    }
  }
  return out
}

const srcDir = join(crateDir, 'src')
const relativeRustPaths = listRustFiles(srcDir, crateDir) // e.g. "src\pixels\mod.rs" on Windows, "src/pixels/mod.rs" on POSIX

const wasmPath = join(crateDir, 'pkg', 'pixelforge_core_bg.wasm')
const bytes = readFileSync(wasmPath)
let replacements = 0

for (const winPath of relativeRustPaths) {
  const posixPath = winPath.split('\\').join('/')
  if (winPath === posixPath) continue // nothing to normalize on a POSIX build host
  const from = Buffer.from(winPath, 'ascii')
  const to = Buffer.from(posixPath, 'ascii')
  let index = bytes.indexOf(from)
  while (index !== -1) {
    to.copy(bytes, index)
    replacements += 1
    index = bytes.indexOf(from, index + from.length)
  }
}

if (replacements > 0) {
  writeFileSync(wasmPath, bytes)
  console.log(`[build-wasm] normalized ${replacements} embedded Windows-style source path(s) to forward slashes for OS-independent drift-check output`)
}

// Fix-agent 5f.6: FAIL CLOSED instead of trusting the substitution above (or
// the RUSTFLAGS remap) silently worked. Re-reads the (possibly just
// rewritten) bytes and scans for exactly the three things that would
// reintroduce cross-OS drift-check false positives: (1) any backslash form
// of a known crate-relative `.rs` path that should have been normalized
// above — a leftover means the substitution loop missed one; (2) the raw
// absolute `crateDir`/`cargoHome`/`rustupHome` strings — a leftover means
// `--remap-path-prefix` didn't actually apply (e.g. a dependency path that
// doesn't fall under one of these three roots); (3) a generic
// `<path-with-backslash>.rs` pattern, which catches a backslash path this
// script's own `listRustFiles` scan didn't anticipate (e.g. a FUTURE source
// file added after this script was last touched, or a dependency's own
// `.rs` file under a path this scan doesn't enumerate).
const finalBytes = readFileSync(wasmPath)
const offenders = []

for (const winPath of relativeRustPaths) {
  if (winPath.includes('\\') && finalBytes.indexOf(Buffer.from(winPath, 'ascii')) !== -1) {
    offenders.push(`leftover crate-relative backslash path: "${winPath}"`)
  }
}

for (const [label, hostPath] of [
  ['crateDir', crateDir],
  ['cargoHome', cargoHome],
  ['rustupHome', rustupHome],
]) {
  if (finalBytes.indexOf(Buffer.from(hostPath, 'ascii')) !== -1) {
    offenders.push(`unremapped absolute host path (${label}): "${hostPath}"`)
  }
}

// Generic backslash-path-ending-in-.rs scan, decoded as latin1 (1 byte = 1
// char, so byte offsets/length are preserved for reporting — this is a
// read-only scan, no substitution happens here).
const asLatin1 = finalBytes.toString('latin1')
const genericBackslashRsPattern = /[A-Za-z0-9_.-]+(?:\\[A-Za-z0-9_.-]+)+\.rs/g
for (const match of asLatin1.matchAll(genericBackslashRsPattern)) {
  offenders.push(`unanticipated backslash-style .rs path: "${match[0]}"`)
}

if (offenders.length > 0) {
  console.error('[build-wasm] FAILED: the built .wasm still embeds host-specific or backslash-style path(s) — this WILL cause a false-positive drift-check failure on another OS/checkout. Found:')
  for (const offender of offenders) console.error(`  - ${offender}`)
  process.exit(1)
}

console.log('[build-wasm] post-build scan clean: no host-specific or backslash-style paths found in pixelforge_core_bg.wasm')
process.exit(0)

#!/usr/bin/env node
// Compares a Wasm kernel's bench mean against its TS counterpart, as a RATIO
// measured in the SAME run (design.md "Testing Strategy": "absolute times
// are noisy on CI"). Run with:
//   node --experimental-strip-types scripts/check-bench.ts [resultsJson] [thresholdsJson]
// Defaults: bench/core-results.json, packages/core/bench/thresholds.json
// (both relative to the repo root this script is invoked from).
//
// Honesty rule (orchestrator instruction): this script never hides or
// reframes a bad ratio — it always prints every case's measured ratio, and
// only EXITS non-zero when a ratio exceeds its threshold.
//
// W7 (phase 4f) — FAILS CLOSED: this gate used to treat "the bench group a
// threshold entry names doesn't exist in the results" and "zero cases were
// checked at all" as a silent, exit-0 pass (a `console.warn` + `return`/
// `continue`). That is exactly backwards for a CI gate — a renamed bench
// group, a `thresholds.json` typo, or `pnpm run bench` silently producing an
// empty/malformed results file would all pass CI with a warning nobody reads
// in a scrollback, instead of failing the build. Every "missing" case below
// is now a load-bearing FAILURE, not a soft skip; `checked === 0` is a hard
// exit(1), not a warn-and-return.

import { readFileSync } from 'node:fs'

interface Benchmark {
  readonly name: string
  readonly mean: number
}

interface Group {
  readonly fullName: string
  readonly benchmarks: ReadonlyArray<Benchmark>
}

interface BenchResults {
  readonly files: ReadonlyArray<{ readonly groups: ReadonlyArray<Group> }>
}

interface Thresholds {
  readonly [groupName: string]: { readonly maxWasmToTsRatio: number } | string
}

function groupTitle(fullName: string): string {
  const parts = fullName.split(' > ')
  return parts[parts.length - 1]
}

function findByPrefix(benchmarks: ReadonlyArray<Benchmark>, prefix: string): Benchmark | undefined {
  return benchmarks.find((b) => b.name.startsWith(prefix))
}

function main(): void {
  const resultsPath = process.argv[2] ?? 'bench/core-results.json'
  const thresholdsPath = process.argv[3] ?? 'packages/core/bench/thresholds.json'

  const results: BenchResults = JSON.parse(readFileSync(resultsPath, 'utf-8'))
  const thresholds: Thresholds = JSON.parse(readFileSync(thresholdsPath, 'utf-8'))

  const groups = results.files.flatMap((f) => f.groups)
  let failed = false
  let checked = 0
  const gateEntries = Object.entries(thresholds).filter(([name]) => !name.startsWith('_'))

  for (const [name, threshold] of gateEntries) {
    const entry = threshold as { maxWasmToTsRatio: number }
    const group = groups.find((g) => groupTitle(g.fullName) === name)
    if (!group) {
      // W7 fail-closed: a thresholds.json entry with no matching bench group
      // (renamed group, typo, or a results file from a stale/partial run) is
      // a BROKEN gate, not an absent one — it must fail the build, not warn
      // and move on silently.
      console.error(`[check-bench] FAIL "${name}": no bench group found in results (ran "pnpm run bench" with pkg/ built?)`)
      failed = true
      continue
    }
    const ts = findByPrefix(group.benchmarks, 'ts:')
    const wasm = findByPrefix(group.benchmarks, 'wasm:')
    if (!ts || !wasm) {
      // Same reasoning: in CI, `pkg/` is ALWAYS built before `bench` runs
      // (the `rust-core` job's own sequence) — a missing wasm (or ts) row at
      // this point means something upstream silently failed, not "the usual
      // local dev without the Rust toolchain" case this warning used to
      // excuse unconditionally.
      console.error(`[check-bench] FAIL "${name}": missing ${!ts ? "'ts:'" : "'wasm:'"} row in the bench results`)
      failed = true
      continue
    }

    const ratio = wasm.mean / ts.mean
    checked += 1
    const verdict = ratio <= entry.maxWasmToTsRatio ? 'OK' : 'FAIL'
    if (verdict === 'FAIL') failed = true
    console.log(
      `[check-bench] ${verdict} "${name}": wasm/ts = ${ratio.toFixed(2)}x ` +
        `(wasm ${wasm.mean.toFixed(4)}ms, ts ${ts.mean.toFixed(4)}ms, budget ${entry.maxWasmToTsRatio}x)`
    )
  }

  if (gateEntries.length === 0) {
    console.error('[check-bench] FAIL: thresholds.json has no gate entries at all — nothing can ever be verified by this gate.')
    process.exit(1)
  }
  if (checked === 0) {
    console.error('[check-bench] FAIL: zero bench cases were actually checked (missing results/thresholds, or pkg/ not built).')
    process.exit(1)
  }
  if (failed) {
    console.error('[check-bench] one or more Wasm/TS ratios exceeded their budget, or a gated group/row was missing.')
    process.exit(1)
  }
  console.log('[check-bench] all checked ratios are within budget.')
}

main()

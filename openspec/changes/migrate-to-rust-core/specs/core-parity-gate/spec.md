# Delta for core-parity-gate

## ADDED Requirements

### Requirement: Parity Tests Gate Default Implementation
The system MUST NOT allow a Rust/Wasm implementation of a ported module (pixel-buffer, flood-fill, quantize/downscale, history) to become the default implementation until its parity test suite passes against the existing TS implementation.

#### Scenario: Passing parity blocks nothing
- GIVEN a Rust implementation of a ported module with a passing parity suite
- WHEN the implementation flag is switched to the Rust default
- THEN the switch succeeds and both implementations remain available via the flag

#### Scenario: Failing parity blocks promotion
- GIVEN a Rust implementation of a ported module with a failing parity suite
- WHEN an attempt is made to switch its implementation flag to the Rust default
- THEN the switch is rejected
- AND the TS implementation remains the default

### Requirement: Baseline Benchmarks Recorded Before Porting
The system MUST record baseline performance numbers for each module (pixel-buffer, flood-fill, quantize/downscale, history) using the TS implementation before any Rust port of that module begins.

#### Scenario: Baseline exists before a port starts
- GIVEN a module scheduled for a Rust port
- WHEN the port's parity/bench work begins
- THEN a recorded TS baseline bench result for that module already exists

### Requirement: CI Enforces Tests, Benchmarks, and Drift Check
The system MUST run the test suite, the benchmark suite, and a committed-Wasm-artifact drift check on every pull request.

#### Scenario: PR triggers full gate
- GIVEN a pull request that touches `packages/core`
- WHEN CI runs
- THEN tests, benches, and the drift check all execute
- AND the PR is blocked from merging if any of the three fails

#### Scenario: Drift check catches a stale artifact
- GIVEN a change to Rust source without rebuilding the committed `pkg/` output
- WHEN CI runs the drift check
- THEN CI reports a failure identifying the committed artifact as out of date

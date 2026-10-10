# Delta for pixel-core

## ADDED Requirements

### Requirement: Implementation-Agnostic Pixel Operations
The system MUST expose pixel read, write, and flood-fill operations through a single `PixelCore` contract so callers observe identical results regardless of which implementation (TS or Wasm) backs it.

#### Scenario: Pixel write is readable back
- GIVEN an empty canvas buffer
- WHEN a pixel at (x, y) is set to an RGBA color
- THEN reading that same (x, y) returns the identical RGBA color

#### Scenario: Flood-fill matches across implementations
- GIVEN the same starting canvas state and fill point
- WHEN flood-fill runs on the TS implementation and on the Wasm implementation
- THEN both produce byte-identical resulting canvases

### Requirement: Full Canvas Repaint Performance
The system MUST repaint a full 256x256 canvas in under 4 ms.

#### Scenario: Repaint budget met
- GIVEN a fully populated 256x256 canvas
- WHEN a full repaint is triggered
- THEN the repaint completes in under 4 ms

### Requirement: Flood-Fill Performance
The system MUST complete a flood-fill of a full 256x256 canvas in under 5 ms when using the Rust implementation, and that implementation MUST be at least 3x faster than the flattened TS baseline on the same input.

#### Scenario: Flood-fill speed budget met
- GIVEN a full 256x256 canvas and a fill origin point
- WHEN flood-fill runs using the Rust implementation
- THEN it completes in under 5 ms
- AND its duration is at most one-third of the TS baseline's duration on the same input

### Requirement: Lossless Pixel Round-Trip
The system MUST preserve exact RGBA channel values (0-255 integers) through every supported pixel operation (write, flood-fill, quantize, downscale) with no rounding drift beyond the operation's documented intent.

#### Scenario: Quantize preserves channel range
- GIVEN a canvas with arbitrary RGBA values
- WHEN quantize is applied
- THEN every output channel value is an integer in the 0-255 range

#### Scenario: Downscale preserves canvas content intent
- GIVEN a source canvas and a target size smaller than the source
- WHEN downscale runs
- THEN the result has the target dimensions and contains only valid RGBA pixels (channels in 0-255)

### Requirement: Local Draft Recovery
The system MUST autosave the working document locally (IndexedDB, binary pixel data) after edits, debounced, and MUST restore it on the next load, so a crash or closed tab loses at most the edits inside the debounce window. Remote project sync is out of scope.

#### Scenario: Draft restored after reload
- GIVEN a document edited and left idle longer than the autosave debounce
- WHEN the editor is reloaded
- THEN the restored document is byte-identical to the saved one (pixels, frames, layer metadata)

#### Scenario: Restore runs before autosave
- GIVEN a saved draft
- WHEN the editor loads
- THEN no save happens until the draft has been restored

#### Scenario: Legacy localStorage draft is migrated once
- GIVEN legacy localStorage sprite data in `RgbaColor[][]` form and no IndexedDB draft
- WHEN the editor loads
- THEN the same pixels are saved to IndexedDB as a flat buffer
- AND the legacy key is removed only after that save succeeds

#### Scenario: Storage unavailable
- GIVEN IndexedDB cannot be opened
- WHEN the editor loads
- THEN editing still works in memory
- AND the user is told that drafts are not being saved

# Delta for edit-history

## ADDED Requirements

### Requirement: Command-Based Mutation
The system MUST route every undoable canvas mutation (pixel edit, frame op, layer op) through a single command-dispatch entry point rather than direct state writes.

#### Scenario: Mutation via dispatch is observable
- GIVEN an editor session with an empty undo stack
- WHEN a pixel-edit command is dispatched
- THEN the canvas reflects the edit
- AND the undo stack contains exactly one entry for that command

### Requirement: Undo/Redo Correctness
The system MUST restore the exact prior canvas state on undo, and the exact superseding state on redo, for any sequence of dispatched commands.

#### Scenario: Single undo restores prior state
- GIVEN a canvas with one dispatched edit command
- WHEN undo is invoked
- THEN the canvas matches its state before that command was dispatched

#### Scenario: Redo restores the undone state
- GIVEN a canvas where one command was dispatched and then undone
- WHEN redo is invoked
- THEN the canvas matches its state immediately after the original command

#### Scenario: Multi-step undo/redo round-trip
- GIVEN a sequence of N dispatched commands
- WHEN all N are undone and then all N are redone, in order
- THEN the final canvas state is identical to the state after the original N dispatches

### Requirement: Bounded Undo Memory
The system MUST retain no more than 1 KB of history data for an undo step representing a 1-pixel stroke on a 64x64 canvas with 8 frames and 4 layers.

#### Scenario: Single-pixel stroke history stays within budget
- GIVEN a 64x64 canvas with 8 frames and 4 layers
- WHEN a single-pixel stroke is dispatched as one command
- THEN the retained history data for that step is under 1 KB

### Requirement: Bounded History Retention Within a Session
The system SHOULD cap total retained history size so an extended editing session does not grow memory usage unbounded. History is session-scoped: it is NOT persisted, and a reload starts with an empty undo stack (the document itself is restored per pixel-core "Local Draft Recovery").

#### Scenario: Long session respects a memory ceiling
- GIVEN an editing session with history exceeding the configured retention limit
- WHEN additional commands are dispatched
- THEN the oldest history entries are discarded first
- AND the most recent undo/redo operations within the retention window still succeed

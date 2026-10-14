# 0011 — Lock an explicit animation reference (canvas frame or Asset)

**Status**: Accepted
**Date**: 2026-10-14
**Applies to**: apps/editor (sprite editor, Animate tab)

## Context

`exportCanvasReference()` (`useAnimateTab.hook.ts:135-140`) reads
`useSpriteEditorStore.getState().layers` **at submit time** — whatever is
currently rendered on the canvas becomes the reference image sent to
PixelLab for that job. `useFinishAnimation.hook.ts:34-37` auto-applies a
finished animation's frames to the timeline whenever it was blank, which
changes what "currently on canvas" means for the *next* generation.

Reported by the owner (2026-10-14): he generated `correr` first (auto-applied
to a blank timeline), then generated `agacharse` — the crouch animation's
first frame showed the character mid-run, not in its neutral/idle pose,
because the live canvas had already drifted to a running frame by the time
`agacharse` was submitted. Nothing in the UI shows what image is about to be
sent before hitting Generate — the existing "Preview reference" button only
shows the current canvas, it does not let the user choose or lock anything.

This reproduces every time a second (or later) animation is generated in a
session where the previous result auto-applied — not an edge case.

## Prior art

| Who | Technique | Result | Source |
|---|---|---|---|
| Aseprite / traditional 2D pipelines | One fixed base pose, every clip generated from that same source | Clips never drift into each other | — |
| 3D rigging | T-pose / bind pose as canonical reference, independent of whatever plays in the viewport | Animations stay consistent regardless of playback state | — |
| PixelLab API | Accepts exactly one reference image per job, no opinion on its origin | Confirms the drift is editor-side, not a vendor limitation | ADR 0009 ("index 0 is the input frame") |
| This repo, ADR 0010 | Treats the canvas as an explicit snapshot *source*, not implicit live state, for Assets saves | Same principle reused here | `docs/adr/0010-canvas-is-always-an-asset.md` |

## Options considered

| Option | Gain | Lose | Risk |
|---|---|---|---|
| A. Keep current (reference = live canvas at submit time) | Zero code | Reproduces the reported bug on every multi-motion session | High — already hit in practice |
| **B. Explicit, locked reference (chosen)** | User picks a canvas frame or an Asset once; it is pinned and reused for every later generation; a persistent chip shows it | One more concept to learn, mitigated by the chip | Low — only changes where the submitted image comes from |
| C. Decouple animation generation from canvas entirely (character + animation library) | Cleanest long-term separation | Redesigns the whole Animate tab for a need the owner explicitly deferred ("eso ya después va a ser a futuro") | High effort now for a future problem |

## Decision

- **Option B**, refined by the owner on 2026-10-14:
- A picker (evolving the existing "Preview reference" control) offers two
  sources: **Canvas** (pick a frame from the current timeline) or **Assets**
  (pick an existing library item).
- Once chosen, the reference is **locked for the rest of the session**: every
  later "Generate Animation" click, for any motion, reuses this exact
  reference — it no longer re-reads the live canvas at submit time.
- A persistent chip stays visible near the Generate button showing the
  active reference (thumbnail + label) as a standing reminder: *"Referencia:
  \<label\> — de aquí se generan todas las animaciones."*
- Changing the reference is only possible by deliberately reopening the
  picker from that chip.
- Until a reference is chosen, Generate stays disabled — no implicit default.

## Implementation plan

Single phase, on `feat/animations` (already the owner's working branch for
this area). Pipeline: design-agent → frontend-agent → cleancode-agent.

**Scope**:
- Persist the locked reference (source: `canvas` frame index, or `asset` id
  + its image) in the same session-scoped store the rest of the Animate
  tab's job state already lives in (`useAIJobsStore`, sessionStorage —
  survives tab reload like `animatePending` already does).
- `handleGenerateAnimation` reads the locked reference instead of calling
  `exportCanvasReference()` unconditionally.
- New picker (modal): a Canvas tab (thumbnails of the current timeline's
  frames) and an Assets tab (reuses the existing Assets grid/tile pattern).
- A chip component replacing/evolving "Preview reference": shows the active
  reference or a prompt to pick one; opens the picker on click.

**Acceptance**:
- Generate `correr`, then switch motion to `agacharse` and Generate again
  without touching the picker → the submitted reference image is byte-identical
  to the locked one, not whatever the first job left on the canvas.
- Picking a different canvas frame or Asset updates the chip and becomes the
  new locked reference for subsequent generations.
- Generate is disabled until a reference has been explicitly picked at least
  once.
- Reloading mid-session keeps the same locked reference.

## Consequences

- Removes the reported bug class entirely — the Animate tab no longer
  silently depends on implicit canvas state at submit time.
- Adds one concept (session-locked reference + picker) the user learns once;
  mitigated by the always-visible chip.
- Out of scope here, tracked separately: no way to cancel a job while it is
  actively generating (only when stalled), and `nFrames` resetting to the
  new motion's default on every motion switch. Both already diagnosed, not
  yet authorized to fix.
- Compatible with a future Option C: the locked reference can later become
  "always a saved Asset" without reworking this mechanism.

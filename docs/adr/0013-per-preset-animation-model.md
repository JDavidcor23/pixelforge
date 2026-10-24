# 0013 — Each motion preset picks its PixelLab animation model

**Status**: Accepted
**Date**: 2026-10-24
**Applies to**: apps/editor (Animate tab, `api/ai/pixellab/animate`), `scripts/pixellab-animate-harness.ts`

## Context

- ADR 0009 sends every animation to one PixelLab endpoint,
  `animate-with-text-v3` (`PIXELLAB_ANIMATE_PATH`,
  `apps/editor/src/constants/animation.ts`).
- Attacks are the weak spot. After the ADR 0012 rewrite and the
  `swingsHeldItem` fix, v3 still "barely leaves the ground" on a jump attack.
- Benchmark 2026-10-18 (wizard-128, jump-attack, 1.42 USD, player at
  `.claude/worktrees/animation-editing/.harness-out/bench-2026-10-18/player.html`,
  log `odd/tasks/animation-motion-detail.md` L10). The owner ranked
  PixelLab `animate-pixminimax` (beta) first: a 23px jump, an overhead swing
  with a trail, the character stays on-model and the loop closes.
- Price, measured 2026-10-24: one 8-frame 128px pixminimax job left the USD
  credits unchanged and reported `usage: {"type":"generations","generations":1}`.
  It is billed in subscription generations, not in USD credits. PixelLab does
  not publish a USD price per generation, so the USD cost is **not measured**.
  The owner chose not to show a price or a "beta" label.
- pixminimax shares v3's job shape (`background_job_id`, then
  `frame_count + 1` images with the input at index 0), so polling, the
  browser ledger and `collect-ai-jobs` stay unchanged. It differs in three
  ways (OpenAPI, `api.pixellab.ai/v2/openapi.json`):
  1. The motion field is `description` (max 1000 chars, "Describe movement,
     not appearance"), not `action`.
  2. `frame_count` must be a multiple of 4 (4..40), and there is no pixel
     budget.
  3. It accepts optional caption fields (`subject_description`,
     `initial_pose`, `view`, `direction`). When they are left out, PixelLab
     reads them off the image.

## Options

| Option | You gain | You lose | When it wins |
|---|---|---|---|
| A. Keep v3 for everything | Nothing changes | Attacks stay weak, and the one-shot goal fails | Never, for attacks |
| B. **A per-preset `model` field, routed server-side (chosen)** | Attacks use the best measured model, every other motion keeps v3, and it is still one adapter and one port | The server has two request shapes, and frame options depend on the preset | One provider with several endpoints |
| C. Bring Retro Diffusion back as a second adapter | Another vendor to fall back on | It redraws or turns the character, costs 0.14–0.25 USD, and brings back an adapter ADR 0009 removed | Only if PixelLab gets worse |

## Decision

- `AnimationMotionPreset.model?: AnimationModel` (`'text-v3' | 'pixminimax'`).
  When it is omitted, the preset uses `text-v3`. **attack** and **jump-attack**
  use `pixminimax`. **cast-spell** and every other motion stay on v3.
- The Animate tab sends `model` in the vendor-neutral `AnimationRequest`. The
  `animate` function maps it to the endpoint and writes `description`
  instead of `action` for pixminimax. It also validates frames (multiples of 4)
  and length (1000 chars).
- pixminimax gets the motion text only, without the identity rules. This
  matches the measured winner and the field's "movement, not appearance" contract.
- No caption fields are sent. The Animate tab does not know the subject,
  so PixelLab reads it off the image.
- Retro Diffusion does not come back.

## Consequences

- Frame options for a pixminimax preset are 4/8/12/16, and the tab
  filters them per preset.
- The eval script reads each preset's `model`, so what is measured is
  what ships (ADR 0009 rule).
- Two-hand grip rule (handoff 2026-10-18): it was measured on v3 jump-attack only.
  With attacks on pixminimax, it would only change cast-spell, which already
  works, so it is **not** applied. The canvas-headroom fix is deferred for the same reason.
- Reuse: the same `model`-per-preset idea fits sound presets if ElevenLabs
  ever exposes more than one model.

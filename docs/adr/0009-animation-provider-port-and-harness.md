# 0009 — Animation provider port and animation harness

**Status**: Accepted
**Date**: 2026-10-12
**Applies to**: apps/editor (sprite editor, Animate tab), `apps/editor/api/ai/*`, `scripts/`

## Context

- Animations were generated with Retro Diffusion (`rd_advanced_animation__*`) at a
  hardcoded 64px (`AI_SPRITE_DEFAULT_SIZE` in `useAnimateTab.hook.ts`). A 128x128
  wizard was downscaled to 64 and its "walk" came back as an in-place breathing loop.
- The Import panel also defaulted to 64px (`useImportPanel.hook.ts`), downscaling a
  128px PNG on import before the Animate tab ever saw it.
- Retro Diffusion bills animations flat at 0.14 USD. The owner decided (with Albus)
  to keep Retro Diffusion for base sprites and move animations to PixelLab.
- Goal: a user gets a usable animation in ONE shot, without iterating and burning
  free credits. That needs a harness (fixed rules and parameters per motion), not a
  raw text box sent to a model.

Measured on 2026-10-12 with `scripts/pixellab-animate-harness.ts`
(`POST /v2/animate-with-text-v3`, wizard-128.png, 8 frames):

| Variant | Result |
|---|---|
| bare `walking` | Rotates the character toward the camera, swaps the staff hand |
| `enhance_prompt: true` | Real steps, drifts to side profile mid-cycle |
| identity rules first + explicit motion | Real steps, same hand, same scale, near start pose at the end (best) |
| same + `last_frame = first_frame` | Almost static: forcing the loop kills the motion |

Other facts: output keeps 128x128 (max 256, `w*h*frames <= 524288`); the response
holds `frame_count + 1` images (index 0 is the input frame); generation takes
110–160 s; the free tier allows 1 concurrent job (HTTP 429 otherwise); one 8-frame
walk consumed ~2 trial generations. USD price per job: not measured (trial account).

## Prior art

| Who | Technique | Result | Source |
|---|---|---|---|
| PixelLab | Async background jobs, poll `GET /v2/background-jobs/{id}` | Long generations never block an HTTP request | https://api.pixellab.ai/v2/llms.txt |
| Alistair Cockburn | Ports & Adapters (hexagonal architecture) | Domain code independent of the vendor SDK | https://alistair.cockburn.us/hexagonal-architecture/ |
| PixelForge `buildPrompt` | Rules first, user text last | Retro Diffusion stopped cropping characters (2026-10-11) | `apps/editor/src/lib/build-prompt.ts` |
| LLM eval practice | Same prompt catalogue used by the product and by an offline eval script | What is tested is what ships | — |

## Options considered

| Option | Gain | Lose | Risk |
|---|---|---|---|
| A. Keep Retro Diffusion, fix size and prompt | No new vendor | Worse quality at 64px, higher flat price | Users keep re-generating |
| B. `AnimationProvider` port + PixelLab adapter + harness as data | Vendor swap without touching UI or harness; harness tested offline | More code now | Port shaped around one vendor |
| C. Call PixelLab directly from the hook | Fastest | Next vendor change rewrites UI logic | Lock-in |

## Decision

- **Option B.** The Animate tab depends on an `AnimationProvider` port
  (`submit` → job id, `poll` → status/frames). PixelLab is the only adapter;
  Retro Diffusion animation code is removed (RD stays for base sprites).
- **Async job pattern**: two Vercel Functions (`api/ai/pixellab/animate.ts` submits,
  `api/ai/pixellab/job.ts` reads status). No function waits the 2–3 minutes.
- **Harness as data**: a motion catalogue (`ANIMATION_HARNESS`) holds, per motion,
  the identity rules, motion text, frame count and options. A pure `buildAnimationAction`
  puts rules FIRST. `last_frame` is never used for cycles.
- **One job at a time**, enforced client-side, with a clear message on 429.
- **Size follows the sprite**: Import defaults to the image's native size and
  Animate uses the current canvas size (max 256).
- **Eval bench**: `scripts/pixellab-animate-harness.ts` reads the same catalogue.

## Consequences

- Swapping animation vendors means writing one adapter.
- Every new motion must pass the harness script on a real sprite before it ships.
- Generations now take minutes, so the UI needs progress and must survive tab switches
  (`useAIJobsStore` already keeps job state across unmounts).
- The same port shape (submit/poll) fits future slow providers: sound (ElevenLabs),
  scene generation.

## Performance budget / acceptance

| Metric | Before | Target | Measured after |
|---|---|---|---|
| Output size for a 128px sprite | 64px | 128px | |
| Walk on wizard-128 | Breathing loop | Alternating steps, no rotation, same hand | |
| Concurrent jobs sent | n/a | Never more than 1 | |
| Generations per walk | n/a | ~2 trial generations, one shot | |

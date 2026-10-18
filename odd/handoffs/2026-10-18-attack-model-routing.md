# Handoff 2 of 2 — give attack animations their own model

AI-generated source notes. Run AFTER handoff 1 (merge) is done, in a new
conversation, on a new `feat/*` branch from `master`.

## What the owner wants (verbatim, 2026-10-18)

> "Recuerda que ahorita estamos usando una especie de modelo para generar
> 'todas las animaciones', pero el de ataque sí es un poco más especial"

> "La idea es que esto sea un one shot"

Today every animation goes through PixelLab `animate-with-text-v3`
(`apps/editor/api/ai/pixellab/animate.ts`, ADR 0009). Attacks should use a
better model, chosen per motion.

## Evidence (benchmark 2026-10-18, wizard-128, 1.42 USD)

Player with every result and the owner's picks card:
`C:\Users\PC\Documents\web\my_proyects\game-builder\.claude\worktrees\animation-editing\.harness-out\bench-2026-10-18\player.html`
Bench scripts (scratch, may be cleaned): session scratchpad `anim-bench/bench.mts`.
Full log: `odd/tasks/animation-motion-detail.md` L10.

Owner's picks, best first:

| ID | Endpoint | Notes |
|---|---|---|
| `pixellab-pixminimax-jump-attack` | PixelLab `animate-pixminimax` (beta) | **Best so far.** 23px jump, overhead swing + trail, on-model, loops. Billed 1 trial generation; USD price after trial NOT measured. |
| `pixellab-v2pro-jump-attack` | PixelLab `animate-with-text-v2` (pro) | Clear two-hand overhead grip; only 4 frames at 128px; 10 trial generations. |
| `pixellab-v3-jump-attack` | PixelLab `animate-with-text-v3` | Current model; 0.032 USD; barely leaves the ground. |
| `retrodiffusion-adv-attack-jump-attack` | RD `rd_advanced_animation__attack` | 27px lift, two-hand smash, but turns side-on, no loop; 0.14 USD. |
| `retrodiffusion-big_animation-jump-attack` | RD `rd_animation__big_animation` | Strong motion but redraws the character; 4 frames; 0.25 USD. |

Two cheap fixes measured on v3, worth keeping whatever model wins:
1. Headroom: the wizard fills rows 13-122 of 128px. Bottom-aligning it on a
   taller canvas (176px) raised jump lift 0 -> 14px.
2. Two-hand grip: for `swingsHeldItem` presets, replace
   "Held items stay in the same hand in every frame." with
   "Grip the held item with both hands when swinging it."

## Open decisions for the owner (ask one at a time)

1. Measure pixminimax's real USD price before shipping it (trial hides it).
2. Which motions route to the special model: attack, jump-attack, cast-spell?
   (cast-spell already works on v3.)
3. Whether RD comes back as a second animation adapter (ADR 0009 removed it).

## Where it plugs in

- `AnimationProvider` port (ADR 0009) + `AnimationMotionPreset` in
  `apps/editor/src/types/animation.types.ts`: add a per-preset model/endpoint
  field; `apps/editor/api/ai/pixellab/animate.ts` routes by it.
- This is an architecture decision (new provider endpoint / routing):
  use the `architecture-decision` skill and write ADR 0013 before code.
- Every new motion must pass `scripts/pixellab-animate-harness.ts` on a real
  sprite; the script must learn the new endpoint too.

## Prompt to paste in the new conversation

> Lee `C:\Users\PC\Documents\web\my_proyects\game-builder\odd\handoffs\2026-10-18-attack-model-routing.md`
> (ya mergeado en master) y arranquemos la implementación para que los
> ataques usen su propio modelo.

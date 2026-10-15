# Animation motion detail

Objective: let the user add optional extra detail per motion preset (any
preset, not just Attack) so the provider isn't left guessing how THIS
character performs a generic motion — concatenated onto the preset's own
prompt, never persisted, never replacing it. Branch: `feat/animation-editing`
(worktree `animation-editing`). Delivery: work-unit commits on this branch.
Test runner: `pnpm --filter @pixelforge/editor test`.

## Specs

- S1 (bug/design problem, in scope): "no me gusta cómo está lanzando los
  poderes... el frame primero tiene el palo hacia atrás y luego mágicamente
  aparece hacia adelante." The `attack` preset motion lacked a described
  mid-swing, so adjacent frames could jump straight from windup to full
  forward strike.
- S2 (core problem, in scope): "el tema del ataque no está definido... yo no
  le he explicado a la animación que el pingüino tiene un arma. O no le he
  explicado cómo ataca el pingüino... hay animaciones que son más
  específicas... pero no podríamos ponerlo solo para ataque. Yo preferiría
  ponerlo para todas." Every non-custom preset needs an opt-in way to
  describe character-specific detail, not just Attack.
- S3 (UX decision): "sugerencia, oye, te recomendamos para el ataque que aquí
  expliques cómo va a atacar el pingüino... cómo va a poner la pose." A
  per-preset placeholder suggesting what to describe, not a blocking
  requirement.
- S4 (data model decision): "es un complemento, es una concatenación... Y el
  custom es como para... una animación de victoria... algo que el usuario...
  quiera hacer." The extra-detail field concatenates onto the chosen
  preset's motion; the existing "Custom" preset (free text replacing the
  whole prompt) stays unchanged and separate.
- S5 (persistence decision): "Podrías guardarlo, pero... no sé cómo
  estructurarlo de una manera de que sea fácil de entender a la primera...
  Yo creo que es mejor resetearlo." The extra-detail field never persists —
  resets on preset change and on asset-type change, exactly like
  `customText` already does.
- S6 (UX decision): "Sería bueno un placeholder por cada cosa." Each
  preset's `detailPlaceholder` is its own text, not a generic shared hint.
- S7 (authorization): "Yo lo único que quiero es que lo implementes...
  Lanza múltiples agentes y te doy permiso que hagas todo." Owner
  authorized unattended implementation + tests, no further check-ins
  expected.

## Tasks

- T1 — S1,S2,S3,S4,S6: add `detailPlaceholder?: string` to
  `AnimationMotionPreset`; give every non-custom preset (character + subject
  motions) its own placeholder; `buildAnimationAction` accepts an optional
  third `extraDetail` arg concatenated at the end. Route: inline (parent).
  Status: done, GREEN (TDD: RED added to `animation-harness.test.ts` first).
- T2 — S1: rewrite the `attack` preset motion to name an explicit mid-swing
  position between windup and strike, so adjacent frames don't jump straight
  from "back" to "forward". Route: inline (parent). Status: done, GREEN
  (text change only — NOT validated against the PixelLab eval bench, see
  L5).
- T3 — S4,S5,S6: wire `motionDetail`/`setMotionDetail` state into
  `useAnimateTab.hook.ts` (resets on preset/type change, feeds
  `buildAnimationAction`'s `extraDetail`), and add the optional textarea to
  `AnimateTab.tsx` (visible for every non-custom preset, placeholder =
  `motion.detailPlaceholder`). Route: delegated (frontend-agent) — UI
  feature, project pipeline requires it. Status: done. `typecheck` clean,
  695/695 tests passed.
- T4 — all: cleancode-agent review of the full diff. Route: delegated.
  Status: done — no issues found, no fixes needed. `typecheck` clean,
  695/695 tests passed (re-verified).

## Log

L1 (2026-10-15): Owner's original request, verbatim gist (voice-dictated,
Spanish, with a wizard sprite sheet screenshot): complaint that the "attack"
animation has the staff appear "like magic" jumping from frame 1 to frame 2,
and more fundamentally that the attack motion isn't defined per-character —
the AI has to guess how a given sprite attacks. Wants a way to give that
context, applicable to every motion preset (not only attack), as a
suggestion, never mandatory.

L2 (2026-10-15): Clarified via brainstorming (architectural path) — the
extra detail concatenates onto any preset's existing motion (not a new
"Custom"), never persists between generations, and each preset gets its own
placeholder text.

L3 (2026-10-15): Owner authorized full unattended implementation across
multiple agents, no further approval checkpoints: "Hazlo todo tú ya de una
vez. Lanza múltiples agentes y te doy permiso que hagas todo."

L4 (2026-10-15): `AGENTS.md`/`CLAUDE.md` reference
`.claude/agents/design-agent.md` as the first step of the visual pipeline;
that file does not exist in this repo (only `clean-code-agent.md`,
`frontend-agent.md`, `rules-agent.md`, `zustand-agent.md`, `impeccable-*`).
Skipped straight to frontend-agent with the visual spec written inline,
since the change reuses an existing textarea pattern 1:1 (no new tokens,
no new colors/spacing). Flagged to the owner — the project docs reference a
non-existent agent file.

L5 (2026-10-15): The attack motion rewrite (T2) is a text-only adjustment to
reduce the described pose jump; it has NOT been measured against
`scripts/pixellab-animate-harness.ts` (that costs real PixelLab credits).
Per project convention ("every new motion must pass the eval script on a
real sprite before it ships"), this should be validated with a real
generation before being considered fully proven — left as a follow-up, not
run automatically because it spends real money.

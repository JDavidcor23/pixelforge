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
- S4 (data model decision — SUPERSEDED 2026-10-15, see L6): "es un
  complemento, es una concatenación... Y el custom es como para... una
  animación de victoria... algo que el usuario... quiera hacer." (original
  decision: the extra-detail field concatenated onto the chosen preset's
  motion, never replacing it). New decision: the preset's motion text is now
  the starting value of the SAME editable box the user types in — editing it
  REPLACES the suggestion for this generation, nothing gets glued after it.
  Identity rules stay fixed and invisible underneath (they protect the
  character, not the chosen pose). "Custom" keeps starting empty, same box.
- S8 (bug, in scope): owner tested the Attack preset on a real wizard sprite
  with a full alternate 5-beat description (windup/thrust/flare/hold/
  retract) typed into the old "extra detail" box, at 12 frames. Result:
  near-static output, staff shrinks to an orb, only palette drifts between
  frames. Root cause: the hidden generic preset text + the owner's own full
  alternate description got concatenated into one contradictory `action`
  string — PixelLab's `animate-with-text-v3` accepts only ONE holistic
  action string + `frame_count` (confirmed in `AnimationRequest` /
  `PixelLabAnimateRequestBody`, `apps/editor/src/types/animation.types.ts`;
  no per-frame field exists). This is also the real-world validation T2's
  rewrite never got (see L5) — it failed.
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
- T5 — S4,S8: simplify `buildAnimationAction` to a single action-text
  argument (drop the 3rd `extraDetail` concat param); update its doc comment
  and `AnimationMotionPreset.motion`'s comment to describe it as the
  preset's suggested/default text, not mandatory hidden text. Update
  `animation-harness.test.ts` (remove the two tests asserting the
  superseded concatenation contract). Route: inline (parent). Status: done,
  GREEN (693/693, `typecheck` isolates the one expected downstream break in
  T6's file).
- T6 — S4,S8: unify `useAnimateTab.hook.ts`'s `customText`/`motionDetail`
  dual state into one `actionText`/`setActionText` field, seeded from
  `motion.motion` on preset/type change (`''` for Custom, unchanged);
  `handleGenerateAnimation` calls the simplified `buildAnimationAction` with
  that one field; submit guard now blocks on empty `actionText` for every
  preset. Route: delegated (frontend-agent). Status: done. `typecheck`
  clean, 693/693 tests passed.
- T7 — S4,S8: merge `AnimateTab.tsx`'s two mutually-exclusive textareas
  ("Describe the motion" / "Extra detail (optional)") into one box bound to
  `actionText`; drop the "Adds to the motion above — it doesn't replace it"
  copy; `isGenerateDisabled` now requires non-empty text for every preset,
  not just Custom. Route: delegated (frontend-agent). Status: done
  (same pass as T6). `typecheck` clean, 693/693 tests passed.
- T8 — all (T5-T7): cleancode-agent review of the full diff across all five
  touched files. Route: delegated. Status: done — no issues found, no fixes
  needed; confirmed zero leftover references to `customText`/`motionDetail`/
  the old 3-arg `buildAnimationAction` call shape anywhere in the app.
  `typecheck` clean, 693/693 tests passed (re-verified).
- T9 (follow-up, NOT run automatically — spends real PixelLab credits):
  validate the rewritten attack preset plus a typical user detail against
  `scripts/pixellab-animate-harness.ts` on a real sprite, per project
  convention ("every new motion must pass the eval script before it
  ships"). Pending the owner's explicit go-ahead to spend credits.

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

L6 (2026-10-15): Owner reported the real-world failure described in S8 and
rejected the "just add UI guidance, keep the hidden concatenation" option —
"no me sirve que yo le pase un prompt y diga, no, lo que pasa es que no te
lo puede hacer. Hay que encontrar una manera de hacer que el arnés funcione
de una manera correcta." Ran the `architecture-decision` skill: framed the
problem with the numbers above, cited ADR 0009's own measurement (identity
rules + ONE continuous motion sentence is what performed best; forcing
`last_frame` killed motion) and PixelLab's `animate-with-text-v3` contract
(single `action` string, no per-frame field) as prior art, presented 3
options — (A) keep concatenation + add UI copy guidance, (B) make the
preset's motion text the editable box's prefill so edits replace it instead
of appending, (C) auto-translate a frame-by-frame script into one prose
sentence. Owner chose **B**. Recorded as `docs/adr/0012-preset-motion-text-
is-editable.md`. S4 revised above; new tasks T5–T9 added; T2 and T3's
original intent stay valid, only superseded where S4 says so.

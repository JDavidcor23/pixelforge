# 0012 — Preset motion text is the editable action field, not hidden boilerplate

**Status**: Accepted
**Date**: 2026-10-15
**Applies to**: apps/editor (sprite editor, Animate tab), `scripts/pixellab-animate-harness.ts`

## Context

- ADR 0009 / `docs/adr/0009-animation-provider-port-and-harness.md` set the
  harness contract: identity rules first, then one motion sentence, sent to
  PixelLab's `animate-with-text-v3` as a single `action` string + `frame_count`
  (confirmed again here in `AnimationRequest` / `PixelLabAnimateRequestBody`,
  `apps/editor/src/types/animation.types.ts:50-63,155-157` — no per-frame
  field exists in that type at all).
- `odd/tasks/animation-motion-detail.md` (2026-10-15, same day) added an
  "extra detail" textarea per preset that **concatenates** onto the preset's
  own motion text, which stays hidden from the user
  (`buildAnimationAction`, `apps/editor/src/lib/animation-harness.ts:157-167`).
  That motion text for `attack` was rewritten the same day (its own task T2)
  to add an explicit mid-swing beat, but was never run against the real
  PixelLab eval bench — `scripts/pixellab-animate-harness.ts` — because that
  spends real credits (logged as L5, left as a follow-up).
- The owner then generated a real attack animation: Attack preset, 12 frames,
  with a full 5-beat cinematic description (windup / thrust / flare erupts /
  hold / retract) typed into the "extra detail" box. Result: a near-static
  12-frame sheet — the staff shrinks to a small orb and only the palette
  drifts between frames, no real swing. That generation is, in effect, the
  missing bench validation from L5 — and it failed.
- Root cause: the final `action` string sent to PixelLab was identity rules +
  the hidden generic attack sentence ("raise the held item... swing it
  forward through a clear mid-swing position... return to the start pose")
  **+** the owner's own complete, differently-worded 5-beat description,
  concatenated. Two competing descriptions of the same motion, in one string,
  for an API that only accepts one holistic description — plus 12 frames,
  double the preset's validated default of 6, never re-tested at that count.

## Prior art

| Who | Technique | Result | Source |
|---|---|---|---|
| This repo, ADR 0009 | identity rules first + ONE continuous motion sentence | best measured result (walk: real steps, same hand, no rotation) | `docs/adr/0009-animation-provider-port-and-harness.md` |
| This repo, ADR 0009 | forcing `last_frame = first_frame` to close a cycle | almost static — kills the motion | same |
| PixelLab | `animate-with-text-v3`: one `action` string + `frame_count`, no per-frame control | the only supported shape today | https://api.pixellab.ai/v2/llms.txt |
| General text-to-video prompting practice | one flowing action-arc sentence outperforms a numbered shot list | matches what we measured ourselves; not pinned to a specific vendor doc, flagged as pattern-level not a sourced citation | not precisely sourced |

## Options considered

| Option | Gain | Lose | Risk |
|---|---|---|---|
| A. Keep concatenation, add UI copy guidance ("write one continuous sentence") + validate attack via the bench when funded | No architecture change | Doesn't fix the collision when the user's detail is itself a full alternate description (exactly what happened); still depends on everyone remembering a prompting convention | Recurs the first time anyone writes a detailed alternate description again |
| B. Preset motion text becomes the SAME editable box's prefilled default; editing replaces it, nothing concatenates | Kills the two-descriptions collision for good; the final `action` is exactly what's visible and edited, nothing hidden; still ships a working starting point per preset | Supersedes the "always additive" framing agreed the same day (S4); a user who only wants to add one clause must keep/retype the rest | Touches the hook + component again, same day as the original feature |
| C. Auto-translate a "Frame 1: ... Frame 2: ..." script into one prose sentence before sending | Lets users keep writing in the cinematic shot-list style they already use | New parsing code, its own edge cases and tests; does not by itself resolve the collision — needs pairing with A or B | Silent mangling risk if the transform guesses wrong |

## Decision

- **Option B.** `AnimationMotionPreset.motion` is now read as the preset's
  suggested DEFAULT text, not mandatory hidden text. The Animate tab shows
  exactly one editable textarea per preset (including "Custom", which still
  starts empty) — the preset change seeds it with `motion.motion`; the user's
  edits replace that text for this generation.
- **Identity rules stay fixed and invisible** underneath whatever text is in
  the box — they protect character/subject consistency, never the chosen
  pose, so they are not something the owner needs to edit per generation.
- **`buildAnimationAction` drops its third `extraDetail` argument** — it
  becomes `(actionText, assetType) => identityRules + ' ' + actionText.trim()`,
  the same shape the "Custom" path already used. One code path for every
  preset now.
- **Generate now requires non-empty text for every preset**, not just
  Custom — there is no more invisible fallback text once the field can be
  cleared.
- The harness's canonical `motion` string per preset is still what
  `scripts/pixellab-animate-harness.ts` measures unedited, so ADR 0009's
  "every new motion must pass the eval script before it ships" convention is
  unchanged — it is now also what ships to real users by default, unedited.

## Consequences

- Removes the only way two motion descriptions could end up concatenated
  into one contradictory `action` string.
- A user who wants to make one small addition (e.g. "the penguin attacks with
  a spear") must now edit/retype the full sentence instead of appending a
  short note — accepted tradeoff; option C (an auto-prose-joiner for
  shot-list style input) stays open as a separate, later decision if this
  turns out to be the friction that matters most.
- `scripts/pixellab-animate-harness.ts` keeps testing the unedited preset
  text by default — no change needed there.
- Same pattern (one editable action string, no hidden boilerplate) applies
  wherever the harness is reused for other asset types (object/weapon/
  costume/effect already share `SUBJECT_MOTIONS`).

## Performance budget / acceptance

| Metric | Before | Target | Measured after |
|---|---|---|---|
| Attack preset, 6 frames, unedited | not bench-validated (L5) | real swing, no pose jump | not measured — pending owner go-ahead to spend PixelLab credits (T9) |
| Attack preset, owner's own detailed description, 12 frames | near-static, staff shrinks to orb, only palette drifts | real multi-beat motion matching the description | not measured — pending T9 |
| `buildAnimationAction` arity | 3 args (motion, assetType, extraDetail) | 2 args (actionText, assetType) | done — see `animation-harness.ts` |

# 2026-10-15 — When "just add a note" quietly breaks your own animation

**Area**: sprite editor (Animate tab)
**Status**: shipped (the text/behavior change); the real PixelLab validation is still pending
**Related**: ADR 0012, ADR 0009, branch `feat/animation-editing`

## The problem (one paragraph, no jargon)

Earlier the same day, we added a small textbox so you could add a short note
to an attack animation, like "the penguin attacks with a spear." The code
glued that note onto a sentence that was already baked into the preset and
hidden from you. That was fine for a short note. Then you tried a full,
detailed description of your own — five beats, windup to recoil — and the
code glued THAT onto the hidden sentence too. The result: PixelLab got two
different descriptions of the same attack in one request, got confused, and
gave back 12 almost-identical frames where the staff shrinks into a little
orb instead of swinging.

## What I researched

- **Holistic action text** — PixelLab's animation endpoint takes exactly one
  sentence describing the whole motion, plus how many frames you want. It
  does not accept a shot list ("Frame 1: ... Frame 2: ...") — it decides on
  its own how to spread the described motion across frames.
- **Prompt concatenation** — gluing two pieces of text together to build one
  final instruction. Works fine when the pieces agree; breaks when they
  don't, because the model has to average two different intents instead of
  following one.
- How we'd already measured this once before, for "walk" (ADR 0009): one
  continuous sentence worked; forcing extra constraints (`last_frame`) on top
  of it killed the motion. Same family of mistake, different day.

## Options and tradeoffs

| Option | Gain | Lose |
|---|---|---|
| Keep gluing text + just ask you to phrase things carefully | No code change | You'd hit the same wall the next time you write a detailed prompt |
| Make the preset's suggested sentence the thing you actually edit, in one box | What you type IS what gets sent, no hidden sentence to collide with | You lose the "quick short note" framing — editing now means replacing, not adding |
| Auto-rewrite a "Frame 1/2/3" script into one sentence for you | You keep writing however feels natural | Real new code, new edge cases, doesn't fix the root problem by itself |

## What I decided and why

Chose the second option. The preset's example sentence now PRE-FILLS the same
box you type in, instead of living hidden behind the scenes — so there's only
ever one sentence, and editing it replaces it instead of adding to it. I did
not know, before today, that the "extra detail" feature (shipped hours
earlier) had this exact collision built in by design — it was an explicit,
reasonable choice at the time, it just didn't survive contact with a real
detailed prompt.

## Result

Code change measured: `typecheck` clean, 693/693 tests passing, no logic
left over from the old two-field design (confirmed by search across the
whole app). NOT yet measured: whether the attack preset itself now produces
a clean swing on a real sprite — that requires an actual PixelLab generation,
which costs real credits, so it's logged as a pending follow-up instead of
assumed to be fixed.

## What I learned

- A feature can be "correct" the day it ships and still be wrong the first
  time someone uses it harder than the day-one test case.
- Hidden text that gets glued onto user text is invisible debt: it works
  until the user's own text is detailed enough to compete with it.
- "The AI can't do what you asked" is sometimes true about the vendor API,
  but it's rarely the end of the conversation — the fix is almost always in
  how WE shape the request, not in asking the user to want less.

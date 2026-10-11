---
name: architecture-decision
description: >
  Guides an architecture decision end to end in PixelForge: define and measure the
  problem, research prior art, compare options with tradeoffs, let the owner decide
  one decision at a time, record an ADR, plan phased work with performance budgets,
  and write plain-language study notes (learning log) for the owner.
  Trigger: scalability or performance work, "how should we architect X", choosing a
  storage/streaming/caching/runtime approach, migrating a subsystem, any change that
  deserves an ADR, or when the owner wants to learn/explain why a decision was made.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- A change affects scale, performance, persistence, runtime or module boundaries.
- The owner says "implement X" for something that has more than one reasonable design.
- An existing decision needs to be explained (interview prep, post, onboarding).

Not for: pure UI tweaks, bug fixes with one obvious fix, renames.

## Critical Rules

1. **The owner decides; the AI researches and recommends.** Never implement an
   architecture before the owner has chosen. Present ONE decision at a time, then STOP
   and wait for the answer.
2. **Problem before solution.** State the problem with numbers (memory, ms, MB, item
   counts). If there is no number yet, the first task is to measure.
3. **Always at least 3 options**, including "keep what we have", each with what you gain
   and what you lose. Mark one as recommended and say why.
4. **Prior art with sources.** Name how known products solved the same problem (exact
   pattern names: e.g. "LRU cache", "list virtualization", "MPEG-DASH segmentation").
   Cite URLs. Never invent numbers; say "not measured" when that is the truth.
5. **Explain in plain language first, jargon second.** One analogy, then the exact term
   so the owner can research it.
6. **Ground claims in the repo.** Read the code and existing ADRs (`docs/adr/`) before
   describing current behavior. Quote file paths.
7. **Record it.** Accepted decision → `docs/adr/NNNN-<slug>.md` (format of 0006/0007,
   template in [assets/adr-template.md](assets/adr-template.md)). Multi-phase work →
   `docs/<topic>-implementation-plan.md` with a performance budget per phase.
8. **Teach.** After the decision (and again after shipping, with real measurements)
   add study notes to `docs/learning-log/` using
   [assets/learning-log-template.md](assets/learning-log-template.md): simple, honest,
   factual. Update `docs/architecture/` research notes when new concepts appear.
   **Never write posts, articles or first-person texts in the owner's voice into the
   repo, and never commit or publish them.** If asked for a draft, give it in chat
   only; the owner writes and publishes his own words.
9. **Authorship layers.** Any reader-facing explanation the AI writes is a SOURCE
   note: put it in `docs/ai-notes/` with the "AI-generated source notes" header and
   never link it from READMEs or indexes. Featured docs (`docs/architecture/`
   narratives, website, posts) are the owner's text; AI only fixes spelling.
10. **Reuse across editors.** Note in the ADR where else the pattern applies (sound,
   sprite/character, scene builder). Extract shared code only at the second real use.
11. **Build pipeline is unchanged.** Implementation still follows AGENTS.md
    (design-agent → frontend-agent → cleancode-agent), on its own feature branch.

## Workflow

| Step | Output | Stop and ask? |
|---|---|---|
| 1. Frame | Problem statement + current numbers + constraints | No |
| 2. Research | Prior-art table + glossary terms + sources | No |
| 3. Options | Table: option / gain / lose / risk / effort; recommendation | **Yes — one decision per question** |
| 4. Record | ADR (Status: Accepted) + research notes update | No |
| 5. Plan | Phases, each shippable, with acceptance metrics | Show summary |
| 6. Build | Pipeline per phase, tests, measured before/after | No |
| 7. Teach | Learning-log study notes (facts, numbers, sources) | Show summary |

## Options table shape

| Option | You gain | You lose | When it wins |
|---|---|---|---|
| A. Keep current | ... | ... | ... |
| B. ... (recommended) | ... | ... | ... |
| C. ... | ... | ... | ... |

## Existing references

- Research notes: [docs/architecture/scalable-assets-research.md](../../../docs/architecture/scalable-assets-research.md)
- ADRs: [docs/adr/](../../../docs/adr/)
- Learning log: [docs/learning-log/](../../../docs/learning-log/)

## Commands

```bash
ls docs/adr                       # next ADR number
git checkout -b feat/<topic>      # every decision's implementation gets its own branch
pnpm --filter @pixelforge/editor bench   # measure before and after (no builds)
```

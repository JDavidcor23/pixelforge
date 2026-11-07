# Learning log

Study notes: one entry per architecture decision, in plain language. Each entry
records the problem, what was researched, the options and their tradeoffs, the
decision, and measured results once the work ships. These are reference notes for
the owner; posts and articles are written by the owner in his own words.

Template: `.claude/skills/architecture-decision/assets/learning-log-template.md`

| Date | Entry | Status |
|---|---|---|
| 2026-10-11 | [Scaling the sound editor to thousands of assets](2026-10-11-scalable-audio-assets.md) | deferred — see `docs/ai-notes/deferred-audio-asset-scalability.md` |
| 2026-10-11 | [Resizing a sprite without losing its layers](2026-10-11-lossless-canvas-resize.md) | shipped — ADR 0008 |
| 2026-10-28 | [Every sprite is a file from the moment you create it](2026-10-28-every-sprite-is-an-asset.md) | decided — ADR 0015 |
| 2026-11-07 | [Why the asset catalog is rebuilt instead of saved](2026-11-07-derived-asset-catalog.md) | decided — ADR 0016 |

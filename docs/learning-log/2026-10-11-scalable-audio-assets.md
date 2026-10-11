# 2026-10-11 — Scaling the sound editor to thousands of assets

**Area**: sound editor (pattern reusable in the sprite/character editor)
**Status**: deferred (2026-10-11) — the editor must be functional first. Plan and triggers: `docs/ai-notes/deferred-audio-asset-scalability.md`
**Related**: ADR 0008 (draft), `docs/architecture/scalable-assets-research.md`

## The problem (no jargon)

The new sound editor keeps every sound fully decoded in memory and forgets
everything on reload. Decoded audio is heavy: about 115 MB for 5 minutes of
stereo at 48 kHz. A real game can have thousands of sounds, so the tab would
crash long before that. On top of that, "Music" was calling the sound-effects
API, which caps every track at 30 seconds.

## What I researched

- **Lazy loading** — Figma opens only the page you land on plus its
  dependencies: 70% fewer nodes in memory, 33% fewer out-of-memory crashes.
- **Data layout over language** — Figma's 25% memory win in Rust came from
  replacing a generic map with a flat sorted list, not from Rust itself.
- **Segmentation (MPEG-DASH)** — YouTube splits media into 2–10 s segments and
  streams only what's next.
- **Reference counting** — Unity Addressables frees an asset when nothing uses it.
- **LRU cache + memory budget**, **list virtualization**, **mipmaps/LOD**.

## Options and tradeoffs

| Option | Gain | Lose |
|---|---|---|
| A. Keep everything in memory | Simple | Crashes at scale; nothing survives a reload |
| B. IndexedDB + bounded cache (recommended) | Offline, free, memory stays fixed | Lives in one browser |
| C. Cloud storage first | Any device, sharing | Cost, login, network, slower to build |

## What I decided and why

Pending. Recommendation: B, behind a repository interface so a cloud adapter can
be added later without rewriting the editor (same pattern as the sprite drafts,
ADR 0006). Start with a 5-minute cap per sound and per mix, kept in one
constant so it can grow.

## Result

Not measured yet. Targets: 10,000 sounds in the library with search under 16 ms
per keystroke and memory under 150 MB.

## What I learned

- The bottleneck is usually how data is loaded and laid out, not the language.
- "Splitting into parts" has a name (segmentation / adaptive streaming), and the
  industry has solved it for 15 years.

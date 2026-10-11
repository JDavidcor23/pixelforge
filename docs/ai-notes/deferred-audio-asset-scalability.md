> AI-generated source notes. Reference material, not the owner's writing.

# Deferred: scaling the sound editor to thousands of assets

**Status:** deferred on 2026-10-11 (YAGNI). The editor must become functional
first: assets module, game building, real use. Come back here only when a
trigger below fires.

Research behind this plan: `docs/architecture/scalable-assets-research.md`
(Figma lazy loading, MPEG-DASH segments, Unity reference counting, LRU cache,
list virtualization, mipmaps). Decision options: `docs/learning-log/2026-10-11-scalable-audio-assets.md`.

## Triggers (measure, then act)

Start this work when ANY of these is true, measured in the real app:

- The library has **more than ~500 sounds** and typing in search takes more
  than 16 ms per keystroke, or scrolling drops frames.
- JS memory in DevTools goes **over ~300 MB** during normal sound editing.
- Someone needs sounds **longer than 5 minutes**, or a mix longer than 5 minutes.
- Users complain that **sounds disappear after a reload** (not persisted).

## Small fixes worth doing earlier (whenever audio is touched)

These are bugs, not scale work:

1. "Music" calls the sound-effects endpoint (`/v1/sound-generation`), so music
   is capped at 30 s. The real Music API is `POST /v1/music` with
   `music_length_ms` (3,000–600,000).
2. The client never sends a duration; add a duration control
   (effects 0.5–30 s, music 3 s–5 min).
3. TTS uses `eleven_multilingual_v2` (10k chars); `eleven_flash_v2_5` allows 40k.
4. The Vercel proxy buffers the whole response (`arrayBuffer()`); Vercel
   Functions limit bodies to 4.5 MB, and a 5-minute MP3 is ~4.8 MB. Stream the
   upstream body instead.

## The plan (when a trigger fires) — one phase at a time

| Phase | What | Pattern names |
|---|---|---|
| 1 | Limits as constants (5 min per asset and per mix), the fixes above | performance budget |
| 2 | Persist sounds and the timeline: small metadata record + audio blob in IndexedDB, behind a repository interface (same as sprite drafts, ADR 0006) | repository pattern, ports & adapters, metadata/blob separation |
| 3 | Long audio as 10 s segments; a fixed-size cache of decoded segments; play by scheduling segments ahead of the playhead | chunking, LRU cache + memory budget, prefetching |
| 4 | Export the mix in 30 s windows and assemble the WAV in parts | windowed rendering |
| 5 | Virtualized library list + a 10,000-sound perf test | list virtualization, cursor pagination |

Phases 2 and 3 are the same storage pattern the future **assets module**
(AI images) will need. Build it once for whichever comes first; extract a
shared module only at the second real use (Rule of Three).

## Memory math (why it matters)

Decoded audio at 48 kHz stereo: ~384 KB per second → ~115 MB per 5 minutes.
Today every sound stays fully decoded in memory and nothing survives a reload.

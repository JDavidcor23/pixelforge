# Scalable assets in the browser — research notes

**Status**: research (2026-10-11). First application: the sound editor
(ADR 0008, in progress). Next: sprite / character editors, future scene builder.

## The problem in one picture

- **RAM is the workbench**: small, fast, expensive. When it fills up the tab
  crashes.
- **Disk (IndexedDB in the browser) is the warehouse**: huge, slower, cheap.

Today the editors put *everything* on the workbench: every asset decoded in
memory, nothing persisted. That works for 50 assets and dies at 10,000. Every
technique below is a way to keep on the workbench only what the user is
touching right now, and everything else in the warehouse.

## Prior art (how big products solved it)

| Product | Technique | Measured result | Lesson for PixelForge |
|---|---|---|---|
| Figma — dynamic page loading | Load only the page the user lands on plus its read/write dependencies; other pages load on navigation. Validated in *shadow mode* before shipping. | Slowest 5% loads 33% faster, 70% fewer nodes in memory, 33% fewer OOM crashes | Load the asset index, not the assets. Validate risky changes in shadow mode. |
| Figma — Rust memory work | Replaced a generic `BTreeMap` with a flat sorted `Vec` for node properties | ~25% less memory on large files, 20% faster deserialization (p99) | Data layout beats language choice. Measure first. |
| YouTube / Netflix — MPEG-DASH, HLS | Media split into 2–10 s segments plus a manifest; the player fetches segments just ahead of playback | Instant start, bounded memory, any length | Store long audio as fixed segments plus a content record (our "manifest"). |
| Unity — Addressables | Reference-counted load/release; a bundle is unloaded when its count reaches 0 | Thousands of assets without leaks | Ref-count content; never free what is still used; never keep what nobody uses. |
| Google Maps — tiles | Precomputed images per zoom level | Smooth zoom on any data size | Precompute waveform "mipmaps" so zooming never needs the full audio. |

## Glossary — exact names to research

| Name | Plain meaning | Where it applies |
|---|---|---|
| Lazy loading | Bring something from the warehouse only when it is used | Audio, sprite frames, scenes |
| List virtualization / windowing | Render only the ~20 visible rows of a 10,000-row list | Sound library, sprite/asset browsers |
| Cursor-based pagination | Read data in pages ("next 500 after X") | Loading big libraries progressively |
| LRU cache (Least Recently Used) | Fixed-size workbench; evict what was untouched longest | Decoded audio, decoded images |
| Memory budget | A hard memory cap the cache never exceeds | e.g. 128 MB for decoded audio |
| Chunking / segmentation | Split a big file into pieces | Long audio (10 s segments) |
| HTTP adaptive streaming (HLS, MPEG-DASH) | The industry version of chunking for media | Inspiration for audio segments |
| Prefetching / read-ahead buffer | Load the next piece before it is needed | Gapless playback |
| Level of detail (LOD) / mipmaps | Same data at several resolutions; use the one the zoom needs | Waveforms, sprite thumbnails |
| Reference counting | Count users of a resource; free it at zero | Shared audio/image content |
| Flyweight pattern | Many objects share one heavy payload | Duplicating an asset without copying data |
| Content-addressable / immutable data | Content never changes; an edit creates new content with a new id | Safe caching, cheap undo, cheap duplicates |
| Metadata / blob separation | Small "index card" apart from the heavy file | Lists read cards only |
| Repository pattern + Ports & Adapters (hexagonal architecture) | The app talks to an interface; IndexedDB today, cloud tomorrow | Already used for sprite drafts (ADR 0006) |
| Local-first software | Works on the device first; cloud is optional | ADR 0007 |
| Response streaming | Send a response in parts instead of buffering it | AI audio through Vercel's 4.5 MB body limit |
| Shadow mode / dark launch | Run new code in parallel without affecting users | Validating a storage migration |
| Performance budget | A measurable target that defines "done" | "Search 10k sounds in < 16 ms" |

## Where to apply it (roadmap, one step at a time)

1. **Sound editor** (now) — ADR 0008: metadata index + segmented content in
   IndexedDB, LRU decoded cache, segment-streaming playback, windowed export,
   virtualized library.
2. **Sprite / character editor** — frames and layers are images: same split
   (index card + blob), LRU of decoded `ImageBitmap`s, thumbnails as LOD,
   virtualized frame/asset lists.
3. **Shared asset layer** — once two editors use the same pattern, extract a
   shared `AssetRepository` + cache package instead of duplicating it (rule of
   three: don't abstract before the second real use).
4. **Scene builder** (future) — lazy-load scenes like Figma pages: open one
   scene plus its dependencies.

## Reading list (start at the top)

1. *The System Design Primer* — donnemartin, GitHub. Free; caching, scaling,
   streaming in one place.
2. *Game Programming Patterns* — Robert Nystrom (gameprogrammingpatterns.com).
   Flyweight, Object Pool, and other patterns for games.
3. web.dev — "Storage for the web" and "Virtualize large lists".
4. *Local-first software* — Ink & Switch essay (basis of ADR 0007).
5. *Designing Data-Intensive Applications* — Martin Kleppmann. Dense; later.

## Sources

- Figma — Speeding Up File Load Times, One Page At A Time:
  https://www.figma.com/blog/speeding-up-file-load-times-one-page-at-a-time/
- Figma — Memory optimizations in Rust:
  https://www.figma.com/blog/supporting-faster-file-load-times-with-memory-optimizations-in-rust/
- Figma — Incremental frame loading: https://www.figma.com/blog/incremental-frame-loading/
- MPEG-DASH explained (Wowza):
  https://www.wowza.com/blog/mpeg-dash-dynamic-adaptive-streaming-over-http
- Unity Addressables — Memory management:
  https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/MemoryManagement.html
- ElevenLabs API limits (fetched 2026-10-11): sound effects 0.5–30 s; music
  `music_length_ms` 3,000–600,000; TTS `eleven_flash_v2_5` 40,000 characters.
- Vercel Functions: 4.5 MB request/response body limit; streaming is the
  documented workaround (to be verified with a preview deploy).

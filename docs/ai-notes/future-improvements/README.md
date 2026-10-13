> AI-generated source notes. Reference material, not the owner's writing.

# Future improvements — index

These are the improvements Jorge wants to make to PixelForge later. Each row
links to its own note with the details: what it is, why it waited, what it
touches and how to build it.

**How to use this file (for AI assistants):**

- Read this index first. Open a linked note only when the task touches its area.
- When an idea is postponed ("we'll do it later"), add a row here and a note
  in this folder. Do not build it on the spot.
- Before proposing a new feature, check that it is not already listed.
- **Urgency is Jorge's call.** Leave it as `Not decided` until he sets it.
  "Suggested" is only the assistant's opinion, with the reason.

## Backlog

| # | Improvement | Area | What it affects | Urgency | Suggested | Note |
|---|---|---|---|---|---|---|
| 1 | AI sprite variations (several takes of one prompt) | Sprite editor · Create tab | Create tab UI, Retro Diffusion proxy, cost estimate, Assets panel | Not decided | Not urgent — nice to have; the API already supports it | [ai-sprite-variations.md](./ai-sprite-variations.md) |
| 2 | Sound editor with many files and long audio | Sound editor | Sound library, timeline, persistence (IndexedDB), playback, mix export | Not decided | Not urgent — wait for a measured trigger (see note) | [deferred-audio-asset-scalability.md](../deferred-audio-asset-scalability.md) |
| 3 | Small audio fixes (real Music API, duration control, longer TTS, streamed proxy) | Sound editor · AI generation | ElevenLabs proxy, sound generation UI | Not decided | Do it the next time audio is touched — these are bugs, not scale work | [deferred-audio-asset-scalability.md § Small fixes](../deferred-audio-asset-scalability.md#small-fixes-worth-doing-earlier-whenever-audio-is-touched) |

## Adding an entry

1. Create `<short-name>.md` in this folder, starting with the
   "AI-generated source notes" line.
2. Sections: **What**, **Why it waited**, **What it affects**, **How to build it**.
3. Add a row to the table above with `Urgency: Not decided`.

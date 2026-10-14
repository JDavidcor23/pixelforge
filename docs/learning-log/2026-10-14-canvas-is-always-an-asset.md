# 2026-10-14 — The canvas is a draft, Assets is the library: why "Save As" had nowhere to go

**Area**: sprite editor
**Status**: decided
**Related**: ADR 0010, `docs/sprite-save-as-implementation-plan.md`

## The problem (one paragraph, no jargon)

The editor already auto-saves everything you draw, so you never lose work —
but it saves it into one single, unnamed slot, like a scratch notepad that
always has the same page open. Separately, anything you generate with AI or
import gets a real name and shows up in the Assets library. Those are two
different places that don't talk to each other. So if you draw something by
hand, it's safe (autosave), but it has no name and no way to show up next to
your other sprites — there was simply no button that moved work from "the
scratch page" into "the library," which is exactly what a Photoshop-style
`Save As` is supposed to do.

## What I researched

- **Local-first software** — the app works fully offline/on-device first,
  sync to the cloud is optional and separate (this was already decided in
  ADR 0007; I didn't have to re-decide it, just understand it).
- **Single-document vs. library-of-documents apps** — Photoshop keeps many
  open named files with an explicit Save/Save As. Figma and Google Docs keep
  one document with an editable title and invisible autosave — no Save button
  at all. Procreate's Gallery is the closest match to what PixelForge already
  has: every canvas you make is a tile in a gallery, autosaved, renamed by
  tapping it — there's no separate "unsaved scratch page" concept at all.
- **Repository pattern** — the code already stores Assets items through one
  interface (`indexeddb-asset-library.repository.service.ts`) regardless of
  where they came from (AI, import). Reusing that same interface for
  hand-drawn saves meant this didn't need a new storage system, just a new
  way to create an entry in the one that already exists.

## Options and tradeoffs

| Option | Gain | Lose |
|---|---|---|
| Keep as-is, just explain it better in the UI | No engineering work | Doesn't fix the actual gap — hand-drawn work still never reaches Assets |
| **Unify: canvas becomes a snapshot source for Assets (chosen)** | Reuses what already works, closes the real gap, small-ish build | Still only one canvas open at a time — no document switching yet |
| Full Photoshop model: named documents, explicit Save/Save As, multiple open at once | Matches the mental model I came in with | Much bigger rebuild of the persistence layer for a problem I don't have yet (I only ever have one sprite open) |

## What I decided and why

Went with the middle option. The honest reason the "full Photoshop" option
lost: the editor doesn't actually need multiple documents open at once today
— it needs the ONE thing I'm working on to be nameable and show up where my
other sprites live. Building real multi-document support to solve that would
be solving a problem I don't have yet, at several times the cost.

I also asked for a right-click menu and drag-and-drop to move sprites between
folders. That got deferred to a possible phase 2: nothing else in this app
uses right-click menus or drag-and-drop today, so it would be a brand new way
of interacting with the app, not a reuse of an existing one. First pass ships
small icon buttons (rename, move) next to the Delete/Download buttons the
Assets tiles already have — same pattern, less to learn, and if it turns out
too slow to use once there are hundreds of sprites, that's exactly the
measured signal to justify building the richer version.

## Result

Not built yet — this is the decision record. Implementation is tracked in
`docs/sprite-save-as-implementation-plan.md`, phase 1 first (Save As with a
name and a type), phase 2 next (rename/move icon buttons).

## What I learned

- A "Save" button and an autosave system aren't the same feature — this app
  had autosave (so nothing is ever lost) but no Save (so nothing ever gets a
  name), and those are independent things you can have one of without the
  other.
- When a request sounds like "give me feature X from app Y," the useful
  question is what X is actually *for*, not how to copy it — I didn't need
  Photoshop's multiple-open-documents machinery, I needed my one sprite to
  have a name and a home, which is much cheaper to build.
- Reusing an existing storage pattern (the Assets repository) for a new kind
  of entry is often most of the work "done for free" — the real new work was
  deciding what triggers a save, not how to store it.

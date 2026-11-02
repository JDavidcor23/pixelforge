# 2026-10-28 — Every sprite is a file from the moment you create it

AI-generated source notes. Decision: ADR 0015.

**Area**: sprite editor
**Status**: decided
**Related**: ADR 0015, ADR 0010, ADR 0014

## The problem (one paragraph, no jargon)

The sprite editor worked on one hidden sheet with no name. "Save As" made a copy of that
sheet in the library, but the sheet and the copy were never linked again. The new game
screen needs an "Edit" button that opens a library asset in the editor. With only one sheet,
opening an asset would erase whatever unsaved drawing was there, and the edits would never
reach the library asset anyway.

## What I researched

- **Document model**: what the app treats as "the thing you are editing".
- Figma and Google Docs: every new file is a real file called "Untitled" from the start,
  saved as you work, renamed whenever you want.
- Known cost: people end up with many blank "Untitled" files (Figma forum).

## Options and tradeoffs

| Option | Gain | Lose |
|---|---|---|
| Keep one hidden sheet + Save As copy | No work | Lost drawings; the game never sees edits |
| One hidden sheet per asset | Safe to open assets | Two copies of everything that drift apart |
| The sprite is the asset from the start | One copy, nothing to lose, edits reach the game | One-time migration; avoid blank files |

## What I decided and why

The sprite is the asset from the moment it exists, named "Untitled N" until renamed. That is
how Figma and Google Docs work, so users already know it, and it removes the idea of a
"draft" entirely. A new sprite is only stored after the first edit, so blank files do not
pile up.

## Result

Not built yet.

## What I learned

- A "draft" is just a second copy of the truth. Two copies of the truth always drift.
- The cleanest fix to "how do I avoid losing unsaved work" is to have no unsaved state.

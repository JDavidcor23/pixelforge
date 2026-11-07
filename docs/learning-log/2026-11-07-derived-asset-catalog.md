# 2026-11-07 — Why the asset catalog is rebuilt instead of saved

**Area**: sprite editor, sound editor, build screen
**Status**: decided
**Related**: ADR 0016, ADR 0014, ADR 0015

> AI-generated source notes. Not for publication; the owner writes featured text.

## The problem (one paragraph, no jargon)

The Build screen needs one list of every asset (sprites and sounds) with a stable ID and a
revision number, so the game preview can swap a changed image or sound live. Sprites live in
the browser database and sounds live in cloud storage, and neither has a shared index.
The question was whether to save that list as a third thing or rebuild it each time the
app loads. Up to 200 sprites per kind plus the sound listing feed it.

## What I researched

- Derived state: data computed from other data, never stored itself, so it cannot go out of
  date.
- Stored index: a saved copy of "what exists", which is fast but must be kept in step.
- Normalization, `byId` and `allIds`: an object keyed by ID plus an ordered list of IDs, so
  each item exists once and is found by ID (Redux, https://redux.js.org/usage/structuring-reducers/normalizing-state-shape).
- Drift: the saved index and the real files disagree after one changes without the other.
  Lightroom's "missing photos" is the classic case (https://helpx.adobe.com/lightroom-classic/help/locate-missing-photos.html).

## Options and tradeoffs

| Option | Gain | Lose |
|---|---|---|
| A. No catalog | No work | No per-ID revision, no live swap |
| B. Rebuild on every load | One source of truth, no orphans | Tags are lost on reload; rebuild cost on load |
| C. Stored catalog | Tags survive | Two sources of truth that drift; migration |
| D. Rebuild + tag sidecar | Tags survive, no orphans | Extra store; not needed until tags exist |

## What I decided and why

Option B was chosen. Entities are rebuilt from the two storages on each load, so a delete or
an eviction can never leave a stale entry. Level and chat-turn tags are lost on reload, which
is acceptable because levels and chat turns have no ids and nothing creates those tags yet.
Option D is the planned upgrade once they do. Sounds have no revision, so one is kept in
memory per session.

## Result

Not built yet. The rebuild cost on load has not been measured.

## What I learned

- A stored index is a second source of truth; the cost is drift, not disk space.
- Normalized state (`byId` plus `allIds`) lets one row update without touching the others.
- Deferring a feature is cheaper when the upgrade path (a tag sidecar) is named in advance.
- Revisions held only in memory work for live updates inside a session but cannot be
  compared across reloads.

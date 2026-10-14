> AI-generated source notes. Reference material, not the owner's writing.

# Cancel an in-flight AI generation

## What

A way to abort a sprite generation after pressing "Create with AI" while it is
still running, instead of only being able to wait it out.

## Why it waited

Found during an impeccable design critique of the Sprite Studio v3 Create tab
(2026-10-14): the panel disables its controls while generating but gives no
escape hatch. Fixing the critique's other findings was in scope (accessibility,
button state, counter units); adding real cancellation is new functionality,
not a fix to something already there, so it was logged here instead of built
on the spot.

## What it affects

- `apps/editor/src/sprites/features/properties/components/CreateTab/GeneratePanel.tsx`
  and `useGeneratePanel.hook.ts` (the Create button / loading state)
- Whatever carries the in-flight request — likely the AI jobs store
  (`useAIJobsStore`) and the Retro Diffusion proxy call in
  `apps/editor/api/ai/retro-diffusion.ts`
- Needs an `AbortController` (or equivalent) threaded from the UI action
  through to the fetch call, plus store cleanup if a job is aborted mid-flight

## How to build it

1. Add an abort mechanism to the generation call (client-side `AbortController`
   is enough if the proxy function doesn't need server-side cancellation).
2. Surface a "Cancel" action next to/replacing the spinner while
   `isLoading` is true.
3. On cancel, reset the AI jobs store's in-flight state cleanly (no stuck
   "Generating…" UI, no orphaned result once the real response arrives late).

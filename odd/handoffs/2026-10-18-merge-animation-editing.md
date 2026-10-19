# Handoff 1 of 2 — merge `feat/animation-editing` into `master`

AI-generated source notes. Scope: ONLY the merge. The new attack-model
implementation is handoff 2 (`odd/handoffs/2026-10-18-attack-model-routing.md`)
and runs in a separate conversation after this one.

## What to merge

- Branch `feat/animation-editing`, worktree
  `C:\Users\PC\Documents\web\my_proyects\game-builder\.claude\worktrees\animation-editing`.
- Target: `master` (`C:\Users\PC\Documents\web\my_proyects\game-builder`).
- Commits ahead of master (oldest first): `458aea7`, `1e50f59`, `948043d`,
  `21e195e`, `e8d7d4b`, `98f2bda`, plus the commit that adds this handoff.
- Content: ADR 0012 (preset motion text is the editable action field),
  `swingsHeldItem` preset flag, attack as overhead smash, new presets
  `jump-attack` and `cast-spell`, feature doc
  `odd/tasks/animation-motion-detail.md` (L1-L10).

## Watch out (verified 2026-10-18)

- `master` has UNCOMMITTED work that is not ours — do not lose it:
  `useAnimateTab.hook.ts` (exports `pickFrameCount`, new `nextFrameCount`,
  keeps the user's frame choice across motion changes), `useImportSpriteSheet.hook.ts`
  + its test, a new untracked `useAnimateTab.hook.test.ts`, `.atl/skill-registry.md`.
  Ask the owner whether to commit that work first (on its own branch) before merging.
- Expected conflict: `useAnimateTab.hook.ts`. Our branch changes only the
  submit call to `buildAnimationAction(actionText, assetType, motion)` (3rd arg
  = selected preset). Keep both sides.
- `graphify-out/` will likely conflict: take either side, then run `graphify update .`.
- After merging: `pnpm --filter editor exec vitest run` (branch was 696/696)
  and `tsc --noEmit -p apps/editor`. Do not build (owner rule).
- Owner pushes via Claude on the feature branch; ask before pushing master.

## Prompt to paste in the new conversation

> Lee `C:\Users\PC\Documents\web\my_proyects\game-builder\.claude\worktrees\animation-editing\odd\handoffs\2026-10-18-merge-animation-editing.md`
> y haz solo el merge de `feat/animation-editing` a `master`, cuidando los
> cambios sin commitear que hay en master.

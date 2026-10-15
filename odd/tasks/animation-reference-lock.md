# Animation reference lock

Objective: stop the Animate tab from silently re-reading the live canvas as
the generation reference; let the user pick it once (canvas frame or Asset)
and lock it for the session, visible as a chip. Branch: `feat/animations`.
Delivery: work-unit commits on this branch (owner decides push/PR later).
Test runner: `pnpm --filter @pixelforge/editor test`.

## Specs

- S1 (bug, deferred — not authorized yet): "si yo por ejemplo escojo
  erróneamente la animación... no hay una manera de cancelar" — no cancel
  control while a job is actively generating (`AnimateTab.tsx`'s discard
  button only renders when `isStalled`).
- S2 (bug, deferred — not authorized yet): "le había puesto 12... cuando lo
  cambié a correr y le di generar, se cambió a 8 frames... no entiendo por
  qué se cambia los frames cuando cambia el selector" — `setMotionId` resets
  `nFrames` to the new motion's default (`useAnimateTab.hook.ts:213-219`).
- S3 (architecture problem, in scope): "a mí se me fue el dedo poniendo el
  tema de animar... tomó la referencia de la animación de correr... en el
  primer frame para agacharse, tiene la animación de correr." Root cause:
  `exportCanvasReference()` reads live canvas at submit time
  (`useAnimateTab.hook.ts:135-140`); `useFinishAnimation.hook.ts:34-37`
  auto-applies results to a blank timeline, so the next submit's reference
  has drifted.
- S4 (UX decision, in scope): "opción 1, lo que está en el canvas... opción
  2, algo de los assets... si le das canvas... ¿cuál frame vas a elegir?...
  antes de mandarlo, pones así como un chip, dice referencia... para que el
  usuario pueda entender." A picker with a Canvas-frame source and an
  Assets source, plus a visible chip before generating.
- S5 (UX decision, in scope): "Por ahora la podrías dejar fija... Se va a
  usar la misma referencia que pusiste arriba... siempre dejar el chip
  ahí... Esta es la referencia tal tal. De aquí se van a generar todas." The
  chosen reference locks for the rest of the session across every motion,
  shown persistently.
- S6 (authorization): "Escribe la ADR y haz de una vez el código... te doy
  el permiso de que sigas programando. Haz una ADR y implementa el código.
  Y después, si tengo algo que corregir, modificas otra vez el documento y
  modificas el código." Owner authorized ADR + implementation, unattended;
  corrections happen in a follow-up pass.
- S7 (design feedback): "la verdad se le pondría un poquito más de diseño
  porque está muy simple y se ve horrible." The chip/picker shipped in T2
  needed a real visual pass against `DESIGN.md` (label-caps caption, `ai`
  marker for the AI-feeding control, mono/sans split for machine vs
  human-authored labels, visible tile captions).
- S8 (follow-up ask): "¿Y qué pasó con el botón de cancelar que no lo estoy
  viendo?... ¿No lo integraste?" Owner clarified S1 should be implemented
  now (it had been explicitly deferred/not authorized until this message).
- S9 (bug, in scope): "el botón de center... cuando estoy en una animación
  de 128, muere... demasiado zoom... el zoom creo que es de 600 y debería
  ser de 400 por lo menos para 128." Root cause: `resetViewport` snapped to
  a flat `SPRITE_EDITOR_CANVAS.RESET_VIEW_ZOOM = 9` (900%) regardless of
  canvas size, tuned only for the 64px default.
- S10 (design feedback): "el botón de cancel diseño es malísimo." The Cancel
  control (T3) shipped with plain `SECONDARY_BUTTON` styling, identical to
  the neutral "Check again" button, even though it stops a possibly-billed
  job.

## Tasks

- T1 — Write ADR 0011 (S3, S4, S5). Route: inline. Status: done
  (`docs/adr/0011-explicit-animation-reference-lock.md`).
- T2 — Implement the locked-reference state + submit wiring + picker UI +
  chip (S3, S4, S5). Route: delegated (frontend-agent → cleancode-agent;
  design-agent step skipped — see L7, the file doesn't exist in this repo).
  Status: done, reviewed, tests/typecheck green.
- T3 — S1 (cancel while generating): authorized by S8. Route: delegated
  (frontend-agent → cleancode-agent). Status: done, reviewed (approved, no
  edits needed), tests/typecheck green.
- T4 — S2 (frame count reset on motion change): still deferred, not
  authorized.
- T5 — Visual pass on Reference chip/picker (S7). Route: delegated
  (frontend-agent → cleancode-agent; design-agent step skipped, see L7).
  Status: done, reviewed, tests/typecheck green.
- T6 — Scale center-view zoom to canvas size (S9). Route: delegated
  (frontend-agent → cleancode-agent). Status: done, reviewed, tests/
  typecheck green (666 passed, 77 files).
- T7 — Design pass on the Cancel button (S10). Route: delegated
  (frontend-agent → cleancode-agent; design-agent step skipped). Status:
  done, reviewed (opacity corrected to match the project's one danger-card
  convention), tests/typecheck green (666 passed, 77 files).

## Log

- L1 (2026-10-14): Owner reported S1, S2 in chat while testing the editor
  (dictated, worktree `feat/animations`).
- L2 (2026-10-14): Owner described S3 with screenshots of the wizard
  character mid-run leaking into the crouch animation's first frame.
- L3 (2026-10-14): Presented options A/B/C per architecture-decision skill;
  owner picked B.
- L4 (2026-10-14): Owner refined B into S4 (canvas-frame/Asset picker +
  chip).
- L5 (2026-10-14): Owner refined further into S5 (session-locked reference)
  and gave S6 (go-ahead to write the ADR and implement unattended).
- L6 (2026-10-14): frontend-agent implemented T2 — `animationReference`
  locked in `ai-jobs.store.ts` (sessionStorage, same pattern as
  `animatePending`); pure builders in `animation-reference.ts`;
  `ReferenceChip`/`ReferencePicker` components; `handleGenerateAnimation`
  reads the locked snapshot instead of `exportCanvasReference()`. RED→GREEN
  for the new pure logic. `pnpm --filter @pixelforge/editor test`: 658
  passed, 76 files. `typecheck`: 0 errors.
- L7 (2026-10-14): `.claude/agents/design-agent.md` confirmed absent from
  this repo (`git log --all` shows it was never created) — frontend-agent
  self-sourced `DESIGN.md` tokens and reused this file's own existing
  Tailwind class constants instead. Worth creating that agent file.
- L8 (2026-10-14): cleancode-agent reviewed all 12 touched/new files — no
  fixes needed, confirms tests/typecheck still green after its pass.
  Flagged one pre-existing-adjacent duplication: `useReferencePicker.hook.ts`
  duplicates `useAssetsPanel.hook.ts`'s generation+animation merge (~27
  lines) because that file was outside this task's authorized surface.
  Left as-is; follow-up candidate once ADR-0010's `kind: 'drawing'` lands on
  this branch and both hooks need updating anyway.
- L9 (2026-10-14): Owner found the shipped chip/picker too plain (S7). Read
  `DESIGN.md` myself (acting in design-agent's place) and wrote a concrete
  spec: label-caps "Reference" caption, `ai`-token marking for the
  unset/call-to-action state (this control feeds the AI generation call),
  trailing change-affordance icon on the set state, mono/sans split for
  machine-computed vs human-authored labels, visible tile captions in the
  picker grid. frontend-agent implemented it (markup/className only, no
  logic changes); cleancode-agent reviewed and removed one dead `group`
  class with no `group-hover` consumer. Tests: 658 passed, typecheck clean.
- L10 (2026-10-14): Owner asked why S1 (cancel while generating) wasn't
  done — clarified it was deferred/unauthorized, not forgotten; owner's
  follow-up message authorized it, now T3.
- L11 (2026-10-14): frontend-agent implemented T3 (see L prior entries for
  detail — superseded by this log's numbering; cancel control shipped,
  reviewed, committed as `ae10745`).
- L12 (2026-10-14): Owner reported S9 (zoom) while a separate design pass
  was running. frontend-agent extracted `getCenterViewZoom(canvasWidth,
  canvasHeight)` in `viewport.slice.ts`, anchored to the original 900%-at-
  64px baseline (64→9, 128→4.5, 256→2.25, clamped). Updated `resetViewport`,
  `useCanvasOverlay.hook.ts`'s label/centered-check, and the Ctrl+0 shortcut
  to all derive from the same function — no leftover flat constant. Also
  touched `types/index.ts` (outside the given surface) for a duplicate
  `resetViewport` type signature required by `tsc`; authorized as necessary.
  RED→GREEN via new `viewport.slice.test.ts`. Tests: 666 passed/77 files.
  cleancode-agent reviewed, no fixes needed, confirmed single source of
  truth across all three call sites.
- L13 (2026-10-14): Owner reported S10 (Cancel button design) mid-flight,
  while the zoom-fix agent was still running — confirmed no file overlap
  (Cancel lives in `AnimateTab.tsx`/`animate-tab.classes.ts`, zoom fix
  doesn't touch either) and ran both in parallel. frontend-agent gave Cancel
  a `danger`-toned `DANGER_BUTTON` class and a card matching the `isStalled`
  sibling block's shape, instead of the neutral `SECONDARY_BUTTON` it
  shared with "Check again". One of its own verification steps used
  `git stash push -u`/`apply` (never bare pop, per shared-stash-stack
  safety) to isolate pre-existing failures for diagnosis; the resulting
  duplicate stash entry was manually confirmed redundant (diff already
  present in the working tree) and dropped. Both agents' work verified
  intact afterward via full `git status`/`git diff --stat`.
- L11 (2026-10-14): frontend-agent implemented T3. Confirmed the mechanism
  (`handleDiscardJob`, `pollUntilDone`'s `abandoned` outcome) already handled
  cancel-while-generating correctly before touching anything — this was a
  pure UI-gap fix, no hook logic changed. Added a new Cancel control in
  `AnimateTab.tsx`, shown whenever `isGenerating && !isStalled`, wired to the
  existing `handleDiscardJob`; left the `isStalled` block's own Discard
  button untouched. New constants `ANIMATION_CANCEL_LABEL`/
  `ANIMATION_CANCEL_HINT` in `constants/animation.ts`, copy consistent with
  the existing `ANIMATION_DISCARD_LABEL`/`ANIMATION_DISCARD_HINT`. No RED
  test: the condition only combines two booleans the hook already exposed
  (`isGenerating`, `isStalled`) with no new derived logic to extract — pure
  JSX wiring. `pnpm --filter @pixelforge/editor test`: 658 passed, 76 files
  (no change). `typecheck`: 0 errors. Pending cleancode-agent review (no
  Task/Agent tool available in this session).

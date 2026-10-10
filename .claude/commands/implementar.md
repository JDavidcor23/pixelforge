---
description: Implement a Pencil frame as working code, then review, animate and polish it automatically
argument-hint: "<Pencil frame name>" [extra notes]
---

Implement this design from the open Pencil file (`design.pen`): $ARGUMENTS

The user is not a designer. They run this one command and expect the whole job done.
Do not ask them to run extra commands or name skills. Ask only when blocked on a real
decision, one question at a time.

## 1. Read the design

- Use the `mcp__pencil__*` tools only. Start with `get_app_state`.
- Find the frame by name (closest match if not exact). If it is missing, list the
  top-level frames and ask which one.
- Read the frame with `Get` (depth as needed, `resolveVariables: true`) to capture
  structure, copy, tokens, sizes and states. Do not rely on screenshots: they often
  render blank.
- Map every color/spacing/radius to a token in `DESIGN.md` / `packages/tokens/tokens.css`.
  If a value has no token, report it instead of hardcoding.

## 2. Plan

- Identify which app the screen belongs to (`apps/editor` or `apps/landing`) and the
  existing feature folder it replaces or extends.
- List the components, hooks, store changes and services involved, reusing what exists.
- Keep behavior that already works; only change what the design changes.

## 3. Build (project pipeline)

Run the pipeline from `AGENTS.md`, passing the frame data and plan to each agent:

1. **design-agent** → Tailwind implementation spec from the frame and `DESIGN.md`.
2. **frontend-agent** → implements it (components JSX-only, logic in `use*.hook.ts`,
   granular Zustand selectors, constants in `src/constants/`).
3. **cleancode-agent** → reviews and fixes code quality.

Act on any findings the impeccable design hook reports after edits.

## 4. Review and finish

Do these yourself, in order, without asking the user:

1. **Design review**: apply the `impeccable` skill in critique mode on the changed
   files and fix every material issue (hierarchy, spacing, contrast, copy, empty /
   loading / error states).
2. **Motion**: apply `find-animation-opportunities`, then implement only the ones that
   help understanding or feedback (open/close of popovers and panels, press feedback,
   list changes) using the `animate` skill. Respect `prefers-reduced-motion`. No
   decorative motion.
3. **Edge cases**: apply `break-ui` thinking to lists and names (empty, very long,
   many items) and fix what breaks.
4. **Polish**: one final `impeccable` polish pass. Bounded: one round of fixes, no loops.

Never run a build (project rule). Typecheck/lint only if they are fast and already
configured.

## 5. Report

Reply in the user's language, max ~8 short lines, plain words:
- what screen was implemented and where to see it in the app,
- what was improved in review (1-3 bullets),
- anything that needs their decision.

No step-by-step recap. Do not commit unless asked.

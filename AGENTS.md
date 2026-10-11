# PixelForge

Browser-based 2D game builder. Users create sprites manually or with AI, build game scenes visually, and publish directly to Vercel with a single click.

pnpm workspace monorepo — **two separately deployed apps, two different stacks.**
Always check which app a file lives under before applying a rule below; the
"Navigation", "Images" and `'use client'` rules differ per app (see each
section). `packages/core` (Rust/Wasm) and the apps' Rust-facing boundary are
documented in `openspec/changes/migrate-to-rust-core/design.md` and
`docs/adr/0001`–`0007`.

## Stack

Shared across the workspace:
- **TypeScript** (strict mode)
- **Tailwind CSS v4, CSS-first** (no CSS-in-JS, no inline styles) — tokens from `packages/tokens`
- **pnpm workspaces** (`apps/*`, `packages/*`)

`apps/landing` (marketing site, Vercel project "landing"):
- **Next.js 16.2.3** (App Router)
- **React 19.2.4**
- Fonts via `next/font/google` (Geist)
- Navigation via `next/link` / `next/navigation`

`apps/editor` (sprite + sound editor, Vercel project "editor", SPA):
- **Vite 6** + **React 19.2.4**
- **react-router-dom** (`BrowserRouter`, `Link`, `Outlet`, `useLocation`) — **not** `next/link`/`next/navigation`
- **Zustand** (granular selectors only) — the editor owns the only store in the workspace
- **Konva.js** / **react-konva** (sprite canvas)
- **Supabase** (auth + storage)
- **Retro Diffusion API** / **ElevenLabs API** (AI generation — proxied through `apps/editor/api/ai/*.ts` Vercel Functions; keys stay server-side, never `VITE_`-prefixed)
- Fonts via a `<link>` tag in `index.html` (Geist, no `next/font`)
- Env vars via `import.meta.env.VITE_*` (never `process.env.NEXT_PUBLIC_*`)
- `<img>` for images (no `next/image` — there is no Next.js image optimizer here)

`packages/tokens`: shared design tokens (`tokens.css` + `colors.ts`), source-exported, no build step (`"exports"` points straight at `.ts`/`.css`).

**Phaser.js** (game preview runtime) is planned but not yet wired into either app.

## Project structure

```
apps/
├── landing/                    # Next.js marketing site (its own Vercel project)
│   └── src/app/(landing)/      # Landing page + sections
└── editor/                     # Vite SPA — the entire former /editor/* tree
    ├── api/ai/                 # Vercel Functions (retro-diffusion.ts, elevenlabs.ts)
    ├── public/                 # Editor-only static assets (AI guides, sample sprites)
    └── src/
        ├── App.tsx             # react-router routes (sprites, sounds)
        ├── components/         # Shell-level UI (EditorLayout, SettingsPanel)
        ├── sprites/            # Sprite editor feature tree
        │   └── features/       # canvas, layers, properties, timeline, tools
        ├── sounds/              # Sound editor feature tree
        │   └── features/        # synthesizer, library, playback, ai-generate
        ├── stores/             # Zustand store + slices (the only store in the repo)
        ├── services/           # API / Supabase / persistence adapters
        ├── lib/                # Canvas utils, codecs
        │   └── core/            # PixelCore boundary (TS today; Rust/Wasm in phase 4+)
        ├── hooks/              # Shell-level hooks
        ├── constants/          # UPPER_SNAKE_CASE constants
        └── types/              # TypeScript interfaces
packages/
└── tokens/                     # Shared design tokens (tokens.css, colors.ts) — no build step
```

## Design system

`DESIGN.md` at the repository root is the **source of truth for the visual
language** ("Synthetic Architect"): color tokens, typography, spacing, radius,
elevation and component conventions. Read it before writing any UI.

Never hardcode a hex, radius or spacing value into a component. If a token does
not exist in `DESIGN.md`, that is a design decision — escalate it to
design-agent, do not improvise.

Note: `DESIGN.md` frontmatter and prose disagree with the token CSS
(`packages/tokens/tokens.css`, imported by both `apps/landing/src/app/globals.css`
and `apps/editor/src/index.css`) on the palette and font stack. design-agent
owns reconciling them.

## Agents

Always delegate to the right agent for each task.

Pipeline for anything visual: **design-agent → frontend-agent → cleancode-agent**.

### 🎨 design-agent
Use for: anything that touches look and feel — new screens, panels, visual
restyling, theming, spacing, color, typography, motion.
Runs BEFORE any UI is written. Owns `DESIGN.md` tokens and `packages/tokens/tokens.css`
(consumed by both `apps/landing/src/app/globals.css` and `apps/editor/src/index.css`).
Produces a Tailwind implementation spec; does not write hooks, stores or logic.
After finishing: hands off to frontend-agent.
```
.claude/agents/design-agent.md
```

### 🧱 frontend-agent
Use for: creating or modifying any component, page or UI feature.
Implements the spec from design-agent — structure, hooks, services, types.
After finishing: always invokes cleancode-agent.
```
.claude/agents/frontend-agent.md
```

### 🧹 clean-code-agent
Use for: reviewing and fixing code quality after frontend-agent.
Checks: separation of responsibilities, magic values, inline styles, types, Zustand patterns.
After finishing: invokes test-agent.
```
.claude/agents/clean-code-agent.md
```

### 📏 rules-agent
Use for: any doubt about structure, naming, patterns, Tailwind, constants or Zustand.
Read-only agent, does not modify files.
```
.claude/agents/rules-agent.md
```

### 🗄️ zustand-agent
Use for: creating or refactoring any Zustand store.
```
.claude/agents/zustand-agent.md
```

## Architecture decisions

Anything that affects scale, performance, persistence, runtime or module
boundaries goes through the **architecture-decision** skill
(`.claude/skills/architecture-decision/SKILL.md`) before any code: measured
problem → prior art → options with tradeoffs → the owner decides → ADR in
`docs/adr/` → phased plan → learning-log entry in `docs/learning-log/`.
Research notes live in `docs/architecture/`.

## Authorship of documents

Two layers, never mixed:

- **AI source notes** (specs, research summaries, base explanations) go in
  `docs/ai-notes/`, start with an "AI-generated source notes" line, and are
  never linked from the README, indexes, articles or posts.
- **Featured documents** (`docs/architecture/`, `docs/adr/` narratives, the
  owner's website, LinkedIn) are written by the owner. AI may only fix spelling
  and grammar. AI never writes, commits or publishes text in the owner's voice;
  drafts are given in chat only.

## Core rules (summary)

- **Canvas: Use Infinite Canvas pattern.** The `<canvas>` must track its parent container size (100%) using `ResizeObserver`. All drawing logic must use centered offsets instead of CSS centering to allow stable zooming.
- **Component = JSX only.** All logic goes in `use*.hook.ts`
- **No inline styles.** Tailwind classes only (exception: dynamic canvas values)
- **No `any`.** All types defined in `src/types/`
- **No magic values.** Constants in `src/constants/` with UPPER_SNAKE_CASE
- **No hardcoded design values.** Colors, spacing, radius and typography come from
  `DESIGN.md` tokens — never an arbitrary hex or `p-[13px]`
- **Zustand selectors are always granular:** `state => state.field` (`apps/editor` only — `apps/landing` has no store)
- **Store consumed only from hooks,** never from JSX directly
- **Navigation:** `apps/landing` → `next/link` / `useRouter`; `apps/editor` → `react-router-dom`'s `Link` / `useNavigate`. Never `window.location` in either.
- **`'use client'` only in `apps/landing`,** and only when strictly needed (useState, useEffect, browser APIs). It does nothing in `apps/editor` (no RSC there) — do not add it.
- **Images:** `apps/landing` → `next/image`; `apps/editor` → plain `<img>` (no Next image optimizer in a Vite SPA). Never swap one app's convention into the other.
- **Env vars:** `apps/landing` → `process.env.NEXT_PUBLIC_*`; `apps/editor` → `import.meta.env.VITE_*`. Never mix prefixes.
- **No `console.log`** (only `console.error` in catch blocks)

IMPORTANT: 
-Always use the agents defined in the .claude/agents/ directory to create or modify any component, page or UI feature.
-Do not use build commait if the user does not explicitly ask for it.
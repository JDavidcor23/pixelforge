# PixelForge

Browser-based 2D game builder. Users create sprites manually or with AI, build game scenes visually, and publish directly to Vercel with a single click.

## Stack

- **Next.js 14** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS** (no CSS files, no inline styles)
- **Zustand** (granular selectors only)
- **Konva.js** (sprite editor canvas)
- **Phaser.js** (game preview runtime)
- **Supabase** (auth + storage)
- **Retro Diffusion API** (AI sprite + animation generation — the only image engine)
- **ElevenLabs API** (AI sound effect generation)

## Project structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Landing page
│   └── editor/                 # Editor routes
│       ├── layout.tsx          # Editor shell layout
│       ├── sprites/page.tsx    # Sprite creator
│       ├── assets/page.tsx     # Asset library
│       ├── sounds/page.tsx     # Sound manager
│       ├── builder/page.tsx    # Scene builder
│       └── publish/page.tsx    # Deploy to Vercel
├── components/                 # UI components (JSX only, no logic)
├── stores/                     # Zustand stores
├── services/                   # API / Supabase calls
├── lib/                        # Canvas utils, AI clients, Phaser bridge
├── constants/                  # UPPER_SNAKE_CASE constants
└── types/                      # TypeScript interfaces
```

## Design system

`DESIGN.md` at the repository root is the **source of truth for the visual
language** ("Synthetic Architect"): color tokens, typography, spacing, radius,
elevation and component conventions. Read it before writing any UI.

Never hardcode a hex, radius or spacing value into a component. If a token does
not exist in `DESIGN.md`, that is a design decision — escalate it to
design-agent, do not improvise.

Note: `DESIGN.md` frontmatter, `DESIGN.md` prose and `src/app/globals.css`
currently disagree on the palette and font stack. design-agent owns reconciling
them.

## Agents

Always delegate to the right agent for each task.

Pipeline for anything visual: **design-agent → frontend-agent → cleancode-agent**.

### 🎨 design-agent
Use for: anything that touches look and feel — new screens, panels, visual
restyling, theming, spacing, color, typography, motion.
Runs BEFORE any UI is written. Owns `DESIGN.md` tokens and `src/app/globals.css`.
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

## Core rules (summary)

- **Canvas: Use Infinite Canvas pattern.** The `<canvas>` must track its parent container size (100%) using `ResizeObserver`. All drawing logic must use centered offsets instead of CSS centering to allow stable zooming.
- **Component = JSX only.** All logic goes in `use*.hook.ts`
- **No inline styles.** Tailwind classes only (exception: dynamic canvas values)
- **No `any`.** All types defined in `src/types/`
- **No magic values.** Constants in `src/constants/` with UPPER_SNAKE_CASE
- **No hardcoded design values.** Colors, spacing, radius and typography come from
  `DESIGN.md` tokens — never an arbitrary hex or `p-[13px]`
- **Zustand selectors are always granular:** `state => state.field`
- **Store consumed only from hooks,** never from JSX directly
- **Navigation via `next/link` or `useRouter`,** never `window.location`
- **`'use client'` only when strictly needed** (useState, useEffect, browser APIs)
- **`next/image` for all images,** never `<img>`
- **No `console.log`** (only `console.error` in catch blocks)

IMPORTANT: 
-Always use the agents defined in the .claude/agents/ directory to create or modify any component, page or UI feature.
-Do not use build commait if the user does not explicitly ask for it.
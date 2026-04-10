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
- **Claude API / Gemini API** (AI sprite generation + code assist)

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

## Agents

Always delegate to the right agent for each task.

### 🎨 frontend-agent
Use for: creating or modifying any component, page or UI feature.
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

- **Component = JSX only.** All logic goes in `use*.hook.ts`
- **No inline styles.** Tailwind classes only (exception: dynamic canvas values)
- **No `any`.** All types defined in `src/types/`
- **No magic values.** Constants in `src/constants/` with UPPER_SNAKE_CASE
- **Zustand selectors are always granular:** `state => state.field`
- **Store consumed only from hooks,** never from JSX directly
- **Navigation via `next/link` or `useRouter`,** never `window.location`
- **`'use client'` only when strictly needed** (useState, useEffect, browser APIs)
- **`next/image` for all images,** never `<img>`
- **No `console.log`** (only `console.error` in catch blocks)

IMPORTANT: 
-Always use the agents defined in the .claude/agents/ directory to create or modify any component, page or UI feature.
-Do not use build commait if the user does not explicitly ask for it.
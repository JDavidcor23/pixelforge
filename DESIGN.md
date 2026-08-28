---
name: Synthetic Architect
source-of-truth: src/app/globals.css
canvas-mirror: src/constants/COLORS.ts
colors:
  base: '#0a0c10'
  surface: '#0f1115'
  raised: '#121419'
  hover: '#171a21'
  line: 'rgba(255,255,255,0.06)'
  line-strong: 'rgba(255,255,255,0.12)'
  ink: '#ededed'
  muted: '#a1a1aa'
  subtle: '#71717a'
  accent: '#00fbfb'
  accent-strong: '#00d4db'
  ai: '#7c3aed'
  success: '#10b981'
  danger: '#ff4d4d'
  canvas-grid-line: '#171a21'
  canvas-checker-a: '#1a1d24'
  canvas-checker-b: '#14171d'
typography:
  font-sans: Geist
  font-mono: Geist Mono
  display-xl:
    font: font-sans
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.03em
  display-lg:
    font: font-sans
    fontSize: 48px
    fontWeight: '900'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline:
    font: font-sans
    fontSize: 24px
    fontWeight: '900'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  body:
    font: font-sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.6'
  ui:
    font: font-sans
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
  label-caps:
    font: font-mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.15em
    transform: uppercase
  data:
    font: font-mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  lg: 0.5rem
  full: 9999px
spacing:
  panel-padding: 12px
  gutter: 16px
  margin-page: 24px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## How to use this document

`src/app/globals.css` is the **source of truth**. This file documents it; it does
not compete with it. If the two ever disagree, `globals.css` wins and this file
is the bug.

Three rules, and they are not negotiable:

1. **Never write a hex in a component.** Use the Tailwind utility that maps to a
   token: `bg-surface`, `text-muted`, `border-line`, `text-accent`.
2. **If the token you need does not exist, that is a design decision.** Add it to
   `globals.css` first, mirror it in `COLORS.ts` if the canvas needs it, then use
   it. Do not improvise a one-off value in a component.
3. **Canvas code is the only exception.** Konva and the 2D context cannot resolve
   CSS custom properties, so they import literals from `src/constants/COLORS.ts`.
   That file is a mirror, not a second palette.

## Brand & Style

PixelForge is a professional 2D game engine that lives in the browser. The
aesthetic, **Synthetic Architect**, is studio software first and cyberpunk
second: dense, precise, high-contrast — with a single electric accent that marks
where the machine is listening.

The emotional target is *control*. Not playfulness, not neon overload. The
interface should feel like a well-machined tool: quiet surfaces, sharp lines,
and light that appears only where something is active.

## Colors

The palette is a **four-step dark ladder** plus one accent. That is the whole
system. Its discipline is what makes the landing page and the editor read as one
product.

### Surfaces

| Token | Role |
| --- | --- |
| `base` | Page background, canvas backdrop, input field interiors |
| `surface` | Sidebars, panels, primary containers |
| `raised` | Navbars, panel headers, cards |
| `hover` | Hover and active rows, selected list items, active tool |

Every step is a **blue-tinted neutral**. This matters more than it sounds: the
editor previously used violet-tinted darks (`#1a1a2e`, `#252540`) which made it
look like a different product from the landing page. Violet in a surface is a
bug. Violet is an accent, and it means one specific thing — see below.

### Lines

Borders are **alpha over the surface**, never a solid hex, so a single token
reads correctly on all four rungs of the ladder. `line` for ordinary separation,
`line-strong` for a border that needs to hold its own against content.

Depth comes from tonal layering and 1px lines. **Not from soft shadows.** The
only shadows in this system are accent glows.

### Content

`ink` for primary text. `muted` for secondary text and inactive labels. `subtle`
for metadata, placeholders and disabled states. Three steps, no more — if you
find yourself wanting a fourth, you are probably solving a layout problem with
color.

### Accents

- **`accent`** — the engine. Primary actions, focus rings, the active tool, live
  values. On solid fills, pair with black text and the `.glow-accent` utility.
  Use it sparingly: an accent that appears everywhere marks nothing.
- **`ai`** — violet. **Reserved exclusively for AI-assisted surfaces**: the AI
  Copilot panel, generation controls, AI-produced frames in the timeline. When a
  user sees violet, it must mean "a model did this." Using it for ordinary UI
  destroys that signal, so do not use it as a general secondary color.
- **`success`** — deploy confirmation, healthy status, connected API keys.
- **`danger`** — destructive actions and hard failures. No glow: an error should
  stop the eye, not decorate it.

## Typography

**Geist** and **Geist Mono**, both loaded in `src/app/layout.tsx`. Do not add a
font. The previous `DESIGN.md` specified Inter and JetBrains Mono while
`globals.css` forced `Arial` on `body` — the product rendered in neither.

**Geist (sans)** carries the interface: controls, body copy, headlines. Display
headings use heavy weights with tight negative tracking, which reads as
"blocky" next to pixel art without sacrificing legibility.

**Geist Mono** is functional, not decorative. It marks **machine data**:
coordinate readouts, hex values, frame counts, module IDs, and the uppercase
`label-caps` used above input fields and panel sections. If a string is
something the engine computed, it is mono. If it is something a human wrote, it
is sans.

## Layout & Spacing

A **high-density functional grid**. Marketing pages breathe; the workspace does
not.

1. **The Workspace** — fixed-side/fluid-center. Left rail (layers, assets) and
   right rail (properties, AI) are fixed at 280px; the viewport takes the rest.
2. **The canvas grid** — a 16px pattern assists 2D alignment. Behind hero
   sections, the same pattern appears at 40px via `.bg-grid` + `.bg-grid-fade`.
3. **Density** — panel interiors use 8px and 12px. Utility beats whitespace in
   the workspace. Marketing sections use 24px page margins and generous stacks.
4. **Breakpoints** — on mobile the rails collapse into drawers and the viewport
   becomes a single column.

## Shapes

**Soft-technical.** The default radius is `0.25rem` — enough to avoid looking
dated, tight enough to stay structural.

- Buttons, inputs, cards, data chips: `rounded` (0.25rem).
- Panels and framed media: `rounded-sm` (0.125rem).
- Pills, avatars, status dots: `rounded-full`.
- **Corner brackets** are sharp (0px) by design. They evoke a viewfinder and
  their contrast with the soft-rounded UI is the point — do not round them.

## Components

### Buttons

- **Primary** — solid `accent`, black label, `.glow-accent`. Hover lifts to
  white. One primary per view.
- **Secondary** — transparent with a `line-strong` border and `accent` label.
  Hover fills to `accent/10`.
- **Icon action** — 32×32, `rounded`, `muted` icon that goes `accent` on hover
  and sits on `hover` when active.

### Input fields & selects

`base` interior, `line` border, `ink` text. Focus moves the border to `accent`
with a 2px accent ring. Labels sit above the field in `label-caps`.

### Cards & panels

`surface` body with a `line` border and **no shadow**. When a panel has a header
strip, the strip is `raised` so it separates tonally rather than with a rule.

### AI surfaces

Anything model-driven is marked with `ai`: the Copilot header icon, generation
buttons, AI-produced timeline frames. Reach for `.glow-ai` on the primary
generate action. Keep the rest of the panel on the normal surface ladder — the
violet is a *marker*, not a theme. A fully violet panel is the failure mode this
rule exists to prevent.

### Status indicators

- **Success** — `success` dot with a soft glow.
- **Error** — `danger`, no glow.
- **Beta / New** — `label-caps` in an `ai` pill.

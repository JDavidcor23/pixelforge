> AI-generated source notes. Study guide for the owner, not the owner's writing.
> The owner's article lives on his website.

# Study guide: moving the editor from Next.js to Vite

Goal: understand what was done so you can write your article in your own words.
Read from top to bottom. Each concept has a simple explanation and **one link**
to read. Estimated total time: about 2 hours.

---

## Part 1 — What was done (the full story, simply)

**Before.** PixelForge was **one single Next.js app**. That app had two very
different parts:

- **The landing page** (the product presentation): text, images, buttons.
  Google needs to find it, and it must load fast the first time.
- **The editor** (where you draw sprites and edit sounds): a canvas, tools,
  keyboard shortcuts. Everything happens in the user's browser. There is nothing
  inside it that Google needs to read.

**The problem.** Next.js is very good at doing work **on the server**: it
prepares the HTML before sending it, which helps Google (SEO) and makes the
first screen appear fast. The landing page benefits from that. **The editor
does not**: the canvas only works in the browser, so all that server work was
useless for it, but it still had to live with Next's rules (server and client
components, `'use client'`, etc.).

**The decision.** Split the project into a **monorepo** with pnpm:

```text
apps/landing     → stays on Next.js 16 (Next shines here: SEO, first load)
apps/editor      → moves to Vite + React (an SPA: everything in the browser)
packages/tokens  → colors and styles shared by both apps
packages/core    → the pixel engine (Rust → WebAssembly), in its own package
```

**Important for your article:** you did not leave Next. **You used it where it
makes sense** and moved out only the part that did not need it.

**How it deploys.** There are two Vercel projects, one per app. Each one only
redeploys when its own code changed (Vercel "Ignored Build Step").

**What was gained**
- The editor no longer carries server rules it does not use.
- Each app deploys separately.
- The Rust engine lives in its own package, with its own build and tests.

**What was lost (say it in the article — it builds credibility)**
- The editor no longer has `next/image` or `next/font` (automatic image and
  font optimization). It now uses a plain `<img>` and loads the font with a
  `<link>` tag.
- The editor's navigation had to be rewritten with `react-router-dom`.
- There are now **two stacks with different rules** (for example, environment
  variables are called `NEXT_PUBLIC_*` in one and `VITE_*` in the other).

**The AI keys (ElevenLabs, Retro Diffusion).** Calls to the AI go through
**Vercel Functions** (small server functions) so the server's key never reaches
the browser.

**What was measured**
- The Vite editor starts in development in **337–663 ms** (target: under 2 s).
  Source: `openspec/changes/migrate-to-rust-core/baseline-bench.md`, Phase 3.

**What was NOT measured (do not claim it)**
- That the page loads faster in production.
- The final bundle size.

---

## Part 2 — Concepts you need to understand (in this order)

### 1. SSR vs CSR (where the page is built)
- **SSR (Server-Side Rendering):** the server builds the HTML and sends it
  ready. Good for SEO and for a fast first screen.
- **CSR (Client-Side Rendering):** the browser receives JavaScript and builds
  the page itself. Good for very interactive apps.
- **Read:** "Rendering on the Web" — https://web.dev/articles/rendering-on-the-web
  (the key article on this topic; read up to "Static rendering").

### 2. SPA (Single Page Application)
- An app that loads once and then changes screens without reloading. Your
  editor is an SPA.
- **Read:** https://developer.mozilla.org/en-US/docs/Glossary/SPA (2 minutes).

### 3. React Server Components and `'use client'`
- In modern Next, components run **on the server by default**. If they need the
  browser (canvas, events, `useState`), they need `'use client'`. An editor that
  is all canvas ends up with `'use client'` everywhere: a sign it did not need
  the server.
- **Read:** https://nextjs.org/docs/app/getting-started/server-and-client-components

### 4. What Vite is
- A tool that serves and bundles frontend apps. It starts very fast in
  development and has no server rendering built in: a good fit for an SPA.
- **Read:** on vite.dev, the "Guide → Why Vite" section.

### 5. Monorepo with pnpm workspaces
- One repository with several projects that share code (your design tokens) but
  are built and deployed separately.
- **Read:** https://pnpm.io/workspaces

### 6. Monorepos on Vercel
- Each app is a Vercel project with its own "Root Directory". The "Ignored
  Build Step" skips a redeploy when that app did not change.
- **Read:** https://vercel.com/docs/monorepos

### 7. Vercel Functions (why keys don't go in the browser)
- Anything that starts with `VITE_` or `NEXT_PUBLIC_` ends up **inside the
  browser's JavaScript**: anyone can see it. Secret keys go in a server function
  that acts as a middleman.
- **Read:** https://vercel.com/docs/functions

---

## Part 3 — Questions to answer before writing

Answering them in your own words is what makes the article yours:

1. What made you think about migrating? (the hype, what you saw on LinkedIn)
2. Which part of your app did **not** use what Next offers? How did you notice?
3. Why did the landing page stay on Next?
4. What did you lose, and what did it cost you?
5. If a friend asks "so is Next bad?", what do you answer?
6. What did you learn that you didn't know before starting?

---

## Part 4 — Sources inside the repo (to go deeper)

| Topic | File |
|---|---|
| Monorepo decision and the editor on Vite | `docs/adr/0005-monorepo-split.md` |
| Measurements | `openspec/changes/migrate-to-rust-core/baseline-bench.md` |
| Rules for each app | `AGENTS.md` ("Stack" section) |

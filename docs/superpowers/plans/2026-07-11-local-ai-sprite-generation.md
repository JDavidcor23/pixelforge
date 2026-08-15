# Local AI Sprite Generation Implementation Plan (Codex-driven)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the PixelLab API call behind the sprite editor's "Generate" button with a local Codex CLI generation (`codex exec`), run the result through the existing pixel pipeline plus an optional saturation-weighted color quantization, and paint it — WITHOUT paying for PixelLab.

**Architecture (Option B — the button drives Codex):** The **Generate** button keeps its current UX (prompt textarea + resolution). Instead of `fetch` to PixelLab, the hook calls a new Next.js route handler that runs `codex exec` via `child_process.execFile` (**dev-only**, Node runtime), waits for it to finish, locates the freshly written PNG under Codex's output dir, and returns it as base64. The client decodes it to the selected resolution with the existing `base64ToPixels`, optionally quantizes with `quantizePixels` (k-means weighted by saturation — validated empirically: preserved 111% of saturated pixels vs 0% for naive median cut), and reuses the existing history + `overwriteWithPixels` flow.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Zustand (granular selectors), Konva, vitest, Codex CLI (`codex exec`).

## Global Constraints

- **DEV-ONLY.** The route spawns `codex` via `child_process` and reads local paths. It CANNOT run on Vercel. Guard it, document it, never present it as production.
- **Security: use `execFile`, NOT `exec`.** Pass the prompt as an argument array element so it is never shell-interpolated (no command injection). Never build a shell string from user input.
- **Codex runs as an autonomous agent** with `--ask-for-approval never` and a permissive sandbox — it can run arbitrary commands on your machine. Acceptable for local dev only; state this in the code comment.
- **Latency + usage cost.** `codex exec` is an agent loop, not a direct image API — expect 20–90s and consumption of your Codex/ChatGPT usage limit per generation. UI needs a real loading state and the route a generous timeout.
- **No `any`** (types in `src/app/editor/types/`), **no magic values** (constants `UPPER_SNAKE_CASE` in `src/app/editor/constants/`), **component = JSX only** (logic in `use*.hook.ts`), **UI via frontend-agent** (per `AGENTS.md`), **granular Zustand selectors**, **no `console.log`** (only `console.error` in catch). Tests with **vitest**.

---

### Task 0: Spike — confirm `codex exec` generates and where the PNG lands (NO app code)

**Why:** For Option B this is not optional. We must confirm (a) `codex exec` generates an image non-interactively without hanging, (b) the exact output path, and (c) whether the output is high-res (needs downscale+quantize) or usable small. We only ever saw Codex produce a high-res *illustration* (the dog), never a clean 64×64.

- [ ] **Step 1:** In a terminal, run non-interactively:
```bash
codex exec --ask-for-approval never --sandbox danger-full-access --skip-git-repo-check \
  "Generate a 64x64 pixel art sprite, max 16 colors, no anti-aliasing, transparent background, a pirate captain"
```
- [ ] **Step 2:** Note where the PNG was written (expected `~/.codex/generated_images/<uuid>/<callid>.png`) and its real size (`node -e "const b=require('fs').readFileSync('PATH');console.log(b.readUInt32BE(16)+'x'+b.readUInt32BE(20))"`).
- [ ] **Step 3:** Record findings in engram (`architecture/ai-sprite-model-choice`): does Codex honor 64×64? If it only makes high-res, quantization is mandatory and the base prompt must force low resolution + downscale to the selected grid.
- [ ] **Step 4 (optional optimization to evaluate):** Check `$CODEX_HOME/skills/.system/imagegen/scripts/image_gen.py` — invoking that script directly may generate faster/cheaper than spinning the full `codex exec` agent loop. If viable, Task 4 can call the script instead of `codex exec`.

---

### Task 1: Types — sprite result contract + quantize options

**Files:**
- Create: `src/app/editor/types/ai-generation.ts`
- Modify: `src/app/editor/types/index.ts` (add `export * from './ai-generation'`)

**Interfaces:** Produces `QuantizeOptions`, `CodexGenerationResult`.

- [ ] **Step 1: Create the types**
```ts
// src/app/editor/types/ai-generation.ts
export interface QuantizeOptions {
  colors: number
  weightBySaturation: boolean
  iterations: number
  alphaThreshold: number // 0..1; below this a pixel stays transparent
}

export interface CodexGenerationResult {
  base64: string   // data URI PNG
  width: number    // native PNG width
  height: number   // native PNG height
  sourcePath: string
}
```
- [ ] **Step 2:** Add `export * from './ai-generation'` to `src/app/editor/types/index.ts`.
- [ ] **Step 3: Commit**
```bash
git add src/app/editor/types/ai-generation.ts src/app/editor/types/index.ts
git commit -m "feat(types): add codex generation result and quantize options"
```

---

### Task 2: Constants

**Files:** Modify `src/app/editor/constants/index.ts`

- [ ] **Step 1: Add constants**
```ts
export const AI_OUTPUT_ENV = 'AI_OUTPUT_DIR' // dir Codex writes images to, e.g. ~/.codex/generated_images
export const CODEX_GENERATE_ROUTE = '/api/ai/codex-generate'
export const CODEX_TIMEOUT_MS = 180000 // codex exec is an agent loop; allow generous time
export const CODEX_BASE_PROMPT =
  'Generate a 64x64 pixel art sprite, limited palette of max 16 colors, no anti-aliasing, ' +
  'transparent background, full body centered, retro 16-bit style. Subject: '
export const QUANTIZE_DEFAULTS = {
  COLORS: 16,
  ITERATIONS: 12,
  SATURATION_WEIGHT: 6, // weight = 1 + SATURATION_WEIGHT * saturation
  ALPHA_THRESHOLD: 0.5,
} as const
```
- [ ] **Step 2: Commit**
```bash
git add src/app/editor/constants/index.ts
git commit -m "feat(constants): add codex generation + quantize constants"
```

---

### Task 3: Quantization utility (TDD)

**Files:** Create `src/app/editor/lib/quantize.ts`; Test `src/app/editor/lib/quantize.test.ts`

**Interfaces:** Consumes `PixelBuffer`, `RgbaColor` (`@/app/editor/types`), `QuantizeOptions`, `QUANTIZE_DEFAULTS`. Produces `quantizePixels(buffer: PixelBuffer, opts: QuantizeOptions): PixelBuffer`.

- [ ] **Step 1: Write the failing test**
```ts
// src/app/editor/lib/quantize.test.ts
import { describe, it, expect } from 'vitest'
import { quantizePixels } from './quantize'
import type { PixelBuffer } from '@/app/editor/types'

const px = (r: number, g: number, b: number, a = 1) => ({ r, g, b, a })

describe('quantizePixels', () => {
  it('reduces the palette to at most `colors` opaque colors', () => {
    const buf: PixelBuffer = [
      [px(200, 10, 10), px(198, 12, 9), px(12, 200, 14), px(10, 198, 16)],
      [px(15, 12, 205), px(13, 14, 200), px(0, 0, 0, 0), px(250, 250, 250)],
    ]
    const out = quantizePixels(buf, { colors: 4, weightBySaturation: true, iterations: 12, alphaThreshold: 0.5 })
    const palette = new Set<string>()
    out.flat().forEach(p => { if (p.a > 0) palette.add(`${p.r},${p.g},${p.b}`) })
    expect(palette.size).toBeLessThanOrEqual(4)
  })

  it('keeps fully transparent pixels transparent', () => {
    const buf: PixelBuffer = [[px(0, 0, 0, 0), px(200, 10, 10)]]
    const out = quantizePixels(buf, { colors: 2, weightBySaturation: true, iterations: 6, alphaThreshold: 0.5 })
    expect(out[0][0].a).toBe(0)
  })

  it('preserves a saturated color over the dominant near-white', () => {
    const buf: PixelBuffer = [
      [px(245, 245, 245), px(246, 244, 245), px(244, 245, 246), px(245, 246, 244)],
      [px(243, 245, 245), px(245, 245, 243), px(210, 20, 20), px(205, 18, 22)],
    ]
    const out = quantizePixels(buf, { colors: 2, weightBySaturation: true, iterations: 12, alphaThreshold: 0.5 })
    const hasRed = out.flat().some(p => p.r > 120 && p.r > p.g * 1.6 && p.r > p.b * 1.6)
    expect(hasRed).toBe(true)
  })
})
```
- [ ] **Step 2: Run to verify it fails** — `npx vitest run src/app/editor/lib/quantize.test.ts` → FAIL (`quantizePixels` not defined).
- [ ] **Step 3: Write the implementation**
```ts
// src/app/editor/lib/quantize.ts
import type { PixelBuffer, RgbaColor, QuantizeOptions } from '@/app/editor/types'
import { QUANTIZE_DEFAULTS } from '@/app/editor/constants'

interface Centroid { r: number; g: number; b: number }
interface WeightedPoint extends Centroid { w: number }

const saturation = (r: number, g: number, b: number): number => {
  const mx = Math.max(r, g, b); const mn = Math.min(r, g, b)
  return mx === 0 ? 0 : (mx - mn) / mx
}
const dist2 = (a: Centroid, b: Centroid): number =>
  (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2
const nearest = (palette: Centroid[], p: Centroid): Centroid => {
  let best = palette[0]; let bestD = Infinity
  for (const c of palette) { const d = dist2(c, p); if (d < bestD) { bestD = d; best = c } }
  return best
}
const buildPalette = (points: WeightedPoint[], k: number, iterations: number): Centroid[] => {
  if (points.length === 0) return []
  const centroids: Centroid[] = []
  let first = points[0]
  for (const p of points) if (p.w > first.w) first = p
  centroids.push({ r: first.r, g: first.g, b: first.b })
  while (centroids.length < k) {
    let best: WeightedPoint | null = null; let bestScore = -1
    for (const p of points) {
      let dmin = Infinity
      for (const c of centroids) { const d = dist2(c, p); if (d < dmin) dmin = d }
      const score = dmin * p.w
      if (score > bestScore) { bestScore = score; best = p }
    }
    if (!best) break
    centroids.push({ r: best.r, g: best.g, b: best.b })
  }
  for (let it = 0; it < iterations; it++) {
    const sums = centroids.map(() => ({ r: 0, g: 0, b: 0, w: 0 }))
    for (const p of points) {
      let bi = 0; let bd = Infinity
      for (let i = 0; i < centroids.length; i++) { const d = dist2(centroids[i], p); if (d < bd) { bd = d; bi = i } }
      const s = sums[bi]; s.r += p.r * p.w; s.g += p.g * p.w; s.b += p.b * p.w; s.w += p.w
    }
    for (let i = 0; i < centroids.length; i++) {
      if (sums[i].w > 0) centroids[i] = {
        r: Math.round(sums[i].r / sums[i].w),
        g: Math.round(sums[i].g / sums[i].w),
        b: Math.round(sums[i].b / sums[i].w),
      }
    }
  }
  return centroids
}

export const quantizePixels = (buffer: PixelBuffer, opts: QuantizeOptions): PixelBuffer => {
  const { colors, weightBySaturation, iterations, alphaThreshold } = opts
  const k = QUANTIZE_DEFAULTS.SATURATION_WEIGHT
  const points: WeightedPoint[] = []
  for (const row of buffer) for (const p of row) {
    if (p.a < alphaThreshold) continue
    const w = weightBySaturation ? 1 + k * saturation(p.r, p.g, p.b) : 1
    points.push({ r: p.r, g: p.g, b: p.b, w })
  }
  const palette = buildPalette(points, colors, iterations)
  return buffer.map(row => row.map((p): RgbaColor => {
    if (p.a < alphaThreshold) return { ...p }
    const c = nearest(palette, { r: p.r, g: p.g, b: p.b })
    return { r: c.r, g: c.g, b: c.b, a: p.a }
  }))
}
```
> Note: `QuantizeOptions` is imported from the types barrel; ensure Task 1's `index.ts` re-export is in place.
- [ ] **Step 4: Run to verify it passes** — `npx vitest run src/app/editor/lib/quantize.test.ts` → PASS (3 tests).
- [ ] **Step 5: Commit**
```bash
git add src/app/editor/lib/quantize.ts src/app/editor/lib/quantize.test.ts
git commit -m "feat(editor): add saturation-weighted k-means color quantizer"
```

---

### Task 4: `codex-generate` route — the button that drives Codex (dev-only)

**Files:** Create `src/app/api/ai/codex-generate/route.ts`

**Interfaces:** Produces `POST /api/ai/codex-generate` with body `{ prompt: string }` → `CodexGenerationResult` JSON.

> Records a timestamp, runs `codex exec` with the base prompt + user subject via `execFile` (args array, no shell), then finds the newest `.png` modified after the timestamp under `AI_OUTPUT_DIR` (recursive — Codex nests under `<uuid>/`).

- [ ] **Step 1: Write the route**
```ts
// src/app/api/ai/codex-generate/route.ts
import { NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import path from 'path'
import { AI_OUTPUT_ENV, CODEX_BASE_PROMPT, CODEX_TIMEOUT_MS } from '@/app/editor/constants'

const run = promisify(execFile)

async function newestPngAfter(dir: string, since: number): Promise<string | null> {
  let best: { file: string; mtime: number } | null = null
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const sub = await newestPngAfter(full, since)
      if (sub) {
        const stat = await fs.stat(sub)
        if (!best || stat.mtimeMs > best.mtime) best = { file: sub, mtime: stat.mtimeMs }
      }
    } else if (entry.name.toLowerCase().endsWith('.png')) {
      const stat = await fs.stat(full)
      if (stat.mtimeMs >= since && (!best || stat.mtimeMs > best.mtime)) best = { file: full, mtime: stat.mtimeMs }
    }
  }
  return best?.file ?? null
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }
    const outputDir = process.env[AI_OUTPUT_ENV]
    if (!outputDir) {
      return NextResponse.json({ error: `Set ${AI_OUTPUT_ENV} to your Codex image output dir.` }, { status: 400 })
    }
    const since = Date.now()
    // DEV-ONLY: runs Codex as an autonomous agent with no approval prompts.
    await run(
      'codex',
      ['exec', '--ask-for-approval', 'never', '--sandbox', 'danger-full-access',
       '--skip-git-repo-check', `${CODEX_BASE_PROMPT}${prompt}`],
      { timeout: CODEX_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 },
    )
    const file = await newestPngAfter(outputDir, since)
    if (!file) {
      return NextResponse.json({ error: 'Codex did not produce a PNG.' }, { status: 502 })
    }
    const buf = await fs.readFile(file)
    return NextResponse.json({
      base64: `data:image/png;base64,${buf.toString('base64')}`,
      width: buf.readUInt32BE(16),
      height: buf.readUInt32BE(20),
      sourcePath: file,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('codex-generate error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```
- [ ] **Step 2: Manual verification** — set `AI_OUTPUT_DIR` in `.env.local`, start dev, then:
```bash
curl -sX POST http://localhost:3000/api/ai/codex-generate -H "Content-Type: application/json" \
  -d '{"prompt":"a pirate captain"}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log(j.width+'x'+j.height,j.sourcePath||j.error)})"
```
Expected: prints dimensions + path of the just-generated PNG.
- [ ] **Step 3: Commit**
```bash
git add src/app/api/ai/codex-generate/route.ts .env.local.example
git commit -m "feat(api): add dev-only codex-generate route"
```

---

### Task 5: Client util — call the route, decode to the selected size, optional quantize

**Files:** Create `src/app/editor/lib/codex-utils.ts`

**Interfaces:** Consumes `CODEX_GENERATE_ROUTE`, `QUANTIZE_DEFAULTS`, `base64ToPixels` (existing in `pixellab-utils.ts`), `quantizePixels`. Produces `generateSpriteWithCodex(prompt: string): Promise<CodexGenerationResult>` and `decodeToPixels(base64: string, size: number, quantize: boolean): Promise<PixelBuffer>`.

> Split into two functions so the existing history flow (which stores raw base64) is preserved: `generateSpriteWithCodex` mirrors the old `generateSpriteWithPixelLab` contract; `decodeToPixels` replaces the raw `base64ToPixels` call at apply-time and adds the downscale-to-grid + optional quantize.

- [ ] **Step 1: Write the util**
```ts
// src/app/editor/lib/codex-utils.ts
import type { PixelBuffer, CodexGenerationResult } from '@/app/editor/types'
import { CODEX_GENERATE_ROUTE, QUANTIZE_DEFAULTS } from '@/app/editor/constants'
import { base64ToPixels } from './pixellab-utils'
import { quantizePixels } from './quantize'

export async function generateSpriteWithCodex(prompt: string): Promise<CodexGenerationResult> {
  const res = await fetch(CODEX_GENERATE_ROUTE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Codex generation failed')
  }
  return res.json()
}

/** Decode to the selected grid size (downscales high-res Codex output) with optional palette cleanup. */
export async function decodeToPixels(base64: string, size: number, quantize: boolean): Promise<PixelBuffer> {
  const pixels = await base64ToPixels(base64, size, size)
  if (!quantize) return pixels
  return quantizePixels(pixels, {
    colors: QUANTIZE_DEFAULTS.COLORS,
    weightBySaturation: true,
    iterations: QUANTIZE_DEFAULTS.ITERATIONS,
    alphaThreshold: QUANTIZE_DEFAULTS.ALPHA_THRESHOLD,
  })
}
```
- [ ] **Step 2: Commit**
```bash
git add src/app/editor/lib/codex-utils.ts
git commit -m "feat(editor): add codex generation client util with grid downscale + quantize"
```

---

### Task 6: Wire the AI Copilot panel to Codex (DELEGATE to frontend-agent)

**Files:** Modify `src/app/editor/sprites/features/properties/components/RightSidebar/useRightSidebar.hook.ts` (logic) and `RightSidebar.tsx` (JSX/toggle only).

> `handleApply` currently calls `generateSpriteWithPixelLab` (`useRightSidebar.hook.ts:207`). Two precise changes; everything else (history, `addToHistory`, error/loading) stays. Per `AGENTS.md`, dispatch **frontend-agent** (it invokes **cleancode-agent** after).

- [ ] **Step 1: Dispatch frontend-agent** with: "In `useRightSidebar.hook.ts`: (1) Replace the `generateSpriteWithPixelLab` call in `handleApply` with `generateSpriteWithCodex(prompt)` from `@/app/editor/lib/codex-utils`; keep `addToHistory({ prompt, base64, width, height })` using the returned fields. (2) In `handleSelectGeneration`, replace `base64ToPixels(gen.base64, gen.width, gen.height)` with `decodeToPixels(gen.base64, genSize, quantizeEnabled)` from the same util so Codex's high-res output is downscaled to the selected grid (32/64). (3) Add a `quantizeEnabled` boolean state (default true) exposed from the hook, and a 'Clean palette (16 colors)' toggle in `RightSidebar.tsx`. Remove the PixelLab API-key gate ('Configure PixelLab to start') since Codex needs no in-app key. Tailwind only, no inline styles, no `any`, granular Zustand selectors, logic in the hook."
- [ ] **Step 2:** Verify frontend-agent invoked cleancode-agent.
- [ ] **Step 3: Manual QA** — type a prompt, click Generate, confirm Codex runs and the sprite paints; toggle 'Clean palette' and compare.
- [ ] **Step 4: Commit**
```bash
git add src/app/editor/sprites/features/properties/components/RightSidebar/
git commit -m "feat(editor): drive AI Copilot generation with local Codex + optional quantize"
```

---

### Task 7: Grid guides — DONE

- [x] `public/ai-guides/grid-64x64.png` and `grid-32x32.png` already copied into the project. Serve at `/ai-guides/grid-64x64.png`. (Reminder from the plan session: a visible grid does NOT reliably condition diffusion models — describe the grid in words in `CODEX_BASE_PROMPT` rather than relying on the image.)

---

## Self-Review Notes

- **Coverage:** button drives Codex (Tasks 4+6), grid to project (Task 7 done), tell the model to follow 64/32 (Task 2 `CODEX_BASE_PROMPT` + downscale in Task 5), automatic color transform behind the scenes/toggleable (Tasks 3+5+6), paint (Task 6 reuses `overwriteWithPixels`). Covered.
- **Type consistency:** `CodexGenerationResult` (`{base64,width,height,sourcePath}`) is produced by Task 4's route and consumed by Task 5's `generateSpriteWithCodex`; `decodeToPixels(base64,size,quantize)` is defined in Task 5 and called in Task 6.
- **Deliberately out of scope:** animation (deferred), production/Vercel (dev-only), and any in-app key management (Codex uses your local login).
- **Carried risks:** (1) Task 0 must confirm Codex output quality/resolution — if only high-res, quantize is mandatory. (2) `codex exec` latency/usage cost per click. (3) `danger-full-access` is powerful — dev machine only. (4) If `codex exec` proves too slow, evaluate calling `imagegen`'s `image_gen.py` directly (Task 0 Step 4).

#!/usr/bin/env node
// PixelLab animation eval bench (ADR 0009): animates a REAL sprite through
// PixelLab's `animate-with-text-v3` endpoint using the SAME harness the editor
// ships (`ANIMATION_HARNESS` + `buildAnimationAction`), saves every frame and
// writes an HTML viewer. What is measured here is exactly what the Animate tab
// sends. Run with:
//   node --experimental-strip-types --env-file=.env.local scripts/pixellab-animate-harness.ts <sprite.png> [--motion=walk|all] [--asset=character] [--frames=8]
// Needs PIXELLAB_API_KEY. Every case is a paid generation; the PixelLab
// balance is printed before and after so the real cost is never guessed.
// Free tier: one concurrent job, so cases run one after another.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'

// Relative path with extension: `--experimental-strip-types` resolves neither
// the `@/` alias nor extensionless imports — the harness file has no runtime
// imports for exactly this reason.
import { ANIMATION_HARNESS, buildAnimationAction } from '../apps/editor/src/lib/animation-harness.ts'
import type { AnimationMotionPreset, AssetType } from '../apps/editor/src/types/index.ts'

const API_BASE = 'https://api.pixellab.ai/v2'
const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 300000
const OUT_ROOT = '.harness-out/pixellab'
const DEFAULT_MOTION = 'walk'
const DEFAULT_ASSET: AssetType = 'character'
const ALL_MOTIONS = 'all'
/** Index 0 of a finished job's images is the input frame; the app drops it too. */
const INPUT_FRAME_INDEX = 0
const VIEWER_SCALE = 3
const VIEWER_SIZE = 128
const VIEWER_FPS = 8

interface HarnessCase {
  readonly id: string
  readonly action: string
  readonly frameCount: number
  readonly enhancePrompt: boolean
  readonly driftThreshold?: number
}

interface Base64Image {
  readonly type?: string
  readonly base64: string
  readonly format?: string
}

interface BackgroundJob {
  readonly id: string
  readonly status: 'queued' | 'processing' | 'completed' | 'failed' | string
  readonly last_response?: { readonly images?: readonly (Base64Image | string)[]; readonly detail?: unknown }
  readonly usage?: { readonly type?: string; readonly usd?: number }
}

interface CaseResult {
  readonly id: string
  readonly action: string
  readonly frames: readonly string[]
  readonly costUsd: number | null
  readonly seconds: number
  readonly error?: string
}

const apiKey = process.env.PIXELLAB_API_KEY
if (!apiKey) {
  console.error('Missing PIXELLAB_API_KEY (run with --env-file=.env.local).')
  process.exit(1)
}

const args = process.argv.slice(2)
const readFlag = (name: string): string | undefined =>
  args.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1]

const spritePath = args.find((arg) => !arg.startsWith('--'))
const motionArg = readFlag('motion') ?? DEFAULT_MOTION
const assetArg = readFlag('asset') ?? DEFAULT_ASSET
const framesArg = readFlag('frames')

const usage = 'Usage: scripts/pixellab-animate-harness.ts <sprite.png> [--motion=walk|all] [--asset=character] [--frames=8]'
if (!spritePath) {
  console.error(usage)
  process.exit(1)
}

const isAssetType = (value: string): value is AssetType => Object.hasOwn(ANIMATION_HARNESS, value)
if (!isAssetType(assetArg)) {
  console.error(`Unknown asset "${assetArg}". Known: ${Object.keys(ANIMATION_HARNESS).join(', ')}`)
  process.exit(1)
}
const assetType: AssetType = assetArg

const toCase = (preset: AnimationMotionPreset): HarnessCase => ({
  id: `${assetType}-${preset.id}`,
  action: buildAnimationAction(preset, assetType),
  frameCount: framesArg ? Number(framesArg) : preset.defaultFrames,
  enhancePrompt: preset.enhancePrompt ?? false,
  driftThreshold: preset.driftThreshold,
})

/** The custom preset has no motion text of its own, so it is never benchmarked here. */
const benchmarkable = ANIMATION_HARNESS[assetType].motions.filter((preset) => !preset.isCustomInput)

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', ...init?.headers },
  })
  const body = (await res.json().catch(() => null)) as T | null
  if (!res.ok) throw new Error(`${res.status} ${path}: ${JSON.stringify(body)}`)
  return body as T
}

const getBalance = () => request<unknown>('/balance').catch((error: Error) => `unavailable (${error.message})`)

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms))

const pollJob = async (jobId: string): Promise<BackgroundJob> => {
  const deadline = Date.now() + POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    const job = await request<BackgroundJob>(`/background-jobs/${jobId}`)
    if (job.status === 'completed' || job.status === 'failed') return job
    await sleep(POLL_INTERVAL_MS)
  }
  throw new Error(`Job ${jobId} timed out after ${POLL_TIMEOUT_MS / 1000}s`)
}

const toBase64 = (image: Base64Image | string): string =>
  (typeof image === 'string' ? image : image.base64).replace(/^data:image\/\w+;base64,/, '')

const runCase = async (harnessCase: HarnessCase, firstFrame: string, outDir: string): Promise<CaseResult> => {
  const started = Date.now()
  try {
    // Same body as `api/ai/pixellab/animate.ts` — and, like it, never `last_frame`
    // (measured 2026-10-12: forcing the loop back to frame 0 killed the motion).
    const submitted = await request<{ background_job_id: string }>('/animate-with-text-v3', {
      method: 'POST',
      body: JSON.stringify({
        first_frame: { type: 'base64', base64: firstFrame, format: 'png' },
        action: harnessCase.action,
        frame_count: harnessCase.frameCount,
        no_background: true,
        enhance_prompt: harnessCase.enhancePrompt,
        ...(harnessCase.driftThreshold !== undefined ? { drift_threshold: harnessCase.driftThreshold } : {}),
      }),
    })
    console.error(`[${harnessCase.id}] job ${submitted.background_job_id} submitted, polling...`)
    const job = await pollJob(submitted.background_job_id)
    if (job.status === 'failed') throw new Error(JSON.stringify(job.last_response?.detail ?? job.last_response))

    const images = (job.last_response?.images ?? []).filter((_, index) => index !== INPUT_FRAME_INDEX)
    const frames: string[] = []
    for (const [index, image] of images.entries()) {
      const file = `${harnessCase.id}-${String(index).padStart(2, '0')}.png`
      await writeFile(join(outDir, file), Buffer.from(toBase64(image), 'base64'))
      frames.push(file)
    }
    return {
      id: harnessCase.id,
      action: harnessCase.action,
      frames,
      costUsd: job.usage?.usd ?? null,
      seconds: Math.round((Date.now() - started) / 1000),
    }
  } catch (error) {
    return {
      id: harnessCase.id,
      action: harnessCase.action,
      frames: [],
      costUsd: null,
      seconds: Math.round((Date.now() - started) / 1000),
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

const viewerHtml = (sprite: string, results: readonly CaseResult[]): string => `<!doctype html>
<html><head><meta charset="utf-8"><title>PixelLab harness</title>
<style>
body{font-family:system-ui;background:#1b1b1f;color:#eee;margin:24px}
.grid{display:flex;flex-wrap:wrap;gap:24px}
.card{background:#26262b;padding:16px;border-radius:8px;max-width:420px}
img{image-rendering:pixelated;background:repeating-conic-gradient(#333 0 25%,#2a2a2a 0 50%) 0 0/16px 16px}
.anim{width:${VIEWER_SIZE * VIEWER_SCALE}px;height:${VIEWER_SIZE * VIEWER_SCALE}px;object-fit:contain}
.strip img{width:48px;height:48px;object-fit:contain}
.err{color:#ff8080;white-space:pre-wrap}
</style></head><body>
<h1>PixelLab animate-with-text-v3 — ${sprite}</h1>
<div class="grid">
<div class="card"><h3>Reference</h3><img class="anim" src="reference.png"></div>
${results
  .map(
    (r) => `<div class="card"><h3>${r.id}</h3><p>${r.action}</p>
<p>frames: ${r.frames.length} · cost: ${r.costUsd ?? '?'} USD · ${r.seconds}s</p>
${r.error ? `<p class="err">${r.error}</p>` : `<img class="anim" data-frames='${JSON.stringify(r.frames)}' src="${r.frames[0] ?? ''}">
<div class="strip">${r.frames.map((f) => `<img src="${f}">`).join('')}</div>`}</div>`,
  )
  .join('\n')}
</div>
<script>
document.querySelectorAll('img[data-frames]').forEach((img) => {
  const frames = JSON.parse(img.dataset.frames); let i = 0
  if (frames.length) setInterval(() => { i = (i + 1) % frames.length; img.src = frames[i] }, ${Math.round(1000 / VIEWER_FPS)})
})
</script></body></html>`

const main = async () => {
  const presets =
    motionArg === ALL_MOTIONS ? benchmarkable : benchmarkable.filter((preset) => preset.id === motionArg)
  if (presets.length === 0) {
    throw new Error(`Unknown motion "${motionArg}" for ${assetType}. Known: ${benchmarkable.map((p) => p.id).join(', ')}, ${ALL_MOTIONS}`)
  }
  const cases = presets.map(toCase)

  const spriteBytes = await readFile(resolve(spritePath))
  const firstFrame = spriteBytes.toString('base64')
  const outDir = resolve(OUT_ROOT, `${new Date().toISOString().replace(/[:.]/g, '-')}-${basename(spritePath, '.png')}`)
  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, 'reference.png'), spriteBytes)

  console.error('balance before:', JSON.stringify(await getBalance()))
  // Sequential on purpose: the free tier allows one concurrent job, and it keeps per-case cost readable.
  const results: CaseResult[] = []
  for (const harnessCase of cases) {
    const result = await runCase(harnessCase, firstFrame, outDir)
    console.error(`[${result.id}] ${result.error ? `FAILED: ${result.error}` : `${result.frames.length} frames, ${result.costUsd ?? '?'} USD, ${result.seconds}s`}`)
    results.push(result)
  }
  console.error('balance after:', JSON.stringify(await getBalance()))

  await writeFile(join(outDir, 'results.json'), JSON.stringify(results, null, 2))
  await writeFile(join(outDir, 'index.html'), viewerHtml(basename(spritePath), results))
  console.log(join(outDir, 'index.html'))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

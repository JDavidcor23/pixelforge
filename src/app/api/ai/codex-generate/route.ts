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
    // DEV-ONLY: runs Codex as an autonomous agent (exec mode is non-interactive)
    // with a permissive sandbox on the local machine. Never deploy this route.
    await run(
      'codex',
      ['exec', '--sandbox', 'danger-full-access', '--skip-git-repo-check',
       `${CODEX_BASE_PROMPT}${prompt}`],
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

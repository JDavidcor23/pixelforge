import { NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { AI_OUTPUT_ENV, CODEX_BASE_PROMPT, CODEX_IMAGE_MODEL, CODEX_MAX_BUFFER_BYTES, CODEX_NO_PNG_ERROR, CODEX_TIMEOUT_MS } from '@/app/editor/constants'
import type { CodexGenerateRequestBody } from '@/app/editor/types'

const run = promisify(execFile)

/** Decode a data-URI (or bare base64) PNG to a temp file Codex can attach via -i. */
async function writeReferenceImage(referenceBase64: string, since: number): Promise<string> {
  const comma = referenceBase64.indexOf(',')
  const raw = referenceBase64.startsWith('data:') && comma !== -1
    ? referenceBase64.slice(comma + 1)
    : referenceBase64
  const file = path.join(os.tmpdir(), `codex-ref-${since}.png`)
  await fs.writeFile(file, Buffer.from(raw, 'base64'))
  return file
}

/**
 * On Windows the global `codex` is an npm .cmd shim, which execFile cannot
 * spawn without a shell (and a shell would expose the prompt to injection).
 * Resolve the shim's real target (node + codex.js) and spawn that directly.
 */
async function resolveCodexCommand(): Promise<{ cmd: string; baseArgs: string[] }> {
  if (process.platform !== 'win32') return { cmd: 'codex', baseArgs: [] }
  const { stdout } = await run('where.exe', ['codex'])
  const shim = stdout.split(/\r?\n/).find((line) => line.trim().length > 0)
  if (!shim) throw new Error('codex CLI not found on PATH')
  const codexJs = path.join(
    path.dirname(shim.trim()),
    'node_modules', '@openai', 'codex', 'bin', 'codex.js',
  )
  return { cmd: process.execPath, baseArgs: [codexJs] }
}

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
  let referenceFile: string | null = null
  try {
    const { prompt, referenceBase64, prependBase = true } = (await req.json()) as CodexGenerateRequestBody
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }
    const outputDir = process.env[AI_OUTPUT_ENV]
    if (!outputDir) {
      return NextResponse.json({ error: `Set ${AI_OUTPUT_ENV} to your Codex image output dir.` }, { status: 400 })
    }
    const since = Date.now()
    // -i attaches the base sprite so Codex anchors the generation to it instead
    // of inventing a new character. Codex reads a file path, not base64.
    if (referenceBase64) referenceFile = await writeReferenceImage(referenceBase64, since)
    const imageArgs = referenceFile ? ['-i', referenceFile] : []
    // DEV-ONLY: runs Codex as an autonomous agent (exec mode is non-interactive)
    // with a permissive sandbox on the local machine. Never deploy this route.
    // `-i` is variadic (<FILE>...); the `--` terminator stops it from swallowing
    // the prompt as an extra image path.
    const { cmd, baseArgs } = await resolveCodexCommand()
    const codexRun = run(
      cmd,
      [...baseArgs, 'exec', '--sandbox', 'danger-full-access', '--skip-git-repo-check',
       '-m', CODEX_IMAGE_MODEL,
       ...imageArgs, '--', prependBase ? `${CODEX_BASE_PROMPT}${prompt}` : prompt],
      { timeout: CODEX_TIMEOUT_MS, maxBuffer: CODEX_MAX_BUFFER_BYTES },
    )
    // codex exec blocks reading piped stdin until EOF; close it so it starts.
    codexRun.child.stdin?.end()
    await codexRun
    const file = await newestPngAfter(outputDir, since)
    if (!file) {
      return NextResponse.json({ error: CODEX_NO_PNG_ERROR }, { status: 502 })
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
  } finally {
    if (referenceFile) await fs.unlink(referenceFile).catch(() => {})
  }
}

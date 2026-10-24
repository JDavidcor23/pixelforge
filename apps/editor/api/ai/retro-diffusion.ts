import {
  RETRO_DIFFUSION_ENDPOINT,
  RETRO_DIFFUSION_TOKEN_HEADER,
  RETRO_DIFFUSION_DEFAULT_STYLE,
  RETRO_DIFFUSION_MIN_SIZE,
  RETRO_DIFFUSION_MAX_SIZE,
  RETRO_DIFFUSION_PRO_STYLE_PREFIX,
  RETRO_DIFFUSION_PRO_MIN_SIZE,
  RETRO_DIFFUSION_PRO_MAX_SIZE,
  RETRO_DIFFUSION_TIMEOUT_MS,
  RETRO_DIFFUSION_NO_IMAGE_ERROR,
  RETRO_DIFFUSION_MISSING_KEY_ERROR,
} from '../../src/constants'
import type { RetroDiffusionRequestBody, RetroDiffusionStyle } from '../../src/types'

/** Shape of the upstream Retro Diffusion response we actually consume. */
interface RetroDiffusionApiResponse {
  readonly base64_images?: readonly string[]
  readonly balance_cost?: number
  readonly remaining_balance?: number
  readonly message?: string
  readonly error?: string
}

/**
 * `rd_pro__*` (Quality: Best) accepts a narrower size range than Fast/Plus —
 * measured live on 2026-10-11 (see `RETRO_DIFFUSION_PRO_MIN_SIZE`/`_MAX_SIZE`).
 * Clamping must read the resolved style, not a single global range, or a Best
 * request above 256px would be forwarded upstream and rejected there instead.
 */
const clampSize = (value: number, style: RetroDiffusionStyle): number => {
  const isProStyle = style.startsWith(RETRO_DIFFUSION_PRO_STYLE_PREFIX)
  const min = isProStyle ? RETRO_DIFFUSION_PRO_MIN_SIZE : RETRO_DIFFUSION_MIN_SIZE
  const max = isProStyle ? RETRO_DIFFUSION_PRO_MAX_SIZE : RETRO_DIFFUSION_MAX_SIZE
  return Math.min(max, Math.max(min, Math.round(value)))
}

/** Retro Diffusion wants bare base64 for `input_image`, not a data URI. */
const stripDataUri = (base64: string): string => {
  const comma = base64.indexOf(',')
  return base64.startsWith('data:') && comma !== -1 ? base64.slice(comma + 1) : base64
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

/**
 * Vercel Function (Node.js runtime, Web-standard Request/Response — see
 * design.md "Monorepo specifics"). Replaces the former Next.js route handler
 * `src/app/api/ai/retro-diffusion/route.ts`. The Retro Diffusion API key
 * stays a server-side-only env var (`API_RETRO_DIFFUSION`, not `VITE_*`), so
 * it never ships in the client bundle.
 */
export async function handler(req: Request): Promise<Response> {
  try {
    const {
      prompt,
      width,
      height,
      style = RETRO_DIFFUSION_DEFAULT_STYLE,
      seed,
      inputImageBase64,
      strength,
      checkCost = false,
      apiKey: clientApiKey,
    } = (await req.json()) as RetroDiffusionRequestBody

    if (!prompt || !prompt.trim()) {
      return json({ error: 'Prompt is required' }, 400)
    }

    // BYOK first: the end user's own token means their generations bill their
    // own Retro Diffusion balance, not ours. The env key is the local fallback.
    const apiKey = clientApiKey || process.env.API_RETRO_DIFFUSION
    if (!apiKey) {
      return json({ error: RETRO_DIFFUSION_MISSING_KEY_ERROR, code: 'MISSING_API_KEY' }, 401)
    }

    const requestWidth = clampSize(width, style)
    const requestHeight = clampSize(height, style)

    const upstream = await fetch(RETRO_DIFFUSION_ENDPOINT, {
      method: 'POST',
      headers: {
        [RETRO_DIFFUSION_TOKEN_HEADER]: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        prompt_style: style,
        width: requestWidth,
        height: requestHeight,
        num_images: 1,
        // Returns a real alpha channel, so the editor never has to guess a
        // background colour to key out.
        remove_bg: true,
        ...(seed !== undefined ? { seed } : {}),
        ...(inputImageBase64
          ? { input_image: stripDataUri(inputImageBase64), ...(strength !== undefined ? { strength } : {}) }
          : {}),
        ...(checkCost ? { check_cost: true } : {}),
      }),
      signal: AbortSignal.timeout(RETRO_DIFFUSION_TIMEOUT_MS),
    })

    const data = (await upstream.json().catch(() => null)) as RetroDiffusionApiResponse | null

    if (!upstream.ok) {
      const message = data?.message || data?.error || 'Retro Diffusion request failed'
      console.error('retro-diffusion upstream error:', upstream.status, message)
      return json({ error: message }, upstream.status)
    }

    const costUsd = data?.balance_cost ?? 0
    const remainingBalanceUsd = data?.remaining_balance ?? 0

    // check_cost is billed at 0 and deliberately returns no image.
    if (checkCost) {
      return json({ costUsd, remainingBalanceUsd })
    }

    const image = data?.base64_images?.[0]
    if (!image) {
      return json({ error: RETRO_DIFFUSION_NO_IMAGE_ERROR }, 502)
    }

    return json({
      base64: image.startsWith('data:') ? image : `data:image/png;base64,${image}`,
      width: requestWidth,
      height: requestHeight,
      costUsd,
      remainingBalanceUsd,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('retro-diffusion error:', message)
    return json({ error: message }, 500)
  }
}

/** Vercel only passes a Web `Request` to a `default { fetch }` export; a bare default function gets Node req/res and hangs. */
export default { fetch: handler }

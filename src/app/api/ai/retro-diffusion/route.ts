import { NextResponse } from 'next/server'
import {
  RETRO_DIFFUSION_ENDPOINT,
  RETRO_DIFFUSION_TOKEN_HEADER,
  RETRO_DIFFUSION_DEFAULT_STYLE,
  RETRO_DIFFUSION_MIN_SIZE,
  RETRO_DIFFUSION_MAX_SIZE,
  RETRO_DIFFUSION_TIMEOUT_MS,
  RETRO_DIFFUSION_ANIMATION_TIMEOUT_MS,
  RETRO_DIFFUSION_NO_IMAGE_ERROR,
  RETRO_DIFFUSION_MISSING_KEY_ERROR,
} from '@/app/editor/constants'
import type { RetroDiffusionRequestBody } from '@/app/editor/types'

/** Shape of the upstream Retro Diffusion response we actually consume. */
interface RetroDiffusionApiResponse {
  readonly base64_images?: readonly string[]
  readonly balance_cost?: number
  readonly remaining_balance?: number
  readonly message?: string
  readonly error?: string
}

const clampSize = (value: number): number =>
  Math.min(RETRO_DIFFUSION_MAX_SIZE, Math.max(RETRO_DIFFUSION_MIN_SIZE, Math.round(value)))

/** Retro Diffusion wants bare base64 for `input_image`, not a data URI. */
const stripDataUri = (base64: string): string => {
  const comma = base64.indexOf(',')
  return base64.startsWith('data:') && comma !== -1 ? base64.slice(comma + 1) : base64
}

export async function POST(req: Request) {
  try {
    const {
      prompt,
      width,
      height,
      style = RETRO_DIFFUSION_DEFAULT_STYLE,
      seed,
      inputImageBase64,
      strength,
      framesDuration,
      returnSpritesheet,
      checkCost = false,
      apiKey: clientApiKey,
    } = (await req.json()) as RetroDiffusionRequestBody

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // BYOK first: the end user's own token means their generations bill their
    // own Retro Diffusion balance, not ours. The env key is the local fallback.
    const apiKey = clientApiKey || process.env.API_RETRO_DIFFUSION
    if (!apiKey) {
      return NextResponse.json(
        { error: RETRO_DIFFUSION_MISSING_KEY_ERROR, code: 'MISSING_API_KEY' },
        { status: 401 },
      )
    }

    const requestWidth = clampSize(width)
    const requestHeight = clampSize(height)

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
        // The whole reason we left Codex: a real alpha channel instead of a
        // solid fill that chroma-key.ts had to guess at.
        remove_bg: true,
        ...(seed !== undefined ? { seed } : {}),
        ...(inputImageBase64
          ? { input_image: stripDataUri(inputImageBase64), ...(strength !== undefined ? { strength } : {}) }
          : {}),
        ...(framesDuration !== undefined ? { frames_duration: framesDuration } : {}),
        ...(returnSpritesheet ? { return_spritesheet: true } : {}),
        ...(checkCost ? { check_cost: true } : {}),
      }),
      // An animation takes several times longer than a sprite, and aborting one
      // does NOT refund it — Retro Diffusion bills the generation either way.
      signal: AbortSignal.timeout(
        framesDuration !== undefined
          ? RETRO_DIFFUSION_ANIMATION_TIMEOUT_MS
          : RETRO_DIFFUSION_TIMEOUT_MS,
      ),
    })

    const data = (await upstream.json().catch(() => null)) as RetroDiffusionApiResponse | null

    if (!upstream.ok) {
      const message = data?.message || data?.error || 'Retro Diffusion request failed'
      console.error('retro-diffusion upstream error:', upstream.status, message)
      return NextResponse.json({ error: message }, { status: upstream.status })
    }

    const costUsd = data?.balance_cost ?? 0
    const remainingBalanceUsd = data?.remaining_balance ?? 0

    // check_cost is billed at 0 and deliberately returns no image.
    if (checkCost) {
      return NextResponse.json({ costUsd, remainingBalanceUsd })
    }

    const image = data?.base64_images?.[0]
    if (!image) {
      return NextResponse.json({ error: RETRO_DIFFUSION_NO_IMAGE_ERROR }, { status: 502 })
    }

    // NOTE: width/height are what was REQUESTED, which for an animation is the
    // size of ONE frame — the returned PNG is a grid of them (4 frames of 64px
    // come back as a single 128x128 sheet). Callers slicing a sheet must read the
    // real dimensions off the decoded image, not trust these two numbers.
    return NextResponse.json({
      base64: image.startsWith('data:') ? image : `data:image/png;base64,${image}`,
      width: requestWidth,
      height: requestHeight,
      costUsd,
      remainingBalanceUsd,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('retro-diffusion error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

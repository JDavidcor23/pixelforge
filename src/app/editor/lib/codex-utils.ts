import type { PixelBuffer, CodexGenerationResult } from '@/app/editor/types'
import { CODEX_GENERATE_ROUTE, QUANTIZE_DEFAULTS } from '@/app/editor/constants'
import { base64ToNativePixels } from './pixellab-utils'
import { downscalePixels } from './downscale'
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
  const native = await base64ToNativePixels(base64)
  const pixels = downscalePixels(native, size)
  if (!quantize) return pixels
  return quantizePixels(pixels, {
    colors: QUANTIZE_DEFAULTS.COLORS,
    weightBySaturation: true,
    iterations: QUANTIZE_DEFAULTS.ITERATIONS,
    alphaThreshold: QUANTIZE_DEFAULTS.ALPHA_THRESHOLD,
  })
}

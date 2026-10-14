import type {
  PixelBuffer,
  RetroDiffusionCostEstimate,
  RetroDiffusionGenerationResult,
  RetroDiffusionRequestBody,
} from '@/types'
import { RETRO_DIFFUSION_ROUTE } from '@/constants'
import { base64ToNativePixels } from './image-decode'
import { decodeToPixels } from './sprite-pipeline'

async function postToRetroDiffusion<T>(body: RetroDiffusionRequestBody): Promise<T> {
  const res = await fetch(RETRO_DIFFUSION_ROUTE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error || 'Retro Diffusion generation failed')
  }
  return res.json() as Promise<T>
}

/** Generates one sprite at exactly `width` x `height` with a real alpha channel. */
export async function generateSpriteWithRetroDiffusion(
  body: RetroDiffusionRequestBody,
): Promise<RetroDiffusionGenerationResult> {
  return postToRetroDiffusion<RetroDiffusionGenerationResult>({ ...body, checkCost: false })
}

/**
 * Prices a generation without producing one. Billed at zero by Retro Diffusion,
 * so it is safe to call on every prompt change to show the user what a
 * generation will cost before they spend their own balance.
 */
export async function estimateRetroDiffusionCost(
  body: RetroDiffusionRequestBody,
): Promise<RetroDiffusionCostEstimate> {
  return postToRetroDiffusion<RetroDiffusionCostEstimate>({ ...body, checkCost: true })
}

/**
 * Turns a generated PNG into editor pixels.
 *
 * The fast path is the point of this function: Retro Diffusion honours the
 * requested width/height, so the returned image ALREADY IS the pixel grid.
 * Sending it through `decodeToPixels` would run `fitSpriteCentered`, which crops
 * to the content bounding box and scales it up to fill the canvas — a sprite
 * drawn with deliberate headroom would come out inflated edge to edge, its
 * proportions destroyed. So when the size already matches, pixels are used
 * verbatim.
 *
 * The slow path stays for anything NOT already at grid size: user file imports,
 * oversized history entries, and any future non-grid source.
 */
export async function decodeGeneratedSprite(base64: string, size: number): Promise<PixelBuffer> {
  const native: PixelBuffer = await base64ToNativePixels(base64)
  if (native.w === size && native.h === size) return native
  return decodeToPixels(base64, size, true)
}

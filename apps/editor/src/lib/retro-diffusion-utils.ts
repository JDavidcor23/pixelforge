import type {
  PixelBuffer,
  AnimationAction,
  AnimationDirection,
  RetroDiffusionCostEstimate,
  RetroDiffusionGenerationResult,
  RetroDiffusionRequestBody,
  RetroDiffusionStyle,
} from '@/types'
import {
  RETRO_DIFFUSION_ROUTE,
  RETRO_DIFFUSION_ANIMATION_ACTIONS,
  RETRO_DIFFUSION_ANIMATION_PROMPT,
  RETRO_DIFFUSION_ANIMATION_STYLE_PREFIX,
} from '@/constants'
import { base64ToNativePixels } from './image-decode'
import { decodeToPixels, cropRegion } from './sprite-pipeline'

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

/** Generates an animation sheet. `framesDuration` is billed flat, so ask for plenty. */
export async function generateAnimationWithRetroDiffusion(
  action: AnimationAction,
  direction: AnimationDirection,
  frames: number,
  size: number,
  referenceBase64: string,
  apiKey?: string,
): Promise<RetroDiffusionGenerationResult> {
  return postToRetroDiffusion<RetroDiffusionGenerationResult>({
    prompt: RETRO_DIFFUSION_ANIMATION_PROMPT(action, direction),
    style: `${RETRO_DIFFUSION_ANIMATION_STYLE_PREFIX}${RETRO_DIFFUSION_ANIMATION_ACTIONS[action]}` as RetroDiffusionStyle,
    width: size,
    height: size,
    framesDuration: frames,
    // Otherwise the answer is a GIF, which a canvas cannot decompose into frames.
    returnSpritesheet: true,
    inputImageBase64: referenceBase64,
    apiKey,
    checkCost: false,
  })
}

/**
 * Cuts a Retro Diffusion animation sheet into individual frames.
 *
 * The grid is derived from the sheet's REAL dimensions divided by the frame size
 * that was requested — 4 frames of 64px come back as a 128x128 sheet, so cols and
 * rows both resolve to 2. Cells are exact and evenly spaced with no gutters, so
 * this is division, not detection: no column projection, valley splitting or run
 * repair is involved.
 *
 * Frames are read row-major (left to right, top to bottom) and capped at
 * `expectedFrames`, since a grid can hold more cells than were asked for.
 */
export async function sliceAnimationSheet(
  sheetBase64: string,
  frameSize: number,
  expectedFrames: number,
): Promise<PixelBuffer[]> {
  const sheet: PixelBuffer = await base64ToNativePixels(sheetBase64)
  const sheetHeight = sheet.h
  const sheetWidth = sheet.w
  if (sheetHeight === 0 || sheetWidth === 0 || frameSize <= 0) return []

  const cols = Math.max(1, Math.floor(sheetWidth / frameSize))
  const rows = Math.max(1, Math.floor(sheetHeight / frameSize))
  const available = cols * rows

  const frames: PixelBuffer[] = []
  for (let index = 0; index < Math.min(expectedFrames, available); index++) {
    const originX = (index % cols) * frameSize
    const originY = Math.floor(index / cols) * frameSize
    // cols/rows are floor(sheetDim / frameSize), so this region is always
    // fully inside the sheet — no ragged final row to guard against.
    frames.push(cropRegion(sheet, originX, originX + frameSize - 1, originY, originY + frameSize - 1))
  }
  return frames
}

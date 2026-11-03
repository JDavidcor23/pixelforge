import type { PixelBuffer } from '@/types'
import type { AIGeneration } from '@/types/ai-generation'
import type { DocumentAssetsApi, DocumentPayload, SpritePreview } from '@/types/document'
import { SPRITE_EDITOR_DEFAULTS, SPRITE_EDITOR_LAYER, SPRITE_EDITOR_TIMELINE } from '@/constants'
import { DOCUMENT_SCHEMA_VERSION } from '@/constants/persistence'
import { nextUntitledName } from './untitled-name'

const RGBA_CHANNELS = 4
const ALPHA_OFFSET = 3
const MAX_CHANNEL = 255

/**
 * ADR 0015 helpers between a sprite document and its Assets item. Pure and
 * DOM-free: PNG encode/decode stay with the caller (`useDocumentPersistence`
 * injects them), so the controller and the draft migration run in node tests.
 */

/** True when any layer of any frame holds a non-transparent pixel. */
export const documentHasContent = (payload: DocumentPayload): boolean =>
  payload.frames.some((frame) =>
    frame.layers.some((layer) => {
      for (let i = ALPHA_OFFSET; i < layer.data.length; i += RGBA_CHANNELS) if (layer.data[i] !== 0) return true
      return false
    }),
  )

/**
 * Composites one frame's visible layers, bottom (index 0) to top, with each
 * layer's opacity — the same source-over order `export-utils.ts` draws them
 * on a canvas. `frameIndex` is clamped to the document's frames.
 */
export const flattenDocumentFrame = (payload: DocumentPayload, frameIndex: number): PixelBuffer => {
  const { w, h } = payload
  const out = new Float64Array(w * h * RGBA_CHANNELS)
  const frame = payload.frames[Math.min(Math.max(frameIndex, 0), payload.frames.length - 1)]

  for (const layer of frame?.layers ?? []) {
    if (!layer.visible) continue
    const opacity = layer.opacity / SPRITE_EDITOR_LAYER.MAX_OPACITY
    for (let i = 0; i < out.length; i += RGBA_CHANNELS) {
      const srcAlpha = (layer.data[i + ALPHA_OFFSET] / MAX_CHANNEL) * opacity
      if (srcAlpha === 0) continue
      const dstAlpha = out[i + ALPHA_OFFSET]
      const outAlpha = srcAlpha + dstAlpha * (1 - srcAlpha)
      for (let c = 0; c < ALPHA_OFFSET; c += 1) {
        out[i + c] = (layer.data[i + c] * srcAlpha + out[i + c] * dstAlpha * (1 - srcAlpha)) / outAlpha
      }
      out[i + ALPHA_OFFSET] = outAlpha
    }
  }

  const data = new Uint8ClampedArray(out.length)
  for (let i = 0; i < out.length; i += RGBA_CHANNELS) {
    for (let c = 0; c < ALPHA_OFFSET; c += 1) data[i + c] = Math.round(out[i + c])
    data[i + ALPHA_OFFSET] = Math.round(out[i + ALPHA_OFFSET] * MAX_CHANNEL)
  }
  return { w, h, data }
}

/** The Assets preview of a document: one flattened frame, encoded by `encodePng`. */
export const documentPreview = (
  payload: DocumentPayload,
  frameIndex: number,
  encodePng: (pixels: PixelBuffer) => string,
): SpritePreview => ({ base64: encodePng(flattenDocumentFrame(payload, frameIndex)), width: payload.w, height: payload.h })

/** A one-frame, one-layer document holding `pixels` as-is (an asset that has only its PNG). */
export const documentFromPixels = (pixels: PixelBuffer): DocumentPayload => {
  const layerId = crypto.randomUUID()
  return {
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    w: pixels.w,
    h: pixels.h,
    frameMs: [SPRITE_EDITOR_TIMELINE.DEFAULT_FRAME_DURATION_MS],
    frames: [
      {
        id: crypto.randomUUID(),
        activeLayerId: layerId,
        layers: [
          {
            id: layerId,
            name: `${SPRITE_EDITOR_DEFAULTS.LAYER_NAME_PREFIX} 1`,
            visible: true,
            locked: false,
            opacity: SPRITE_EDITOR_LAYER.DEFAULT_OPACITY,
            data: new Uint8Array(pixels.data),
          },
        ],
      },
    ],
  }
}

/** A transparent `w`×`h` document (File > New sprite). */
export const blankDocument = (w: number, h: number): DocumentPayload =>
  documentFromPixels({ w, h, data: new Uint8ClampedArray(w * h * RGBA_CHANNELS) })

/** Adds a new editor-made sprite to Assets as "Untitled N" (next free number over the current generation/drawing labels). */
export const createUntitledSprite = (assets: DocumentAssetsApi, preview: SpritePreview): AIGeneration => {
  const { generations, addDrawing } = assets.getState()
  return addDrawing({ prompt: nextUntitledName(generations.map((g) => g.prompt)), ...preview })
}

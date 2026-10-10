import type { AnimationFrame } from '@/types'
import type { SerializedFrame, SerializedLayer } from './commands'

/**
 * Converts a live `AnimationFrame` (with `PixelBuffer`/`Uint8ClampedArray`
 * layers) into the plain, structured-clone-safe `SerializedFrame` shape the
 * `frame.paste` command carries (phase 2e: "command payloads become
 * serializable plain data — no live objects, no shared buffers"). `id`s are
 * included only for debugging/traceability — the core ALWAYS assigns fresh
 * ids on paste (judgment-day round 2, finding 6) regardless of what is sent
 * here, so callers never need to strip them.
 *
 * `new Uint8Array(layer.pixels.data)` copies the bytes (a `Uint8Array`
 * constructed from another typed array copies values, it does not view the
 * same buffer) — the caller's buffer is never aliased into the command.
 */
export function frameToSerializedFrame(frame: AnimationFrame): SerializedFrame {
  return {
    id: frame.id,
    activeLayerId: frame.activeLayerId,
    durationMs: frame.durationMs,
    layers: frame.layers.map(layerToSerializedLayer),
  }
}

function layerToSerializedLayer(layer: AnimationFrame['layers'][number]): SerializedLayer {
  return {
    id: layer.id,
    name: layer.name,
    visible: layer.visible,
    locked: layer.locked,
    opacity: layer.opacity,
    w: layer.pixels.w,
    h: layer.pixels.h,
    data: new Uint8Array(layer.pixels.data),
  }
}

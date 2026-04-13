import type { AnimationFrame, Layer } from '@/app/editor/types'
import {
  SPRITE_EDITOR_CANVAS,
  SPRITE_EDITOR_DEFAULTS,
  SPRITE_EDITOR_TIMELINE,
} from '@/app/editor/constants'
import { createEmptyBuffer } from '@/app/editor/lib'

export function createInitialLayer(width: number, height: number): Layer {
  return {
    id: crypto.randomUUID(),
    name: `${SPRITE_EDITOR_DEFAULTS.LAYER_NAME_PREFIX} 1`,
    visible: true,
    locked: false,
    opacity: 100,
    pixels: createEmptyBuffer(width, height),
  }
}

export function createInitialFrame(layers: Layer[], activeLayerId: string): AnimationFrame {
  return {
    id: crypto.randomUUID(),
    layers,
    activeLayerId,
    durationMs: SPRITE_EDITOR_TIMELINE.DEFAULT_FRAME_DURATION_MS,
  }
}

export const initialLayer = createInitialLayer(
  SPRITE_EDITOR_CANVAS.DEFAULT_WIDTH,
  SPRITE_EDITOR_CANVAS.DEFAULT_HEIGHT
)

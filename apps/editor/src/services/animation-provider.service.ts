import { createPixelLabAnimationProvider } from './pixellab-animation.service'
import type { AnimationErrorCode, AnimationProvider, AnimationProviderCredentials } from '@/types'

/**
 * Composition root of the `AnimationProvider` port (ADR 0009). The Animate tab
 * asks for "an animation provider", never for a vendor — swapping vendors means
 * a new adapter and one line here.
 */
export const resolveAnimationProvider = (credentials: AnimationProviderCredentials): AnimationProvider =>
  createPixelLabAnimationProvider(credentials)

/**
 * Thrown by any `AnimationProvider` adapter instead of a plain `Error` when
 * the server attached a known `code` (e.g. the PixelLab 429 `BUSY` mapping).
 * Lets the Animate tab react to the CODE, never to the error message text —
 * copy can change without breaking the "another job is already running" check.
 */
export class AnimationProviderError extends Error {
  constructor(
    message: string,
    public readonly code: AnimationErrorCode | null = null,
  ) {
    super(message)
    this.name = 'AnimationProviderError'
  }
}

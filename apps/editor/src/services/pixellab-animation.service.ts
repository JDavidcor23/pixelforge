import {
  ANIMATION_GENERIC_ERROR,
  PIXELLAB_ANIMATE_ROUTE,
  PIXELLAB_JOB_ID_PARAM,
  PIXELLAB_JOB_ROUTE,
  PIXELLAB_KEY_HEADER,
} from '@/constants/animation'
import { AnimationProviderError } from './animation-provider.service'
import type {
  AnimationErrorCode,
  AnimationJobStatus,
  AnimationProvider,
  AnimationProviderCredentials,
  AnimationSubmitResult,
  PixelLabAnimateRequestBody,
} from '@/types'

/**
 * Only a server `code` this adapter knows about becomes a typed
 * `AnimationErrorCode` — anything else (e.g. `MISSING_API_KEY`) stays `null`.
 * `ALREADY_RUNNING` is client-side only (the Animate tab's own guard) and
 * never arrives over the wire, so it is not in this list.
 */
const KNOWN_SERVER_ERROR_CODES: readonly AnimationErrorCode[] = ['BUSY']
const toAnimationErrorCode = (code: unknown): AnimationErrorCode | null =>
  KNOWN_SERVER_ERROR_CODES.find((known) => known === code) ?? null

const readJson = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string; code?: string }
    throw new AnimationProviderError(err.error || ANIMATION_GENERIC_ERROR, toAnimationErrorCode(err.code))
  }
  return res.json() as Promise<T>
}

/**
 * PixelLab adapter for the `AnimationProvider` port (ADR 0009). Talks only to
 * our own Vercel Functions — the PixelLab key and wire format stay server-side.
 */
export const createPixelLabAnimationProvider = ({ apiKey }: AnimationProviderCredentials): AnimationProvider => ({
  submit: (request) => {
    const body: PixelLabAnimateRequestBody = { ...request, apiKey }
    return fetch(PIXELLAB_ANIMATE_ROUTE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((res) => readJson<AnimationSubmitResult>(res))
  },
  poll: (jobId) => {
    const query = new URLSearchParams({ [PIXELLAB_JOB_ID_PARAM]: jobId })
    return fetch(`${PIXELLAB_JOB_ROUTE}?${query.toString()}`, {
      headers: apiKey ? { [PIXELLAB_KEY_HEADER]: apiKey } : {},
    }).then((res) => readJson<AnimationJobStatus>(res))
  },
})

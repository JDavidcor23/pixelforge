import { PIXELLAB_INPUT_FRAME_INDEX, PIXELLAB_JOB_FAILED_ERROR, PIXELLAB_NO_FRAMES_ERROR } from '../constants/animation'
import type { AnimationJobState, AnimationJobStatus, PixelLabBackgroundJob, PixelLabBase64Image } from '../types'

/*
 * Pure PixelLab wire-format helpers, used by the `api/ai/pixellab/*` Vercel
 * Functions. Relative imports only (no `@/` alias on the server).
 */

const DATA_URI_PREFIX = /^data:image\/[a-z]+;base64,/i
const DEFAULT_IMAGE_FORMAT = 'png'
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const
/** Base64 chars covering the PNG signature + IHDR width/height (24 bytes). */
const PNG_HEADER_BASE64_LENGTH = 32
const PNG_WIDTH_OFFSET = 16
const PNG_HEIGHT_OFFSET = 20

/** PixelLab wants bare base64, not a data URI. */
export const stripDataUri = (base64: string): string => base64.replace(DATA_URI_PREFIX, '')

const readUint32 = (bytes: readonly number[], offset: number): number =>
  ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0

/**
 * Width/height straight from the PNG header (IHDR), or null when the data is
 * not a PNG. Lets the server validate the REAL frame size instead of trusting
 * numbers the client sends next to the image.
 */
export function readPngSize(base64: string): { readonly width: number; readonly height: number } | null {
  try {
    const header = atob(stripDataUri(base64).slice(0, PNG_HEADER_BASE64_LENGTH))
    const bytes = Array.from(header, (char) => char.charCodeAt(0))
    if (!PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)) return null
    return { width: readUint32(bytes, PNG_WIDTH_OFFSET), height: readUint32(bytes, PNG_HEIGHT_OFFSET) }
  } catch {
    return null
  }
}

const toDataUri = (image: PixelLabBase64Image | string): string => {
  if (typeof image === 'string') {
    return DATA_URI_PREFIX.test(image) ? image : `data:image/${DEFAULT_IMAGE_FORMAT};base64,${image}`
  }
  return `data:image/${image.format ?? DEFAULT_IMAGE_FORMAT};base64,${stripDataUri(image.base64)}`
}

const describeDetail = (detail: unknown): string | null => {
  if (detail === undefined || detail === null) return null
  return typeof detail === 'string' ? detail : JSON.stringify(detail)
}

const KNOWN_STATES: readonly AnimationJobState[] = ['queued', 'processing', 'completed', 'failed']

/** Unknown upstream states count as still running — polling continues until the client timeout. */
const toJobState = (status: string | undefined): AnimationJobState =>
  KNOWN_STATES.find((state) => state === status) ?? 'processing'

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

/** Queue position / wait estimate of a running job — only the fields PixelLab actually sent. */
const readProgress = (
  response: PixelLabBackgroundJob['last_response'],
): Pick<AnimationJobStatus, 'queuePosition' | 'estimatedWaitSeconds'> => {
  const queuePosition = response?.queue_position
  const estimatedWaitSeconds = response?.estimated_wait_seconds
  return {
    ...(isFiniteNumber(queuePosition) && { queuePosition }),
    ...(isFiniteNumber(estimatedWaitSeconds) && { estimatedWaitSeconds }),
  }
}

/**
 * `GET /v2/background-jobs/{id}` → the port's `AnimationJobStatus`. A finished
 * job holds `frame_count + 1` images: index 0 is the INPUT frame, so it is
 * dropped — the user only ever sees generated frames.
 */
export function mapPixelLabJob(job: PixelLabBackgroundJob): AnimationJobStatus {
  const status = toJobState(job.status)
  const costUsd = job.usage?.usd ?? null
  const detail = describeDetail(job.last_response?.detail)

  if (status === 'failed') {
    return { status, frames: [], error: detail ?? PIXELLAB_JOB_FAILED_ERROR, costUsd }
  }
  if (status !== 'completed') {
    return { status, frames: [], error: null, costUsd, ...readProgress(job.last_response) }
  }

  const frames = (job.last_response?.images ?? [])
    .filter((_, index) => index !== PIXELLAB_INPUT_FRAME_INDEX)
    .map(toDataUri)
  if (frames.length === 0) {
    return { status: 'failed', frames: [], error: detail ?? PIXELLAB_NO_FRAMES_ERROR, costUsd }
  }
  return { status, frames, error: null, costUsd }
}

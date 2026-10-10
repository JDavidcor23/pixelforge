import {
  ANIMATION_HISTORY_LIMIT,
  ANIMATION_HISTORY_STORAGE_KEY,
  ANIMATION_PIPELINE_VERSION,
} from '@/app/editor/constants'
import type { AIAnimation } from '@/app/editor/types'

const PNG_DATA_URI_PREFIX = 'data:image/png;base64,'
const PNG_BASE64_SIGNATURE = 'iVBORw0KGgo'

export interface ParsedAnimationHistory {
  readonly animations: AIAnimation[]
  readonly requiresRewrite: boolean
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const isPositiveFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

const isPngDataUri = (value: unknown): value is string =>
  isNonEmptyString(value) &&
  value.startsWith(`${PNG_DATA_URI_PREFIX}${PNG_BASE64_SIGNATURE}`)

const normalizeAnimation = (value: unknown): AIAnimation | null => {
  if (typeof value !== 'object' || value === null) return null

  const candidate = value as Record<string, unknown>
  if (
    candidate.pipelineVersion !== ANIMATION_PIPELINE_VERSION ||
    !isNonEmptyString(candidate.id) ||
    !isNonEmptyString(candidate.label) ||
    !Array.isArray(candidate.frames) ||
    candidate.frames.length === 0 ||
    !candidate.frames.every(isPngDataUri) ||
    !isPositiveFiniteNumber(candidate.frameDurationMs) ||
    !isPositiveFiniteNumber(candidate.timestamp)
  ) {
    return null
  }

  return {
    pipelineVersion: ANIMATION_PIPELINE_VERSION,
    id: candidate.id,
    label: candidate.label,
    frames: [...candidate.frames],
    frameDurationMs: candidate.frameDurationMs,
    timestamp: candidate.timestamp,
  }
}

/**
 * Parses persisted animation history without trusting its JSON shape. Entries
 * from older pipelines are intentionally discarded: only normalized 64x64
 * frames were persisted, so the original sheet cannot be sliced again.
 */
export const parseAnimationHistory = (serialized: string | null): ParsedAnimationHistory => {
  if (serialized === null) return { animations: [], requiresRewrite: false }

  try {
    const parsed: unknown = JSON.parse(serialized)
    if (!Array.isArray(parsed)) return { animations: [], requiresRewrite: true }

    const animations: AIAnimation[] = []
    const animationIds = new Set<string>()

    for (const value of parsed) {
      const animation = normalizeAnimation(value)
      if (animation === null || animationIds.has(animation.id)) continue

      animationIds.add(animation.id)
      animations.push(animation)
      if (animations.length === ANIMATION_HISTORY_LIMIT) break
    }

    return {
      animations,
      requiresRewrite: animations.length !== parsed.length,
    }
  } catch {
    return { animations: [], requiresRewrite: true }
  }
}

export const persistAnimationHistory = (
  storage: Pick<Storage, 'removeItem' | 'setItem'>,
  animations: readonly AIAnimation[],
): void => {
  const limitedAnimations = animations.slice(0, ANIMATION_HISTORY_LIMIT)

  if (limitedAnimations.length === 0) {
    storage.removeItem(ANIMATION_HISTORY_STORAGE_KEY)
    return
  }

  storage.setItem(ANIMATION_HISTORY_STORAGE_KEY, JSON.stringify(limitedAnimations))
}

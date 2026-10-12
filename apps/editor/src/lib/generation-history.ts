import { GENERATION_HISTORY_LIMIT, GENERATION_HISTORY_STORAGE_KEY } from '@/constants'
import type { AIGeneration, AssetType } from '@/types'

const PNG_DATA_URI_PREFIX = 'data:image/png;base64,'
const ASSET_TYPES: readonly AssetType[] = ['character', 'object', 'weapon', 'costume', 'effect']

export interface ParsedGenerationHistory {
  readonly generations: AIGeneration[]
  readonly requiresRewrite: boolean
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const isPngDataUri = (value: unknown): value is string =>
  isNonEmptyString(value) && value.startsWith(PNG_DATA_URI_PREFIX)

const isAssetType = (value: unknown): value is AssetType =>
  typeof value === 'string' && (ASSET_TYPES as readonly string[]).includes(value)

/**
 * Normalizes a persisted generation entry. `assetType` is only copied through
 * when present and valid — entries from before the Create tab existed stay
 * byte-for-byte unchanged, and callers decide the back-compat default
 * (Assets tab: untyped generations count as `'character'`), not this parser.
 */
const normalizeGeneration = (value: unknown): AIGeneration | null => {
  if (typeof value !== 'object' || value === null) return null

  const candidate = value as Record<string, unknown>
  if (
    !isNonEmptyString(candidate.id) ||
    !isNonEmptyString(candidate.prompt) ||
    !isPngDataUri(candidate.base64) ||
    !isFiniteNumber(candidate.timestamp) ||
    !isFiniteNumber(candidate.width) ||
    !isFiniteNumber(candidate.height)
  ) {
    return null
  }

  return {
    id: candidate.id,
    prompt: candidate.prompt,
    base64: candidate.base64,
    timestamp: candidate.timestamp,
    width: candidate.width,
    height: candidate.height,
    ...(isAssetType(candidate.assetType) ? { assetType: candidate.assetType } : {}),
  }
}

/** Parses persisted generation history without trusting its JSON shape. */
export const parseGenerationHistory = (serialized: string | null): ParsedGenerationHistory => {
  if (serialized === null) return { generations: [], requiresRewrite: false }

  try {
    const parsed: unknown = JSON.parse(serialized)
    if (!Array.isArray(parsed)) return { generations: [], requiresRewrite: true }

    const generations: AIGeneration[] = []
    const seenIds = new Set<string>()

    for (const value of parsed) {
      const generation = normalizeGeneration(value)
      if (generation === null || seenIds.has(generation.id)) continue

      seenIds.add(generation.id)
      generations.push(generation)
      if (generations.length === GENERATION_HISTORY_LIMIT) break
    }

    return {
      generations,
      requiresRewrite: generations.length !== parsed.length,
    }
  } catch {
    return { generations: [], requiresRewrite: true }
  }
}

export const persistGenerationHistory = (
  storage: Pick<Storage, 'removeItem' | 'setItem'>,
  generations: readonly AIGeneration[],
): void => {
  const limited = generations.slice(0, GENERATION_HISTORY_LIMIT)

  if (limited.length === 0) {
    storage.removeItem(GENERATION_HISTORY_STORAGE_KEY)
    return
  }

  storage.setItem(GENERATION_HISTORY_STORAGE_KEY, JSON.stringify(limited))
}

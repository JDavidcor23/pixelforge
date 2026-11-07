import { toAssetName } from './asset-name'
import type { AssetCatalog, CatalogEntry, CatalogStoragePointer } from '@/types/asset-catalog.types'
import type { AIGeneration } from '@/types'
import type { AudioAsset } from '@/types/audio'

const EMPTY_REVISION = 0

const samePointer = (a: CatalogStoragePointer, b: CatalogStoragePointer): boolean => {
  if (a.type === 'sprite-library' && b.type === 'sprite-library') return a.assetId === b.assetId
  if (a.type === 'sound-source' && b.type === 'sound-source') {
    return a.supabaseUrl === b.supabaseUrl && a.localObjectUrl === b.localObjectUrl
  }
  return false
}

const sameEntry = (a: CatalogEntry, b: CatalogEntry): boolean =>
  a.id === b.id &&
  a.kind === b.kind &&
  a.revision === b.revision &&
  a.levelId === b.levelId &&
  a.chatTurnId === b.chatTurnId &&
  a.name === b.name &&
  samePointer(a.storage, b.storage)

const fromGeneration = (generation: AIGeneration): CatalogEntry => ({
  id: generation.id,
  kind: 'sprite',
  revision: generation.revision ?? EMPTY_REVISION,
  levelId: undefined,
  chatTurnId: undefined,
  name: toAssetName(generation.prompt),
  storage: { type: 'sprite-library', assetId: generation.id },
})

const fromSound = (sound: AudioAsset): CatalogEntry => ({
  id: sound.id,
  kind: 'sound',
  revision: sound.revision ?? EMPTY_REVISION,
  levelId: undefined,
  chatTurnId: undefined,
  name: toAssetName(sound.name),
  storage: {
    type: 'sound-source',
    supabaseUrl: sound.supabaseUrl,
    localObjectUrl: sound.localObjectUrl,
  },
})

const sameIds = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((id, index) => id === b[index])

/**
 * Derives the asset catalog from the sprite generations (animations have no
 * document and are excluded) and the sounds library. Pure. Structural
 * sharing: an unchanged entry keeps its reference from `previous`, `allIds`
 * keeps its reference when ids and order are unchanged, and `previous`
 * itself is returned when nothing changed.
 */
export function deriveAssetCatalog(
  generations: readonly AIGeneration[],
  sounds: readonly AudioAsset[],
  previous?: AssetCatalog,
): AssetCatalog {
  const next = [...generations.map(fromGeneration), ...sounds.map(fromSound)]

  const byId: Record<string, CatalogEntry> = {}
  let entriesChanged = previous === undefined
  for (const entry of next) {
    const old = previous?.byId[entry.id]
    const kept = old !== undefined && sameEntry(old, entry) ? old : entry
    if (kept !== old) entriesChanged = true
    byId[entry.id] = kept
  }

  const ids = next.map((entry) => entry.id)
  if (previous === undefined) return { byId, allIds: ids }

  const idsChanged = !sameIds(previous.allIds, ids)
  if (!entriesChanged && !idsChanged) return previous

  return { byId, allIds: idsChanged ? ids : previous.allIds }
}

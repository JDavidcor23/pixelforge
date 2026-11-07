import { ASSET_DEEP_LINK_PARAM, EDITOR_ROUTES } from '@/constants/routes'
import { toAssetName } from '@/lib/asset-catalog/asset-name'
import type { LibraryRow } from '@/build/types'
import type { AIGeneration } from '@/types'
import type { AudioAsset } from '@/types/audio'

const toHref = (route: string, id: string): string =>
  `${route}?${ASSET_DEEP_LINK_PARAM}=${encodeURIComponent(id)}`

/**
 * Biblioteca rows (ADR 0015, phase 3): every sprite asset the deep link can
 * open (generations and drawings; animations have no document), then every
 * sound, each in store order.
 */
export function buildLibraryRows(
  generations: readonly AIGeneration[],
  sounds: readonly AudioAsset[],
): LibraryRow[] {
  return [
    ...generations.map((generation): LibraryRow => ({
      id: generation.id,
      kind: 'sprite',
      name: toAssetName(generation.prompt),
      href: toHref(EDITOR_ROUTES.SPRITES, generation.id),
    })),
    ...sounds.map((sound): LibraryRow => ({
      id: sound.id,
      kind: 'sound',
      name: toAssetName(sound.name),
      href: toHref(EDITOR_ROUTES.SOUNDS, sound.id),
    })),
  ]
}

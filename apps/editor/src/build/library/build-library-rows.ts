import { ASSET_DEEP_LINK_PARAM, EDITOR_ROUTES } from '@/constants/routes'
import { BUILD_SCREEN_COPY } from '@/constants/build-screen'
import type { LibraryRow } from '@/build/types'
import type { CatalogEntry } from '@/types/asset-catalog.types'

const toHref = (route: string, id: string): string =>
  `${route}?${ASSET_DEEP_LINK_PARAM}=${encodeURIComponent(id)}`

/**
 * One Biblioteca row derived from a catalog entry (ADR 0016): the entry the
 * deep link can open (sprites and sounds), with its labels and Edit href.
 */
export function toLibraryRow(entry: CatalogEntry): LibraryRow {
  const isSprite = entry.kind === 'sprite'
  return {
    id: entry.id,
    kind: entry.kind,
    name: entry.name,
    href: toHref(isSprite ? EDITOR_ROUTES.SPRITES : EDITOR_ROUTES.SOUNDS, entry.id),
    kindLabel: isSprite ? BUILD_SCREEN_COPY.LIBRARY_KIND_SPRITE : BUILD_SCREEN_COPY.LIBRARY_KIND_SOUND,
    editAriaLabel: `${BUILD_SCREEN_COPY.LIBRARY_EDIT_ARIA_PREFIX} ${entry.name}`,
  }
}

import type { AssetLibraryItem, OpenLibraryItemDeps } from '@/types'

/**
 * ADR 0015: an Assets tile click opens that asset instead of painting it over
 * the open one. 'drawing' and 'generation' items live in `generations` and
 * open by id. An animation has no sprite document of its own, so it lands on
 * a new sprite and the open asset keeps its pixels.
 */
export const openLibraryItem = async (item: AssetLibraryItem, deps: OpenLibraryItemDeps): Promise<void> => {
  if (item.kind !== 'animation') {
    await deps.openAsset(item.id)
    return
  }
  const animation = deps.findAnimation(item.id)
  if (!animation) return
  deps.newSprite()
  await deps.applyAnimation(animation)
}

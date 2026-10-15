import { DEFAULT_ASSET_TYPE } from '@/constants'
import type { AssetLibraryItem, AssetLibrarySnapshot } from '@/types'

/**
 * Merges generation + animation history into the Assets library's shared
 * view-model row (`AssetLibraryItem`), newest first. Single source of truth
 * for both `useAssetsPanel.hook.ts` (bottom panel's Assets tab) and
 * `useReferencePicker.hook.ts` (Animate tab's reference picker, ADR 0011) —
 * they used to keep separate copies of this merge, which drifted when ADR
 * 0010 (Phase 1) added `kind: 'drawing'` to generation-sourced entries.
 */
export const buildAssetLibraryItems = ({ generations, animations }: AssetLibrarySnapshot): AssetLibraryItem[] => {
  const combined = [
    ...generations.map((gen) => ({
      timestamp: gen.timestamp,
      item: {
        id: gen.id,
        // ADR 0010 (Phase 1): `File > Save As…` persists a canvas snapshot
        // through this same `generations` slice/object store, tagged
        // `kind: 'drawing'` — everything else about it is a generation.
        kind: gen.kind ?? ('generation' as const),
        label: gen.prompt,
        thumbnailSrc: gen.base64,
        assetType: gen.assetType ?? DEFAULT_ASSET_TYPE,
        isAnimated: false,
      },
    })),
    ...animations.map((anim) => ({
      timestamp: anim.timestamp,
      item: {
        id: anim.id,
        kind: 'animation' as const,
        label: anim.label,
        thumbnailSrc: anim.frames[0] ?? '',
        assetType: anim.assetType ?? DEFAULT_ASSET_TYPE,
        isAnimated: true,
      },
    })),
  ]
  return combined.sort((a, b) => b.timestamp - a.timestamp).map((entry) => entry.item)
}

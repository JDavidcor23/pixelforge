import {
  useCreateAssetType,
  useCreateMethod,
  useSetCreateAssetType,
  useSetCreateMethod,
} from '@/sprites/hooks/useSpriteEditorStore.hook'

/**
 * `createMethod` and `assetType` both live in the UI store (not local state):
 * `createMethod` so the bottom panel's "Import" button and the Assets tab's
 * "New asset"/"Open Create" actions can preselect it before switching the
 * Inspector to this tab, and `assetType` so the Animate tab reads/edits the
 * same "what are you making?" choice instead of drifting out of sync with it.
 */
export const useCreateTab = () => {
  const assetType = useCreateAssetType()
  const setAssetType = useSetCreateAssetType()
  const createMethod = useCreateMethod()
  const setCreateMethod = useSetCreateMethod()

  return { assetType, setAssetType, createMethod, setCreateMethod }
}

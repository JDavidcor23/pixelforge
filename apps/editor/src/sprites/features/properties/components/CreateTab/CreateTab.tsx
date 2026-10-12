import { AssetTypeSelector } from './AssetTypeSelector'
import { CreateMethodToggle } from './CreateMethodToggle'
import { DrawPanel } from './DrawPanel'
import { GeneratePanel } from './GeneratePanel'
import { ImportPanel } from './ImportPanel'
import { useCreateTab } from './useCreateTab.hook'

const SECTION_LABEL = 'font-mono text-3xs uppercase tracking-wider text-subtle'

export const CreateTab = () => {
  const { assetType, setAssetType, createMethod, setCreateMethod } = useCreateTab()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className={SECTION_LABEL}>1 · What are you making?</span>
        <AssetTypeSelector value={assetType} onChange={setAssetType} />
      </div>

      <div className="flex flex-col gap-2">
        <span className={SECTION_LABEL}>2 · How?</span>
        <CreateMethodToggle value={createMethod} onChange={setCreateMethod} />
      </div>

      {createMethod === 'draw' && <DrawPanel />}
      {createMethod === 'generate' && <GeneratePanel assetType={assetType} />}
      {createMethod === 'import' && <ImportPanel />}
    </div>
  )
}

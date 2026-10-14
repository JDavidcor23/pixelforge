import { ChevronDown } from 'lucide-react'

import { AssetTypeSelector } from './AssetTypeSelector'
import { GeneratePanel } from './GeneratePanel'
import { QualitySelector } from './QualitySelector'
import { useCreateTab } from './useCreateTab.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

const SECTION_LABEL = 'font-mono text-3xs uppercase tracking-wider text-subtle'

export const CreateTab = () => {
  const { assetType, setAssetType, qualityTier, setQualityTier, isLoading, handleViewAssets } = useCreateTab()

  return (
    <div className="flex min-h-full flex-col gap-5">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-ink">Create with AI</h2>
          <span className="rounded-sm border border-ai-ink bg-ai/20 px-1.5 py-0.5 font-mono text-3xs uppercase tracking-wider text-ai-ink">
            AI Studio
          </span>
        </div>
        <p className="text-2xs text-subtle">Describe it. PixelForge draws it.</p>
      </div>

      <div className="flex flex-col gap-2">
        <span className={SECTION_LABEL}>1 · What are you making?</span>
        <AssetTypeSelector value={assetType} onChange={setAssetType} disabled={isLoading} />
      </div>

      <QualitySelector assetType={assetType} value={qualityTier} onChange={setQualityTier} disabled={isLoading} />

      <GeneratePanel assetType={assetType} qualityTier={qualityTier} />

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
        <p className="text-2xs text-subtle">Your creations live in Assets</p>
        <button
          type="button"
          onClick={handleViewAssets}
          className={`flex items-center gap-1 font-mono text-3xs font-medium uppercase tracking-wider text-accent hover:underline ${MOTION.COLORS} ${FOCUS_RING.SURFACE}`}
        >
          View
          <ChevronDown size={11} aria-hidden />
        </button>
      </div>
    </div>
  )
}

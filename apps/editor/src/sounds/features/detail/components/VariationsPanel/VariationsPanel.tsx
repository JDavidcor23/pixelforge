import { Shuffle, Sparkles } from 'lucide-react'

import { VariationCard } from '../VariationCard/VariationCard'
import { useVariationsPanel } from './useVariationsPanel.hook'
import type { AudioAsset } from '@/types/audio'

interface VariationsPanelProps {
  asset: AudioAsset
  isSynth: boolean
}

export function VariationsPanel({ asset, isSynth }: VariationsPanelProps) {
  const { titleId, variations, remake } = useVariationsPanel(asset, isSynth)

  return (
    <section
      aria-labelledby={titleId}
      className="flex w-95 shrink-0 flex-col gap-3 border-l border-line pl-6"
    >
      <h2 id={titleId} className="text-sm font-semibold text-ink">
        Not quite right?
      </h2>
      <VariationCard
        icon={Shuffle}
        tone="accent"
        title={variations.title}
        subtitle={variations.subtitle}
        state={variations.state}
        onClick={variations.onClick}
      />
      <VariationCard
        icon={Sparkles}
        tone="ai"
        title="Remake with AI"
        subtitle={remake.subtitle}
        state={remake.state}
        onClick={remake.onClick}
      />
    </section>
  )
}

import { SoundDetailHeader } from '../SoundDetailHeader/SoundDetailHeader'
import { VariationsPanel } from '../VariationsPanel/VariationsPanel'
import { WavePanel } from '@/sounds/features/playback'
import { TweakPanel } from '@/sounds/features/synthesizer'
import { useSoundDetail } from './useSoundDetail.hook'

export function SoundDetail() {
  const { asset, source, isSynth } = useSoundDetail()

  if (!asset || !source) {
    return (
      <section
        aria-label="Sound details"
        className="flex min-w-0 flex-1 items-center justify-center px-8 py-6"
      >
        <p className="text-xs text-muted">Pick a sound from the library to edit it.</p>
      </section>
    )
  }

  return (
    <section
      aria-label="Sound details"
      className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto px-8 py-6"
    >
      <SoundDetailHeader asset={asset} source={source} />
      <WavePanel asset={asset} />
      <div className="flex gap-6">
        <TweakPanel isSynth={isSynth} />
        <VariationsPanel asset={asset} isSynth={isSynth} />
      </div>
    </section>
  )
}

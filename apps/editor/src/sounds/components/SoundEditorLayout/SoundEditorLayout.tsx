import { Volume2 } from 'lucide-react'
import { SynthPanel } from '@/sounds/features/synthesizer'
import { AIGeneratePanel, GenerationHistory } from '@/sounds/features/ai-generate'
import { WaveformDisplay, TransportBar } from '@/sounds/features/playback'
import { LibraryPanel } from '@/sounds/features/library'
import { useSoundEditorLayout } from './useSoundEditorLayout.hook'

export function SoundEditorLayout() {
  const { activeLeftTab, showAudioOverlay, handleEnableAudio, handleTabChange } =
    useSoundEditorLayout()

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-zinc-950">
      {showAudioOverlay && (
        <button
          type="button"
          onClick={handleEnableAudio}
          aria-label="Click to enable audio"
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-zinc-950/90 backdrop-blur-sm"
        >
          <Volume2 className="h-12 w-12 text-violet-400" />
          <span className="text-lg font-medium text-zinc-200">Click to enable audio</span>
          <span className="text-sm text-zinc-500">
            Browser requires user interaction to start AudioContext
          </span>
        </button>
      )}

      <div className="grid flex-1 grid-cols-[320px_1fr_280px] gap-3 overflow-hidden p-3">
        <div className="flex flex-col gap-3 overflow-hidden">
          <div className="flex shrink-0 rounded-lg border border-zinc-800 bg-zinc-900/50">
            <button
              type="button"
              onClick={() => handleTabChange('synth')}
              aria-label="Synthesizer tab"
              aria-pressed={activeLeftTab === 'synth'}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                activeLeftTab === 'synth'
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              } rounded-l-lg`}
            >
              Synth
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('ai')}
              aria-label="AI generation tab"
              aria-pressed={activeLeftTab === 'ai'}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                activeLeftTab === 'ai'
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              } rounded-r-lg`}
            >
              AI
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeLeftTab === 'synth' ? <SynthPanel /> : <AIGeneratePanel />}
          </div>

          <div className="max-h-48 overflow-y-auto">
            <GenerationHistory />
          </div>
        </div>

        <div className="flex items-center justify-center overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
          <WaveformDisplay />
        </div>

        <div className="overflow-hidden">
          <LibraryPanel />
        </div>
      </div>

      <div className="shrink-0 border-t border-zinc-800 bg-zinc-900/80 p-3">
        <TransportBar />
      </div>
    </div>
  )
}

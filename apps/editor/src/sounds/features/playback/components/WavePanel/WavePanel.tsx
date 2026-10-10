import { Transport } from '../Transport/Transport'
import { Waveform } from '../Waveform/Waveform'
import { useWavePanel } from './useWavePanel.hook'
import type { AudioAsset } from '@/types/audio'

interface WavePanelProps {
  asset: AudioAsset
}

export function WavePanel({ asset }: WavePanelProps) {
  const {
    peaks,
    progress,
    currentTime,
    duration,
    isPlaying,
    loop,
    volume,
    timeLabel,
    handleTogglePlay,
    handleStop,
    handleSeek,
    handleVolumeChange,
    handleLoopToggle,
  } = useWavePanel(asset)

  return (
    <section
      aria-label="Waveform and playback"
      className="flex flex-col gap-3.5 rounded border border-line bg-surface px-5 pt-5 pb-3.5"
    >
      <Waveform
        peaks={peaks}
        progress={progress}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
      />
      <Transport
        isPlaying={isPlaying}
        loop={loop}
        volume={volume}
        timeLabel={timeLabel}
        onTogglePlay={handleTogglePlay}
        onStop={handleStop}
        onLoopToggle={handleLoopToggle}
        onVolumeChange={handleVolumeChange}
      />
    </section>
  )
}

import { Transport } from '@/sounds/features/playback'
import { useTimelineClock } from './useTimelineClock.hook'

interface TimelineTransportProps {
  isPlaying: boolean
  loop: boolean
  volume: number
  onTogglePlay: () => void
  onStop: () => void
  onLoopToggle: () => void
  onVolumeChange: (volume: number) => void
}

export function TimelineTransport(props: TimelineTransportProps) {
  const { timeLabel, totalLabel } = useTimelineClock()

  return (
    <div className="flex h-13 shrink-0 items-center border-b border-line px-6">
      <div className="flex-1">
        <Transport {...props} timeLabel={timeLabel} totalLabel={totalLabel} volumeLabel="Master" />
      </div>
    </div>
  )
}

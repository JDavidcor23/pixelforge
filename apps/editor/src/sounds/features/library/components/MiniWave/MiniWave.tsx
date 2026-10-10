import { useMiniWave } from './useMiniWave.hook'

interface MiniWaveProps {
  peaks?: readonly number[]
  isActive: boolean
}

export function MiniWave({ peaks, isActive }: MiniWaveProps) {
  const { bars, viewBox, barWidth } = useMiniWave(peaks)

  return (
    <svg
      viewBox={viewBox}
      className={`h-5.5 w-14 shrink-0 ${isActive ? 'fill-accent' : 'fill-muted/30 group-hover:fill-muted/50'}`}
      aria-hidden
    >
      {bars.map((bar) => (
        <rect key={bar.x} x={bar.x} y={bar.y} width={barWidth} height={bar.height} />
      ))}
    </svg>
  )
}

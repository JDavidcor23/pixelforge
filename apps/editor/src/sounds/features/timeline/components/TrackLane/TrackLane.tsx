import { MOTION } from '@/constants/motion'

interface TrackLaneProps {
  isDropTarget: boolean
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void
}

/** Background of one track; clips live in the shared clip layer above it. */
export function TrackLane({ isDropTarget, onPointerDown }: TrackLaneProps) {
  return (
    <div
      data-drop-target={isDropTarget || undefined}
      onPointerDown={onPointerDown}
      className={`relative min-w-0 flex-1 data-drop-target:bg-accent/5 ${MOTION.COLORS}`}
    />
  )
}

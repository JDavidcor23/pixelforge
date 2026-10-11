import { usePlayhead } from './usePlayhead.hook'

interface PlayheadProps {
  /** The track area's scroller, followed while playing. */
  scrollRef: React.RefObject<HTMLDivElement | null>
  isPlaying: boolean
}

export function Playhead({ scrollRef, isPlaying }: PlayheadProps) {
  const { x } = usePlayhead(scrollRef, isPlaying)

  // rAF-driven: positioned with a transform (no layout) and no transition.
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-0 z-20 w-0.5 -translate-x-1/2 bg-accent"
      style={{ transform: `translateX(${x}px)` }}
    />
  )
}

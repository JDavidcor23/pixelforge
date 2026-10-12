import { useResizeHandle } from './useResizeHandle.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

interface ResizeHandleProps {
  readonly axis: 'x' | 'y'
  readonly invert: boolean
  readonly size: number
  readonly min: number
  readonly max: number
  readonly defaultSize: number
  readonly onResize: (size: number) => void
  readonly onDragStart?: () => void
  readonly onDragEnd?: () => void
  readonly label: string
  /** Positions and sizes the hit area on the panel's resizable edge (absolute + translate utilities). */
  readonly positionClassName: string
}

/**
 * Drag handle for a resizable shell panel (left layers rail, right inspector,
 * bottom timeline/assets panel). A 6px hit area with a 1px visible line that
 * lights up on hover/drag; double-click resets to `defaultSize`; full
 * keyboard support via `role="separator"`.
 */
export const ResizeHandle = ({
  axis,
  invert,
  size,
  min,
  max,
  defaultSize,
  onResize,
  onDragStart,
  onDragEnd,
  label,
  positionClassName,
}: ResizeHandleProps) => {
  const { isDragging, handlePointerDown, handlePointerMove, handlePointerUp, handleKeyDown, handleDoubleClick } =
    useResizeHandle({ axis, invert, size, min, max, defaultSize, onResize, onDragStart, onDragEnd })

  return (
    <div
      role="separator"
      aria-orientation={axis === 'x' ? 'vertical' : 'horizontal'}
      aria-label={label}
      aria-valuenow={Math.round(size)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      onDoubleClick={handleDoubleClick}
      title={`${label} — double-click to reset`}
      className={`group z-50 touch-none ${FOCUS_RING.INSET} ${positionClassName}`}
    >
      <div
        className={`${axis === 'x' ? 'mx-auto h-full w-px' : 'my-auto h-px w-full'} ${MOTION.COLORS} ${
          isDragging ? 'bg-accent' : 'bg-transparent group-hover:bg-accent/60'
        }`}
      />
    </div>
  )
}

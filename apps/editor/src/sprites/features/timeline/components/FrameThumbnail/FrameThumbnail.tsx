import { X } from 'lucide-react'

interface FrameThumbnailProps {
  readonly frameIndex: number
  readonly isActive: boolean
  readonly isSelected: boolean
  readonly isOnly: boolean
  readonly onRemove: (index: number) => void
}

function getThumbnailClass(isActive: boolean, isSelected: boolean): string {
  if (isActive) {
    return 'border-[#00f5ff] bg-[#091824] text-[#00f5ff] shadow-[0_0_8px_rgba(0,245,255,0.4)] ring-1 ring-[#00f5ff]/30'
  }
  if (isSelected) {
    return 'border-[#7c3aed] bg-[#160a28] text-[#c4b5fd] shadow-[0_0_6px_rgba(124,58,237,0.3)] ring-1 ring-[#7c3aed]/30'
  }
  return 'border-white/10 bg-[#0f1115] text-[#8888aa] hover:border-white/20 hover:text-[#aaaacc]'
}

export const FrameThumbnail = ({
  frameIndex,
  isActive,
  isSelected,
  isOnly,
  onRemove,
}: FrameThumbnailProps) => {
  return (
    <div
      className="group relative flex-shrink-0"
      data-frame-index={frameIndex}
    >
      {/* Visual button — interaction handled by strip container */}
      <div
        className={`relative flex h-12 w-12 flex-col items-center justify-center rounded border text-xs font-semibold transition-all select-none ${getThumbnailClass(isActive, isSelected)}`}
      >
        <span>{frameIndex + 1}</span>

        {/* Bottom indicator line */}
        <span
          className={`absolute bottom-1 left-3 right-3 h-0.5 rounded-full transition-all ${
            isActive
              ? 'bg-[#00f5ff] opacity-100'
              : isSelected
                ? 'bg-[#7c3aed] opacity-100'
                : 'opacity-0'
          }`}
        />
      </div>

      {/* Delete button — own click handler, stops propagation */}
      <button
        type="button"
        data-is-delete-btn="true"
        onClick={(e) => {
          e.stopPropagation()
          if (!isOnly) onRemove(frameIndex)
        }}
        onPointerDown={(e) => e.stopPropagation()} // prevent strip drag from starting here
        disabled={isOnly}
        className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-[#ff4466] text-white shadow-md transition-opacity group-hover:flex disabled:opacity-30 disabled:cursor-not-allowed"
        title="Delete frame"
      >
        <X size={10} />
      </button>
    </div>
  )
}

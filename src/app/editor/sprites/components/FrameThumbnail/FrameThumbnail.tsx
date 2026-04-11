interface FrameThumbnailProps {
  readonly frameIndex: number
  readonly isActive: boolean
  readonly onSelect: (index: number) => void
}

export const FrameThumbnail = ({ frameIndex, isActive, onSelect }: FrameThumbnailProps) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(frameIndex)}
      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded border text-xs transition-colors ${
        isActive
          ? 'border-[#00f5ff] bg-[#1a1a2e] text-[#00f5ff]'
          : 'border-white/10 bg-[#0f1115] text-[#8888aa] hover:border-white/20'
      }`}
    >
      {frameIndex + 1}
    </button>
  )
}


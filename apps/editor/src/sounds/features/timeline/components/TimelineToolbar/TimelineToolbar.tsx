import { Copy, Magnet, Scissors, Trash2 } from 'lucide-react'

import { ToolButton } from '../ToolButton/ToolButton'
import { ZoomControl } from '../ZoomControl/ZoomControl'
import { useTimelineToolbar } from './useTimelineToolbar.hook'

export function TimelineToolbar() {
  const {
    snapEnabled,
    canSplit,
    hasSelection,
    handleSplit,
    handleDuplicate,
    handleDelete,
    handleToggleSnap,
  } = useTimelineToolbar()

  return (
    <div
      role="toolbar"
      aria-label="Timeline tools"
      className="flex h-13 shrink-0 items-center gap-1 border-b border-line px-6"
    >
      <ToolButton
        icon={Scissors}
        label="Split"
        keyLabel="S"
        keyShortcuts="S"
        disabled={!canSplit}
        onClick={handleSplit}
      />
      <ToolButton
        icon={Copy}
        label="Duplicate"
        keyLabel="D"
        keyShortcuts="D"
        disabled={!hasSelection}
        onClick={handleDuplicate}
      />
      <ToolButton
        icon={Trash2}
        label="Delete"
        keyLabel="Del"
        keyShortcuts="Delete Backspace"
        disabled={!hasSelection}
        onClick={handleDelete}
      />
      <span role="separator" aria-orientation="vertical" className="mx-1 h-5 w-px bg-line-strong" />
      <ToolButton
        icon={Magnet}
        label="Snap"
        keyLabel="N"
        keyShortcuts="N"
        pressed={snapEnabled}
        onClick={handleToggleSnap}
      />
      <span className="flex-1" />
      <ZoomControl />
    </div>
  )
}

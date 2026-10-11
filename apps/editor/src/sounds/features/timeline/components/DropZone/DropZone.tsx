import { AudioLines, Loader2, Upload } from 'lucide-react'

import { useDropZone } from './useDropZone.hook'
import { DISABLED_STATE, FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

interface DropZoneProps {
  /** No clips anywhere: the zone becomes the timeline's empty state. */
  isEmpty: boolean
}

const DRAG_OVER =
  'data-drag-over:border-solid data-drag-over:border-accent data-drag-over:bg-accent/5 data-drag-over:text-ink'

export function DropZone({ isEmpty }: DropZoneProps) {
  const {
    inputRef,
    errorId,
    error,
    isDragOver,
    isImporting,
    accept,
    handleOpenPicker,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useDropZone()

  return (
    <div className="flex flex-1 flex-col gap-1">
      <button
        type="button"
        onClick={handleOpenPicker}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        disabled={isImporting}
        aria-busy={isImporting}
        aria-describedby={error ? errorId : undefined}
        data-drag-over={isDragOver || undefined}
        className={
          isEmpty
            ? `group flex flex-1 flex-col items-center justify-center gap-2 rounded border border-dashed border-line-strong px-6 text-center ${DRAG_OVER} ${MOTION.COLORS} ${FOCUS_RING.SURFACE} ${DISABLED_STATE}`
            : `group flex flex-1 items-center justify-center gap-2 rounded border border-dashed border-line-strong text-xs text-muted hover:border-accent/40 hover:text-ink ${DRAG_OVER} ${MOTION.COLORS} ${FOCUS_RING.SURFACE} ${DISABLED_STATE}`
        }
      >
        {isImporting ? (
          <Loader2 className="size-3.5 animate-spin text-muted motion-reduce:animate-none" aria-hidden />
        ) : isEmpty ? (
          <AudioLines className="size-6 text-subtle group-data-drag-over:text-accent" aria-hidden />
        ) : (
          <Upload className="size-3.25 group-data-drag-over:text-accent" aria-hidden />
        )}
        {isEmpty ? (
          <>
            <span className="text-ui font-medium text-ink">Your timeline is empty</span>
            <span className="max-w-xs text-xs text-balance text-muted">
              Drag sounds from the library, or press + on a sound to add it.
            </span>
            <span className="text-xs font-medium text-accent group-hover:underline">
              Import an audio file
            </span>
          </>
        ) : (
          'Drag a sound from the library here, or import an audio file'
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        tabIndex={-1}
        aria-hidden
        className="hidden"
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

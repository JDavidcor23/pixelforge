import { Loader2, Upload } from 'lucide-react'

import { useImportRow } from './useImportRow.hook'
import { DISABLED_STATE, FOCUS_RING } from '@/constants/focus-ring'

export function ImportRow() {
  const { inputRef, errorId, error, isImporting, accept, handleOpenPicker, handleFileChange } =
    useImportRow()

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={handleOpenPicker}
        disabled={isImporting}
        aria-busy={isImporting}
        aria-describedby={error ? errorId : undefined}
        className={`group flex w-full items-center gap-2 px-4 py-3 text-left text-xs text-muted hover:bg-hover hover:text-ink ${DISABLED_STATE} ${FOCUS_RING.INSET}`}
      >
        {isImporting ? (
          <Loader2 className="size-3.5 animate-spin text-muted motion-reduce:animate-none" aria-hidden />
        ) : (
          <Upload className="size-3.5 text-muted" aria-hidden />
        )}
        Import a WAV or MP3 file
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
        <p id={errorId} role="alert" className="px-4 pb-3 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

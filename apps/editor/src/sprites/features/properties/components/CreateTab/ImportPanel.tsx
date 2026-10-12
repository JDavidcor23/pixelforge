import { Upload } from 'lucide-react'

import { useImportPanel } from './useImportPanel.hook'
import { AI_SPRITE_SIZES, SPRITE_IMPORT_ACCEPT, SPRITE_IMPORT_MAX_FRAMES, SPRITE_IMPORT_MIN_FRAMES } from '@/constants'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

const FIELD = 'w-full rounded border border-line bg-base px-2 py-2 text-xs text-ink outline-none focus:border-accent'

export const ImportPanel = () => {
  const {
    frameCount,
    setFrameCount,
    size,
    setSize,
    isSheet,
    isImporting,
    error,
    fileInputRef,
    handleOpenFilePicker,
    handleFileSelected,
  } = useImportPanel()

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">
        Upload a PNG — for example a sprite you downloaded and edited by hand. You declare how many
        frames it holds and at what resolution it fits; the editor obeys, it does not guess.
      </p>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-2xs text-subtle">Frames</label>
          <input
            type="number"
            min={SPRITE_IMPORT_MIN_FRAMES}
            max={SPRITE_IMPORT_MAX_FRAMES}
            value={frameCount}
            onChange={(e) => setFrameCount(Number(e.target.value))}
            onKeyDown={(e) => e.stopPropagation()}
            className={FIELD}
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-2xs text-subtle">Resolution</label>
          <select value={size} onChange={(e) => setSize(Number(e.target.value))} className={FIELD}>
            {AI_SPRITE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}x{s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-sm border border-danger/40 bg-danger/10 p-2">
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={SPRITE_IMPORT_ACCEPT}
        onChange={handleFileSelected}
        className="hidden"
      />

      <button
        type="button"
        onClick={handleOpenFilePicker}
        disabled={isImporting}
        className={`flex h-9 w-full items-center justify-center gap-2 rounded bg-accent text-xs font-semibold text-on-accent hover:bg-accent-strong ${MOTION.PRESS} ${FOCUS_RING.SURFACE} disabled:pointer-events-none disabled:opacity-40`}
      >
        {isImporting ? (
          <>
            <div className="size-3 animate-spin rounded-full border-2 border-on-accent border-t-transparent motion-reduce:animate-none" />
            Importing…
          </>
        ) : (
          <>
            <Upload size={14} aria-hidden />
            {isSheet ? 'Import Sheet' : 'Import Sprite'}
          </>
        )}
      </button>
    </div>
  )
}

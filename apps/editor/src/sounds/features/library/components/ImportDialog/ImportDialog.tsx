'use client'

import { X, Loader2 } from 'lucide-react'
import type { AudioAssetTag } from '@/app/editor/types/audio'
import { useImportDialog } from './useImportDialog.hook'

interface ImportDialogProps {
  audioBlob: Blob
  audioDuration: number
  onClose: () => void
}

const TAG_CHOICES: { label: string; value: AudioAssetTag }[] = [
  { label: 'SFX', value: 'sfx' },
  { label: 'Music', value: 'music' },
  { label: 'Dialog', value: 'dialog' },
]

export function ImportDialog({ audioBlob, audioDuration, onClose }: ImportDialogProps) {
  const {
    name,
    setName,
    selectedTags,
    handleTagToggle,
    spriteId,
    setSpriteId,
    isUploading,
    error,
    isValid,
    handleSave,
  } = useImportDialog({ audioBlob, audioDuration, onClose })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Import audio asset"
    >
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Save Audio Asset</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="asset-name" className="mb-1.5 block text-sm font-medium text-zinc-300">
              Name
            </label>
            <input
              id="asset-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Laser Shot, Jump SFX..."
              aria-required="true"
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-zinc-300">Tags</span>
            <div className="flex gap-3">
              {TAG_CHOICES.map((choice) => (
                <label key={choice.value} className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(choice.value)}
                    onChange={() => handleTagToggle(choice.value)}
                    aria-label={`Tag: ${choice.label}`}
                    className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-800 text-violet-600 focus:ring-violet-500"
                  />
                  {choice.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="sprite-id" className="mb-1.5 block text-sm font-medium text-zinc-300">
              Associate with Sprite (optional)
            </label>
            <input
              id="sprite-id"
              type="text"
              value={spriteId}
              onChange={(e) => setSpriteId(e.target.value)}
              placeholder="Sprite ID or leave empty"
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isValid || isUploading}
              aria-label="Save audio asset"
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50 disabled:hover:bg-violet-600"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

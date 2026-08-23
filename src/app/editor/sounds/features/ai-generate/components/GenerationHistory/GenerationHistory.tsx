'use client'

import { Wand2, Music, Mic, Clock } from 'lucide-react'
import type { ElevenLabsMode } from '@/app/editor/types/audio'
import { useGenerationHistory } from './useGenerationHistory.hook'

const MODE_ICONS: Record<ElevenLabsMode, React.ReactNode> = {
  sfx: <Wand2 className="h-4 w-4 text-violet-400" />,
  music: <Music className="h-4 w-4 text-emerald-400" />,
  tts: <Mic className="h-4 w-4 text-sky-400" />,
}

function formatRelativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

function truncatePrompt(prompt: string, maxLength: number = 60): string {
  if (prompt.length <= maxLength) return prompt
  return `${prompt.slice(0, maxLength)}...`
}

export function GenerationHistory() {
  const { history, isEmpty, handleSelectGeneration } = useGenerationHistory()

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-gray-900 p-6">
        <Clock className="h-8 w-8 text-gray-600" />
        <p className="text-sm text-gray-500">No generations yet</p>
        <p className="text-xs text-gray-600">
          Generated audio will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-gray-900 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        Generation History
      </h3>
      <ul
        className="flex max-h-64 flex-col gap-1 overflow-y-auto"
        aria-label="Generation history list"
      >
        {history.map((record) => (
          <li key={record.id}>
            <button
              type="button"
              onClick={() => handleSelectGeneration(record.resultAssetId)}
              aria-label={`Load generation: ${truncatePrompt(record.prompt, 40)}`}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-800"
            >
              <span className="shrink-0">{MODE_ICONS[record.mode]}</span>
              <span className="flex-1 truncate text-sm text-gray-200">
                {truncatePrompt(record.prompt)}
              </span>
              <span className="shrink-0 text-xs text-gray-500">
                {formatRelativeTime(record.timestamp)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

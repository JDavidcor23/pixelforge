import { ArrowUp, MessageSquare } from 'lucide-react'

import { BuildEmptyState } from '../../BuildEmptyState/BuildEmptyState'
import { BUILD_SCREEN_COPY } from '@/constants/build-screen'

/** Phase 1: layout only — the chat is not wired yet, so the input and send button stay disabled. */
export function ChatTab() {
  return (
    <div role="tabpanel" className="flex min-h-0 flex-1 flex-col">
      <BuildEmptyState
        icon={MessageSquare}
        title={BUILD_SCREEN_COPY.CHAT_EMPTY_TITLE}
        hint={BUILD_SCREEN_COPY.CHAT_EMPTY_HINT}
      />

      <div className="flex items-center gap-2 bg-raised p-3">
        <div className="flex flex-1 items-center rounded-lg bg-hover px-3 py-2">
          <input
            type="text"
            disabled
            placeholder={BUILD_SCREEN_COPY.CHAT_INPUT_PLACEHOLDER}
            aria-label={BUILD_SCREEN_COPY.CHAT_INPUT_PLACEHOLDER}
            className="w-full bg-transparent text-ui text-ink outline-none placeholder:text-subtle disabled:cursor-not-allowed"
          />
        </div>
        <button
          type="button"
          disabled
          aria-label={BUILD_SCREEN_COPY.CHAT_SEND}
          title={BUILD_SCREEN_COPY.CHAT_SEND}
          className="flex size-8 items-center justify-center rounded-lg bg-accent disabled:opacity-50"
        >
          <ArrowUp className="size-4 text-on-accent" aria-hidden />
        </button>
      </div>
    </div>
  )
}

import { ChatTab } from './ChatTab/ChatTab'
import { LibraryTab } from './LibraryTab/LibraryTab'
import { useBuildChatPanel } from './useBuildChatPanel.hook'
import { BUILD_SCREEN_COPY } from '@/constants/build-screen'
import { FOCUS_RING } from '@/constants/focus-ring'

const TAB = `flex h-10 items-center px-4 text-ui text-muted aria-selected:border-b-2 aria-selected:border-accent aria-selected:font-semibold aria-selected:text-accent ${FOCUS_RING.INSET}`

export function BuildChatPanel() {
  const { tabs, isChatTab } = useBuildChatPanel()

  return (
    <section className="flex w-105 shrink-0 flex-col bg-surface">
      <div
        role="tablist"
        aria-label={BUILD_SCREEN_COPY.PANEL_TABS_LABEL}
        className="flex h-10 shrink-0 bg-surface"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.isActive}
            onClick={tab.select}
            className={TAB}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isChatTab ? <ChatTab /> : <LibraryTab />}
    </section>
  )
}

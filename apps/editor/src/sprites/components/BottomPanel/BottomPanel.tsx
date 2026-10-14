import { FolderOpen, GalleryHorizontal, Search } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { useBottomPanel } from './useBottomPanel.hook'
import { AssetsPanel } from '@/sprites/features/assets'
import { TimelineBar } from '@/sprites/features/timeline'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

const ICON_MAP: Record<string, LucideIcon> = { GalleryHorizontal, FolderOpen }

export const BottomPanel = () => {
  const {
    tabs,
    activeTab,
    setActiveTab,
    registerTabRef,
    handleTabKeyDown,
    search,
    handleSearchChange,
  } = useBottomPanel()

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-surface">
      <div
        role="tablist"
        aria-label="Bottom panel"
        className="flex h-9 shrink-0 items-center gap-1 border-b border-line px-2"
      >
        {tabs.map((tab, index) => {
          const Icon = ICON_MAP[tab.iconName]
          const isActive = tab.id === activeTab

          return (
            <button
              key={tab.id}
              ref={registerTabRef(tab.id)}
              type="button"
              role="tab"
              id={`bottom-panel-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`bottom-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={`flex h-full items-center gap-1.5 border-b-2 px-3 font-mono text-3xs font-medium uppercase tracking-wider ${MOTION.COLORS} ${FOCUS_RING.SURFACE} ${
                isActive ? 'border-accent text-ink' : 'border-transparent text-subtle hover:text-muted'
              }`}
            >
              {Icon && <Icon size={13} className={isActive ? 'text-accent' : 'text-subtle'} aria-hidden />}
              {tab.label}
            </button>
          )
        })}

        <div className="flex-1" />

        {activeTab === 'assets' && (
          <div className="relative">
            <Search
              size={12}
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-subtle"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search assets"
              aria-label="Search assets"
              className="h-6.5 w-55 rounded border border-line bg-sunken pl-6.5 pr-2 text-2xs text-ink placeholder:text-subtle outline-none focus:border-accent"
            />
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1">
        <div
          role="tabpanel"
          id="bottom-panel-timeline"
          aria-labelledby="bottom-panel-tab-timeline"
          hidden={activeTab !== 'timeline'}
          className="h-full"
        >
          {activeTab === 'timeline' && <TimelineBar />}
        </div>
        <div
          role="tabpanel"
          id="bottom-panel-assets"
          aria-labelledby="bottom-panel-tab-assets"
          hidden={activeTab !== 'assets'}
          className="h-full"
        >
          {activeTab === 'assets' && <AssetsPanel search={search} />}
        </div>
      </div>
    </div>
  )
}

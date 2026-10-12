import { Film, Sparkles, SlidersHorizontal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { AnimateTab } from '../AnimateTab/AnimateTab'
import { CreateTab } from '../CreateTab/CreateTab'
import { PropertiesTab } from '../PropertiesTab/PropertiesTab'
import { useInspector } from './useInspector.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import type { InspectorTabId } from '@/types'

const ICON_MAP: Record<string, LucideIcon> = { SlidersHorizontal, Sparkles, Film }

const TAB_PANELS: Record<InspectorTabId, React.ReactNode> = {
  properties: <PropertiesTab />,
  create: <CreateTab />,
  animate: <AnimateTab />,
}

export const Inspector = () => {
  const { tabs, activeTab, setActiveTab, registerTabRef, handleTabKeyDown, contentRef } = useInspector()

  return (
    <div className="flex h-full flex-col border-l border-line bg-surface">
      <div role="tablist" aria-label="Inspector" className="flex h-9 shrink-0 items-center gap-1 border-b border-line px-2">
        {tabs.map((tab, index) => {
          const Icon = ICON_MAP[tab.iconName]
          const isActive = tab.id === activeTab

          return (
            <button
              key={tab.id}
              ref={registerTabRef(tab.id)}
              type="button"
              role="tab"
              id={`inspector-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`inspector-panel-${tab.id}`}
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
      </div>

      <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto p-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`inspector-panel-${tab.id}`}
            aria-labelledby={`inspector-tab-${tab.id}`}
            hidden={tab.id !== activeTab}
          >
            {tab.id === activeTab && TAB_PANELS[tab.id]}
          </div>
        ))}
      </div>
    </div>
  )
}

import type { LeftSidebarTab } from '@/types'
import { LayerPanel } from '../../features/layers'
import { useLeftSidebar } from './useLeftSidebar.hook'

const TABS: readonly { readonly id: LeftSidebarTab; readonly label: string }[] = [
  { id: 'layers', label: 'Layers' },
  { id: 'assets', label: 'Assets' },
  { id: 'code', label: 'Code' },
] as const

export const LeftSidebar = () => {
  const { activeTab, handleTabChange } = useLeftSidebar()

  return (
    <div className="flex h-full flex-col border-r border-line-strong bg-surface">
      <div className="flex border-b border-line-strong">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 px-3 py-2 text-xs transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-accent text-accent'
                : 'text-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === 'layers' && <LayerPanel />}
        {activeTab === 'assets' && (
          <div className="p-4 text-xs text-muted">Assets library coming soon</div>
        )}
        {activeTab === 'code' && (
          <div className="p-4 text-xs text-muted">Code editor coming soon</div>
        )}
      </div>
    </div>
  )
}

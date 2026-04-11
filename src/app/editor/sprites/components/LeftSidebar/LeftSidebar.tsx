'use client'

import type { LeftSidebarTab } from '@/app/editor/types'
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
    <div className="flex h-full flex-col border-r border-white/10 bg-[#0f1115]">
      <div className="flex border-b border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 px-3 py-2 text-xs transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-[#00f5ff] text-[#00f5ff]'
                : 'text-[#8888aa] hover:text-[#ededed]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === 'layers' && <LayerPanel />}
        {activeTab === 'assets' && (
          <div className="p-4 text-xs text-[#8888aa]">Assets library coming soon</div>
        )}
        {activeTab === 'code' && (
          <div className="p-4 text-xs text-[#8888aa]">Code editor coming soon</div>
        )}
      </div>
    </div>
  )
}


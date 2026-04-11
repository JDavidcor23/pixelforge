'use client'

import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { LeftSidebar } from '../LeftSidebar/LeftSidebar'
import { CanvasArea, CanvasOverlay } from '../../features/canvas'
import { BottomToolbar } from '../../features/tools'
import { RightSidebar } from '../../features/properties'
import { TimelineBar } from '../../features/timeline'
import { 
  useUIState, 
  useToggleLeftSidebar, 
  useToggleRightSidebar, 
  useToggleTimeline, 
  useToggleToolbar 
} from '../../hooks/useSpriteEditorStore.hook'

export const SpriteEditorLayout = () => {
  const ui = useUIState()
  const toggleLeft = useToggleLeftSidebar()
  const toggleRight = useToggleRightSidebar()
  const toggleTimeline = useToggleTimeline()
  const toggleToolbar = useToggleToolbar()

  const leftWidth = ui.leftSidebarOpen ? '280px' : '0px'
  const rightWidth = ui.rightSidebarOpen ? '280px' : '0px'
  const timelineHeight = ui.timelineOpen ? '96px' : '0px'

  return (
    <div 
      className="grid h-screen w-screen overflow-hidden bg-[#0a0a0f] transition-[grid-template-columns,grid-template-rows] duration-300 ease-in-out"
      style={{ 
        gridTemplateColumns: `${leftWidth} 1fr ${rightWidth}`,
        gridTemplateRows: `1fr ${timelineHeight}`
      }}
    >
      {/* Left Sidebar Wrap */}
      <div className="relative row-span-1 min-h-0 overflow-hidden border-r border-white/5 bg-[#0f1115]">
        <div 
          className="h-full w-[280px] transition-opacity duration-300"
          style={{ opacity: ui.leftSidebarOpen ? 1 : 0 }}
        >
          <LeftSidebar />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative row-span-1 min-h-0 overflow-hidden bg-[#0a0f14]">
        <CanvasArea />
        <CanvasOverlay />
        
        {/* Sidebar Toggles */}
        <button
          onClick={toggleLeft}
          className={`absolute left-0 top-1/2 z-[60] flex h-12 w-5 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-white/10 bg-[#1a1a2e]/90 text-[#8888aa] backdrop-blur-sm transition-all hover:w-6 hover:text-[#00f5ff] ${ui.leftSidebarOpen ? 'opacity-40 hover:opacity-100' : 'opacity-100'}`}
          title={ui.leftSidebarOpen ? 'Collapse Left Sidebar' : 'Expand Left Sidebar'}
        >
          {ui.leftSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        <button
          onClick={toggleRight}
          className={`absolute right-0 top-1/2 z-[60] flex h-12 w-5 -translate-y-1/2 items-center justify-center rounded-l-lg border border-r-0 border-white/10 bg-[#1a1a2e]/90 text-[#8888aa] backdrop-blur-sm transition-all hover:w-6 hover:text-[#00f5ff] ${ui.rightSidebarOpen ? 'opacity-40 hover:opacity-100' : 'opacity-100'}`}
          title={ui.rightSidebarOpen ? 'Collapse Right Sidebar' : 'Expand Right Sidebar'}
        >
          {ui.rightSidebarOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Timeline Toggle (only visible when floating or as a handle) */}
        {!ui.timelineOpen && (
          <button
            onClick={toggleTimeline}
            className="absolute bottom-0 left-1/2 z-[60] flex h-5 w-12 -translate-x-1/2 items-center justify-center rounded-t-lg border border-b-0 border-white/10 bg-[#1a1a2e]/90 text-[#8888aa] backdrop-blur-sm transition-all hover:h-6 hover:text-[#00f5ff]"
            title="Expand Timeline"
          >
            <ChevronUp size={14} />
          </button>
        )}
        
        {/* Toolbar Wrap */}
        {ui.toolbarOpen ? (
          <BottomToolbar />
        ) : (
          <button
            onClick={toggleToolbar}
            className="absolute bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-[#1a1a2e]/90 p-2 text-[#8888aa] backdrop-blur transition-all hover:text-[#00f5ff]"
            title="Expand Tools"
          >
            <ChevronUp size={20} />
          </button>
        )}
      </div>

      {/* Right Sidebar Wrap */}
      <div className="relative row-span-1 min-h-0 overflow-hidden border-l border-white/5 bg-[#0f1115]">
        <div 
          className="h-full w-[280px] transition-opacity duration-300"
          style={{ opacity: ui.rightSidebarOpen ? 1 : 0 }}
        >
          <RightSidebar />
        </div>
      </div>

      {/* Timeline Wrap */}
      <div className="relative col-span-3 border-t border-white/5 bg-[#0f1115]">
        <div 
          className="h-[96px] w-full transition-opacity duration-300"
          style={{ opacity: ui.timelineOpen ? 1 : 0 }}
        >
          <TimelineBar />
        </div>
        {ui.timelineOpen && (
          <button
            onClick={toggleTimeline}
            className="absolute -top-3 left-1/2 z-[60] flex h-6 w-12 -translate-x-1/2 items-center justify-center rounded-t-lg border border-b-0 border-white/10 bg-[#1a1a2e] text-[#8888aa] transition-colors hover:bg-[#252540] hover:text-[#00f5ff]"
            title="Collapse Timeline"
          >
            <ChevronDown size={14} />
          </button>
        )}
      </div>
    </div>
  )
}


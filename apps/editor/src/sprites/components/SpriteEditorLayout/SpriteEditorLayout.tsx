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
  useToggleToolbar,
  useDocStatus,
} from '../../hooks/useSpriteEditorStore.hook'
import { useDocumentPersistence } from '@/hooks/useDocumentPersistence.hook'

const RAIL_WIDTH = '280px'
const TIMELINE_HEIGHT = '96px'
const COLLAPSED = '0px'

/** Shared treatment for the floating handles that collapse and expand a rail. */
const HANDLE_BASE =
  'absolute z-[60] flex items-center justify-center border border-line-strong bg-hover/90 text-muted backdrop-blur-sm transition-all hover:text-accent'

export const SpriteEditorLayout = () => {
  const ui = useUIState()
  const toggleLeft = useToggleLeftSidebar()
  const toggleRight = useToggleRightSidebar()
  const toggleTimeline = useToggleTimeline()
  const toggleToolbar = useToggleToolbar()
  const docStatus = useDocStatus()
  const { isPersistent } = useDocumentPersistence()

  const leftWidth = ui.leftSidebarOpen ? RAIL_WIDTH : COLLAPSED
  const rightWidth = ui.rightSidebarOpen ? RAIL_WIDTH : COLLAPSED
  const timelineHeight = ui.timelineOpen ? TIMELINE_HEIGHT : COLLAPSED

  return (
    <div
      className="grid h-full w-full overflow-hidden bg-base transition-[grid-template-columns,grid-template-rows] duration-300 ease-in-out"
      style={{
        gridTemplateColumns: `${leftWidth} 1fr ${rightWidth}`,
        gridTemplateRows: `1fr ${timelineHeight}`,
      }}
    >
      {/* Left Sidebar Wrap */}
      <div className="relative row-span-1 min-h-0 overflow-hidden border-r border-line bg-surface">
        <div
          className="h-full transition-opacity duration-300"
          style={{ width: RAIL_WIDTH, opacity: ui.leftSidebarOpen ? 1 : 0 }}
        >
          <LeftSidebar />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative row-span-1 min-h-0 overflow-hidden bg-base">
        {docStatus === 'ready' ? (
          <>
            <CanvasArea />
            <CanvasOverlay />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted">
            Restoring your draft…
          </div>
        )}

        {docStatus === 'ready' && !isPersistent && (
          <div className="absolute left-1/2 top-2 z-50 -translate-x-1/2 rounded-lg border border-line-strong bg-surface/90 px-3 py-1 text-xs text-muted backdrop-blur-sm">
            Drafts are not being saved — local storage is unavailable.
          </div>
        )}

        {/* Sidebar Toggles */}
        <button
          onClick={toggleLeft}
          className={`${HANDLE_BASE} left-0 top-1/2 h-12 w-5 -translate-y-1/2 rounded-r-lg border-l-0 hover:w-6 ${
            ui.leftSidebarOpen ? 'opacity-40 hover:opacity-100' : 'opacity-100'
          }`}
          title={ui.leftSidebarOpen ? 'Collapse Left Sidebar' : 'Expand Left Sidebar'}
        >
          {ui.leftSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        <button
          onClick={toggleRight}
          className={`${HANDLE_BASE} right-0 top-1/2 h-12 w-5 -translate-y-1/2 rounded-l-lg border-r-0 hover:w-6 ${
            ui.rightSidebarOpen ? 'opacity-40 hover:opacity-100' : 'opacity-100'
          }`}
          title={ui.rightSidebarOpen ? 'Collapse Right Sidebar' : 'Expand Right Sidebar'}
        >
          {ui.rightSidebarOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Timeline Toggle (only visible when floating or as a handle) */}
        {!ui.timelineOpen && (
          <button
            onClick={toggleTimeline}
            className={`${HANDLE_BASE} bottom-0 left-1/2 h-5 w-12 -translate-x-1/2 rounded-t-lg border-b-0 hover:h-6`}
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
            className={`${HANDLE_BASE} bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full p-2`}
            title="Expand Tools"
          >
            <ChevronUp size={20} />
          </button>
        )}
      </div>

      {/* Right Sidebar Wrap */}
      <div className="relative row-span-1 min-h-0 overflow-hidden border-l border-line bg-surface">
        <div
          className="h-full transition-opacity duration-300"
          style={{ width: RAIL_WIDTH, opacity: ui.rightSidebarOpen ? 1 : 0 }}
        >
          <RightSidebar />
        </div>
      </div>

      {/* Timeline Wrap */}
      <div className="relative col-span-3 border-t border-line bg-surface">
        <div
          className="w-full transition-opacity duration-300"
          style={{ height: TIMELINE_HEIGHT, opacity: ui.timelineOpen ? 1 : 0 }}
        >
          <TimelineBar />
        </div>
        {ui.timelineOpen && (
          <button
            onClick={toggleTimeline}
            className="absolute -top-6 left-1/2 z-[60] flex h-6 w-12 -translate-x-1/2 items-center justify-center rounded-t-lg border border-b-0 border-line-strong bg-surface text-muted transition-colors hover:bg-hover hover:text-accent"
            title="Collapse Timeline"
          >
            <ChevronDown size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

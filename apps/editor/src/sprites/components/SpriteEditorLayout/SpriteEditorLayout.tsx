import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { LeftSidebar } from '../LeftSidebar/LeftSidebar'
import { TopBar } from '../TopBar/TopBar'
import { BottomPanel } from '../BottomPanel/BottomPanel'
import { ResizeHandle } from '../ResizeHandle/ResizeHandle'
import { CanvasArea, CanvasOverlay } from '../../features/canvas'
import { BottomToolbar } from '../../features/tools'
import { Inspector } from '../../features/properties'
import { useSpriteEditorLayout } from './useSpriteEditorLayout.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import { RESIZABLE_PANELS } from '@/constants'

/** Shared treatment for the floating handles that collapse and expand a rail. */
const HANDLE_BASE =
  `absolute z-[60] flex items-center justify-center border border-line-strong bg-hover/90 text-muted backdrop-blur-sm transition-all hover:text-accent ${FOCUS_RING.SURFACE}`

const FADE = 'transition-opacity duration-300 motion-reduce:transition-none'

export const SpriteEditorLayout = () => {
  const {
    ui,
    toggleLeft,
    toggleRight,
    toggleBottomPanel,
    toggleToolbar,
    docStatus,
    isPersistent,
    containerRef,
    leftWidthPx,
    rightWidthPx,
    bottomHeightPx,
    leftSidebarWidth,
    rightSidebarWidth,
    bottomPanelHeight,
    leftMax,
    rightMax,
    bottomMax,
    setLeftSidebarWidth,
    setRightSidebarWidth,
    setBottomPanelHeight,
    isResizing,
    handleResizeStart,
    handleResizeEnd,
  } = useSpriteEditorLayout()

  const gridTransitionClass = isResizing
    ? 'transition-none'
    : 'transition-[grid-template-columns] duration-300 ease-in-out motion-reduce:transition-none'

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col overflow-hidden bg-base">
      <TopBar />

      <div
        className={`grid min-h-0 flex-1 overflow-hidden ${gridTransitionClass}`}
        style={{ gridTemplateColumns: `${leftWidthPx}px 1fr ${rightWidthPx}px` }}
      >
        {/* Left Sidebar Wrap */}
        <div className="relative min-h-0 overflow-hidden border-r border-line bg-surface">
          <div
            className={`h-full ${FADE}`}
            style={{ width: `${leftSidebarWidth}px`, opacity: ui.leftSidebarOpen ? 1 : 0 }}
          >
            <LeftSidebar />
          </div>
          {ui.leftSidebarOpen && (
            <ResizeHandle
              axis="x"
              invert={false}
              size={leftSidebarWidth}
              min={RESIZABLE_PANELS.LEFT.MIN}
              max={leftMax}
              defaultSize={RESIZABLE_PANELS.LEFT.DEFAULT}
              onResize={setLeftSidebarWidth}
              onDragStart={handleResizeStart}
              onDragEnd={handleResizeEnd}
              label="Resize layers panel"
              positionClassName="absolute right-0 top-0 h-full w-1.5 cursor-col-resize"
            />
          )}
        </div>

        {/* Main Content Area */}
        <div className="relative min-h-0 overflow-hidden bg-base">
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
            aria-label={ui.leftSidebarOpen ? 'Collapse Left Sidebar' : 'Expand Left Sidebar'}
            className={`${HANDLE_BASE} left-0 top-1/2 h-12 w-5 -translate-y-1/2 rounded-r-lg border-l-0 hover:w-6 ${
              ui.leftSidebarOpen ? 'opacity-40 hover:opacity-100' : 'opacity-100'
            }`}
            title={ui.leftSidebarOpen ? 'Collapse Left Sidebar' : 'Expand Left Sidebar'}
          >
            {ui.leftSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>

          <button
            onClick={toggleRight}
            aria-label={ui.rightSidebarOpen ? 'Collapse Inspector' : 'Expand Inspector'}
            className={`${HANDLE_BASE} right-0 top-1/2 h-12 w-5 -translate-y-1/2 rounded-l-lg border-r-0 hover:w-6 ${
              ui.rightSidebarOpen ? 'opacity-40 hover:opacity-100' : 'opacity-100'
            }`}
            title={ui.rightSidebarOpen ? 'Collapse Inspector' : 'Expand Inspector'}
          >
            {ui.rightSidebarOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Bottom panel toggle (only visible when collapsed) */}
          {!ui.timelineOpen && (
            <button
              onClick={toggleBottomPanel}
              aria-label="Expand Bottom Panel"
              className={`${HANDLE_BASE} bottom-0 left-1/2 h-5 w-12 -translate-x-1/2 rounded-t-lg border-b-0 hover:h-6`}
              title="Expand Bottom Panel"
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
              aria-label="Expand Tools"
              className={`${HANDLE_BASE} bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full p-2`}
              title="Expand Tools"
            >
              <ChevronUp size={20} />
            </button>
          )}
        </div>

        {/* Inspector Wrap */}
        <div className="relative min-h-0 overflow-hidden border-l border-line bg-surface">
          {ui.rightSidebarOpen && (
            <ResizeHandle
              axis="x"
              invert
              size={rightSidebarWidth}
              min={RESIZABLE_PANELS.RIGHT.MIN}
              max={rightMax}
              defaultSize={RESIZABLE_PANELS.RIGHT.DEFAULT}
              onResize={setRightSidebarWidth}
              onDragStart={handleResizeStart}
              onDragEnd={handleResizeEnd}
              label="Resize inspector panel"
              positionClassName="absolute left-0 top-0 h-full w-1.5 cursor-col-resize"
            />
          )}
          <div
            className={`h-full ${FADE}`}
            style={{ width: `${rightSidebarWidth}px`, opacity: ui.rightSidebarOpen ? 1 : 0 }}
          >
            <Inspector />
          </div>
        </div>
      </div>

      {/* Bottom Panel Wrap */}
      <div className="relative shrink-0 border-t border-line bg-surface">
        {ui.timelineOpen && (
          <ResizeHandle
            axis="y"
            invert
            size={bottomPanelHeight}
            min={RESIZABLE_PANELS.BOTTOM.MIN}
            max={bottomMax}
            defaultSize={RESIZABLE_PANELS.BOTTOM.DEFAULT}
            onResize={setBottomPanelHeight}
            onDragStart={handleResizeStart}
            onDragEnd={handleResizeEnd}
            label="Resize bottom panel"
            positionClassName="absolute left-0 top-0 h-1.5 w-full cursor-row-resize"
          />
        )}
        <div
          className={`w-full overflow-hidden ${FADE}`}
          style={{ height: `${bottomHeightPx}px`, opacity: ui.timelineOpen ? 1 : 0 }}
        >
          <BottomPanel />
        </div>
        {ui.timelineOpen && (
          <button
            onClick={toggleBottomPanel}
            aria-label="Collapse Bottom Panel"
            className={`absolute -top-6 left-1/2 z-[60] flex h-6 w-12 -translate-x-1/2 items-center justify-center rounded-t-lg border border-b-0 border-line-strong bg-surface text-muted hover:bg-hover hover:text-accent ${MOTION.COLORS} ${FOCUS_RING.SURFACE}`}
            title="Collapse Bottom Panel"
          >
            <ChevronDown size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

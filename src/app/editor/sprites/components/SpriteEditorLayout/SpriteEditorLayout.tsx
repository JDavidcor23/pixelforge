import { LeftSidebar } from '../LeftSidebar/LeftSidebar'
import { CanvasArea, CanvasOverlay } from '../../features/canvas'
import { BottomToolbar } from '../../features/tools'
import { RightSidebar } from '../../features/properties'
import { TimelineBar } from '../../features/timeline'

export const SpriteEditorLayout = () => {
  return (
    <div className="grid h-screen w-screen grid-cols-[280px_1fr_280px] grid-rows-[1fr_auto] overflow-hidden">
      <div className="row-span-1 min-h-0 overflow-hidden">
        <LeftSidebar />
      </div>
      <div className="relative row-span-1 min-h-0 overflow-hidden">
        <CanvasArea />
        <CanvasOverlay />
        <BottomToolbar />
      </div>
      <div className="row-span-1 min-h-0 overflow-hidden">
        <RightSidebar />
      </div>
      <div className="col-span-3">
        <TimelineBar />
      </div>
    </div>
  )
}


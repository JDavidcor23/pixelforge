import { ClipInspector } from '../ClipInspector/ClipInspector'
import { TimelineToolbar } from '../TimelineToolbar/TimelineToolbar'
import { TimelineTopBar } from '../TimelineTopBar/TimelineTopBar'
import { TimelineTracks } from '../TimelineTracks/TimelineTracks'
import { TimelineTransport } from '../TimelineTransport/TimelineTransport'
import { TipBar } from '../TipBar/TipBar'
import { useTimelineEditor } from './useTimelineEditor.hook'

export function TimelineEditor() {
  const { playback, isShortcutsOpen, handleToggleShortcuts, handleCloseShortcuts } =
    useTimelineEditor()

  return (
    <section aria-label="Timeline" className="flex min-w-0 flex-1 flex-col bg-base">
      <TimelineTopBar />
      <TimelineToolbar />
      <TimelineTransport
        isPlaying={playback.isPlaying}
        loop={playback.loop}
        volume={playback.volume}
        onTogglePlay={playback.handleTogglePlay}
        onStop={playback.handleStop}
        onLoopToggle={playback.handleLoopToggle}
        onVolumeChange={playback.handleVolumeChange}
      />
      <TimelineTracks isPlaying={playback.isPlaying} />
      <ClipInspector />
      <TipBar
        isShortcutsOpen={isShortcutsOpen}
        onToggleShortcuts={handleToggleShortcuts}
        onCloseShortcuts={handleCloseShortcuts}
      />
    </section>
  )
}

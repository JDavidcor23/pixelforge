import { BuildChatPanel } from '../BuildChatPanel/BuildChatPanel'
import { BuildPreviewPanel } from '../BuildPreviewPanel/BuildPreviewPanel'

/** `/build` (ADR 0014): chat + library on the left, live Phaser preview on the right. */
export function BuildScreen() {
  return (
    <div className="flex h-full min-w-0 flex-1">
      <BuildChatPanel />
      <BuildPreviewPanel />
    </div>
  )
}

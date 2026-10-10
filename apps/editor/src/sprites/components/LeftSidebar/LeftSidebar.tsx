import { LayerPanel } from '../../features/layers'

export const LeftSidebar = () => {
  return (
    <div className="flex h-full flex-col border-r border-line-strong bg-surface">
      <div className="border-b border-line-strong px-3 py-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted">Layers</h3>
      </div>
      <div className="flex-1 overflow-hidden">
        <LayerPanel />
      </div>
    </div>
  )
}

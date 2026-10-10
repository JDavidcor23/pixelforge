import type { StateCreator } from 'zustand'

import type { SpriteEditorStore } from '@/types'

import type { LayerSlice } from '../types/slices'
import { initialLayer } from '../helpers'

/**
 * Layer CRUD (phase 2b, design D3): every action here is a thin wrapper
 * around `dispatch`, routed through `lib/core/ts-core.ts`'s `layer.*`
 * commands instead of mutating `state.layers` directly. Layer CRUD
 * (`layer.add`/`layer.remove`/`layer.meta`/`layer.reorder`) is UNDOABLE as
 * of phase 2c (judgment-day round 1) — each pushes its own history entry
 * (`lib/core/commands.ts`'s undoable list, `lib/core/history.ts`'s
 * `layer.add`/`layer.remove`/`layer.meta`/`layer.reorder` entry kinds).
 * Either way, the mutation itself has a single owner: the core document
 * (`timeline.frames[currentFrameIndex]`), not a parallel copy in this slice.
 *
 * `layers`/`activeLayerId` below are only the store's INITIAL values (used
 * before the document is restored/hydrated by `useDocumentPersistence`);
 * once the editor is running, every update to them flows through
 * `core.slice.ts`'s `dispatch` handler.
 */
export const createLayerSlice: StateCreator<
  SpriteEditorStore,
  [['zustand/persist', unknown]],
  [],
  LayerSlice
> = (_set, get) => ({
  layers: [initialLayer],
  activeLayerId: initialLayer.id,

  addLayer: () => {
    // Bug #3: layer CRUD and active-layer switches commit (or cancel) any
    // floating selection into its SOURCE layer/frame first — see
    // `selection.slice.ts`'s `commitTransformation` doc.
    if (get().selection?.floatingPixels) get().commitTransformation()
    get().dispatch({ type: 'layer.add' })
  },

  removeLayer: (id) => {
    if (get().selection?.floatingPixels) get().commitTransformation()
    get().dispatch({ type: 'layer.remove', layerId: id })
  },

  toggleLayerVisibility: (id) => {
    const layer = get().layers.find((l) => l.id === id)
    if (!layer) return
    get().dispatch({ type: 'layer.meta', layerId: id, patch: { visible: !layer.visible } })
  },

  toggleLayerLock: (id) => {
    const layer = get().layers.find((l) => l.id === id)
    if (!layer) return
    get().dispatch({ type: 'layer.meta', layerId: id, patch: { locked: !layer.locked } })
  },

  setLayerOpacity: (id, opacity) => {
    get().dispatch({ type: 'layer.meta', layerId: id, patch: { opacity } })
  },

  reorderLayers: (fromIndex, toIndex) => {
    get().dispatch({ type: 'layer.reorder', from: fromIndex, to: toIndex })
  },

  setActiveLayer: (id) => {
    if (get().selection?.floatingPixels) get().commitTransformation()
    get().dispatch({ type: 'layer.setActive', layerId: id })
  },

  updateLayerName: (id, name) => {
    get().dispatch({ type: 'layer.meta', layerId: id, patch: { name } })
  },
})

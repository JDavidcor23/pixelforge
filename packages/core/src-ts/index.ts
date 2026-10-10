export type { PixelKernels } from './types'
export { tsKernels } from './ts-core'
export { loadWasmModule, makeWasmKernels, resetWasmModuleForTests } from './wasm-core'
export { resolveKernels, resetRuntimeTrapDemotionForTests } from './resolve-core'

// Phase 7: the stateful `PixelCore` (full document + history) seam — see
// `document-types.ts`'s module doc for why these types are a structural
// duplicate of `apps/editor`'s, not a shared import.
export type {
  Command,
  DirtyRect,
  DispatchResult,
  DocMetaSnapshot,
  DocSnapshot,
  DocumentFramePayload,
  DocumentLayerPayload,
  DocumentPayload,
  FrameId,
  LayerId,
  LayerMetaPatch,
  LayerRef,
  PixelCore,
  Rect,
  SerializedFrame,
  SerializedLayer,
} from './document-types'
export { WasmPixelCore, setIdSeed as setWasmIdSeed } from './wasm-document-core'

import type { ChangeEvent, FormEvent, KeyboardEvent, MouseEvent, RefObject } from 'react'

import type { AIAnimation, AIGeneration, AssetType } from './ai-generation'
import type { Layer, PixelBuffer } from './index'
import type { FILE_MENU_ENTRY_KIND } from '@/constants/file-menu'

/** One row of the top bar File menu: an action, or a visual divider between groups. */
export type FileMenuEntry =
  | {
      readonly kind: typeof FILE_MENU_ENTRY_KIND.ITEM
      readonly id: string
      readonly label: string
      readonly onSelect: () => void
    }
  | { readonly kind: typeof FILE_MENU_ENTRY_KIND.SEPARATOR; readonly id: string }

export interface FileMenuActions {
  readonly openSaveAs: () => void
  readonly openImportSpriteSheet: () => void
  readonly exportFrame: () => void
  readonly exportSpriteSheet: () => void
  readonly closeMenu: () => void
}

/** The picked file, decoded once so the dialog can prefill frames from its size. */
export interface PendingSpriteSheet {
  readonly dataUrl: string
  readonly width: number
  readonly height: number
}

export interface SpriteSheetImportRequest {
  readonly dataUrl: string
  readonly name: string
  readonly frameCount: number
}

/**
 * Side effects of a File > Import sprite sheet… run, injected so the flow is
 * the same one the Create tab Import runs (same decoders, same store actions).
 */
export interface SpriteSheetImportDeps {
  readonly decodeSingle: (dataUrl: string) => Promise<PixelBuffer>
  readonly decodeSheet: (dataUrl: string, frameCount: number) => Promise<PixelBuffer[]>
  readonly overwriteWithPixels: (pixels: PixelBuffer, dataUrl: string) => void
  readonly importAnimationFrames: (frames: PixelBuffer[], frameDurationMs: number) => void
  readonly addAnimation: (animation: AIAnimation) => void
  readonly toDataUri: (frame: PixelBuffer) => string
  readonly createId: () => string
  readonly now: () => number
}

export interface ImportSpriteSheetDialogProps {
  readonly name: string
  readonly frames: string
  /** Validation reason or the last import failure; shown inline under the fields. */
  readonly errorMessage: string | null
  readonly canImport: boolean
  readonly isImporting: boolean
  readonly onNameChange: (event: ChangeEvent<HTMLInputElement>) => void
  readonly onFramesChange: (event: ChangeEvent<HTMLInputElement>) => void
  readonly onCancel: () => void
  readonly onConfirm: () => void
}

/** Readers `openSpriteSheetFile` needs, injected so the flow is testable without a DOM. */
export interface SpriteSheetFileReaders {
  readonly readAsDataUrl: (file: File) => Promise<string>
  readonly measure: (dataUrl: string) => Promise<Pick<PixelBuffer, 'w' | 'h'>>
}

/** A picked file ready for the dialog, or the message to show when it could not be opened. */
export type OpenedSpriteSheet =
  | { readonly ok: true; readonly pending: PendingSpriteSheet; readonly name: string; readonly frames: string }
  | { readonly ok: false; readonly message: string }

export interface ImportErrorNoticeProps {
  readonly message: string
  readonly onDismiss: () => void
}

export interface UseImportSpriteSheetReturn {
  readonly fileInputRef: RefObject<HTMLInputElement | null>
  readonly openFilePicker: () => void
  readonly handleFileSelected: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
  readonly dialogProps: ImportSpriteSheetDialogProps | null
  /** Set when the picked file could not be read or decoded; null otherwise. */
  readonly fileErrorProps: ImportErrorNoticeProps | null
}

export interface UseImportSpriteSheetDialogParams {
  readonly onCancel: () => void
  readonly onConfirm: () => void
}

export interface UseImportSpriteSheetDialogReturn {
  readonly dialogRef: RefObject<HTMLDivElement | null>
  readonly nameInputRef: RefObject<HTMLInputElement | null>
  readonly titleId: string
  readonly descriptionId: string
  readonly handleBackdropClick: (event: MouseEvent<HTMLDivElement>) => void
  readonly handleKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
  readonly handleSubmit: (event: FormEvent<HTMLFormElement>) => void
}

/** File > Save As… dialog (ADR 0010, Phase 1). */
export interface SaveAsDialogProps {
  readonly name: string
  readonly assetType: AssetType
  /** Validation reason; shown inline under the fields. */
  readonly errorMessage: string | null
  readonly canSave: boolean
  readonly onNameChange: (event: ChangeEvent<HTMLInputElement>) => void
  readonly onAssetTypeChange: (assetType: AssetType) => void
  readonly onCancel: () => void
  readonly onConfirm: () => void
}

export interface UseSaveAsDialogParams {
  readonly onCancel: () => void
  readonly onConfirm: () => void
}

/** Same modal mechanics (focus trap, Escape, backdrop, submit) as `useImportSpriteSheetDialog`, kept as its own hook so the two dialogs stay independent. */
export interface UseSaveAsDialogReturn {
  readonly dialogRef: RefObject<HTMLDivElement | null>
  readonly nameInputRef: RefObject<HTMLInputElement | null>
  readonly titleId: string
  readonly descriptionId: string
  readonly handleBackdropClick: (event: MouseEvent<HTMLDivElement>) => void
  readonly handleKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
  readonly handleSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export interface SaveAsRequest {
  readonly name: string
  readonly assetType: AssetType
}

/**
 * Side effects of a File > Save As… confirm, injected so the flow is testable
 * without a DOM (same shape/intent as `SpriteSheetImportDeps`).
 */
export interface SaveAsDeps {
  readonly getCanvasState: () => { readonly canvasWidth: number; readonly canvasHeight: number; readonly layers: Layer[] }
  readonly exportCanvas: (width: number, height: number, layers: Layer[]) => string
  readonly addDrawing: (drawing: Omit<AIGeneration, 'id' | 'timestamp' | 'kind'>) => AIGeneration
}

import { SPRITE_IMPORT_MAX_FRAMES, SPRITE_IMPORT_MIN_FRAMES } from './index'

/**
 * Top bar "File" menu (desktop-editor menubar). Copy and item ids live here so
 * the hook, the JSX and the tests never re-type a label.
 */
export const FILE_MENU_COPY = {
  TRIGGER: 'File',
  MENU_LABEL: 'File menu',
} as const

export const FILE_MENU_ITEM_IDS = {
  SAVE_AS: 'save-as',
  SEPARATOR_SAVE_AS: 'separator-save-as',
  IMPORT_SPRITE_SHEET: 'import-sprite-sheet',
  SEPARATOR_EXPORT: 'separator-export',
  EXPORT_FRAME: 'export-frame',
  EXPORT_SPRITE_SHEET: 'export-sprite-sheet',
} as const

export const FILE_MENU_LABELS = {
  SAVE_AS: 'Save As…',
  IMPORT_SPRITE_SHEET: 'Import sprite sheet…',
  EXPORT_FRAME: 'Export current frame',
  EXPORT_SPRITE_SHEET: 'Export sprite sheet',
} as const

/** Discriminant of a File menu row: an action, or a divider between groups. */
export const FILE_MENU_ENTRY_KIND = {
  ITEM: 'item',
  SEPARATOR: 'separator',
} as const

export const FILE_MENU_DISMISS_KEY = 'Escape'

/** Key the import dialog traps so focus cycles inside it (same trap as DeleteAccountDialog). */
export const DIALOG_FOCUS_TRAP_KEY = 'Tab'

/** Auto-dismiss for the "could not open that file" notice, matching the account-deleted notice. */
export const IMPORT_FILE_ERROR_NOTICE_AUTO_DISMISS_MS = 6000

export const IMPORT_FILE_ERROR_NOTICE_COPY = {
  DISMISS_LABEL: 'Dismiss',
} as const

/** File > Import sprite sheet… dialog. */
export const IMPORT_SPRITE_SHEET_COPY = {
  TITLE: 'Import sprite sheet',
  DESCRIPTION: 'Slices a horizontal strip into equal frames and saves it to Assets by name.',
  NAME_LABEL: 'Name',
  FRAMES_LABEL: 'Frames',
  CANCEL_BUTTON: 'Cancel',
  CONFIRM_BUTTON: 'Import',
  CONFIRM_BUTTON_PENDING: 'Importing…',
} as const

export const IMPORT_SPRITE_SHEET_ERRORS = {
  NAME_REQUIRED: 'Enter a name for this sprite sheet.',
  FRAMES_OUT_OF_RANGE: `Frames must be a whole number from ${SPRITE_IMPORT_MIN_FRAMES} to ${SPRITE_IMPORT_MAX_FRAMES}.`,
  WIDTH_NOT_DIVISIBLE: 'The image width does not split evenly into that many frames.',
  READ_FAILED: 'Could not read the file.',
  OPEN_FAILED: 'Could not open that file. Pick a PNG or another image.',
  IMPORT_FAILED: 'Could not import the sprite sheet.',
} as const

/** Name input / frames input ids, so each `<label htmlFor>` matches its control. */
export const IMPORT_SPRITE_SHEET_FIELD_IDS = {
  NAME: 'import-sprite-sheet-name',
  FRAMES: 'import-sprite-sheet-frames',
} as const

/** Strips the last extension: "hero-run.png" -> "hero-run". */
export const FILE_EXTENSION_PATTERN = /\.[^./\\]+$/

/** File > Save As… dialog (ADR 0010, Phase 1) — snapshots the canvas into Assets under a name and type. */
export const SAVE_AS_COPY = {
  TITLE: 'Save As',
  DESCRIPTION: 'Saves the current canvas to Assets under a name and type.',
  NAME_LABEL: 'Name',
  TYPE_LABEL: 'Type',
  CANCEL_BUTTON: 'Cancel',
  CONFIRM_BUTTON: 'Save',
} as const

export const SAVE_AS_ERRORS = {
  NAME_REQUIRED: 'Enter a name for this asset.',
} as const

/** Name input id, so the `<label htmlFor>` matches its control. */
export const SAVE_AS_FIELD_IDS = {
  NAME: 'save-as-name',
} as const

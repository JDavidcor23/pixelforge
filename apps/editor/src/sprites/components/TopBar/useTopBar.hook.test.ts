import { describe, expect, it, vi } from 'vitest'

import { buildFileMenuEntries, isMenuDismissKey, isOutsideMenu, runSaveAs, validateSaveAsName } from './useTopBar.hook'
import { FILE_MENU_ENTRY_KIND, FILE_MENU_LABELS, SAVE_AS_ERRORS } from '@/constants/file-menu'
import type { FileMenuActions, SaveAsDeps } from '@/types'

const makeActions = (): FileMenuActions => ({
  openSaveAs: vi.fn(),
  openImportSpriteSheet: vi.fn(),
  exportFrame: vi.fn(),
  exportSpriteSheet: vi.fn(),
  closeMenu: vi.fn(),
})

const selectByLabel = (actions: FileMenuActions, label: string) => {
  const entry = buildFileMenuEntries(actions).find((item) => item.kind === FILE_MENU_ENTRY_KIND.ITEM && item.label === label)
  if (!entry || entry.kind !== FILE_MENU_ENTRY_KIND.ITEM) throw new Error(`missing menu item ${label}`)
  entry.onSelect()
}

describe('buildFileMenuEntries', () => {
  it('lists Save As, a separator, Import, a separator, then the two export items, in order', () => {
    const entries = buildFileMenuEntries(makeActions())
    expect(entries.map((entry) => (entry.kind === FILE_MENU_ENTRY_KIND.ITEM ? entry.label : FILE_MENU_ENTRY_KIND.SEPARATOR))).toEqual([
      FILE_MENU_LABELS.SAVE_AS,
      FILE_MENU_ENTRY_KIND.SEPARATOR,
      FILE_MENU_LABELS.IMPORT_SPRITE_SHEET,
      FILE_MENU_ENTRY_KIND.SEPARATOR,
      FILE_MENU_LABELS.EXPORT_FRAME,
      FILE_MENU_LABELS.EXPORT_SPRITE_SHEET,
    ])
  })

  it('Save As opens the Save As dialog and closes the menu', () => {
    const actions = makeActions()
    selectByLabel(actions, FILE_MENU_LABELS.SAVE_AS)
    expect(actions.openSaveAs).toHaveBeenCalledTimes(1)
    expect(actions.closeMenu).toHaveBeenCalledTimes(1)
  })

  it('Export current frame calls the existing frame export and closes the menu', () => {
    const actions = makeActions()
    selectByLabel(actions, FILE_MENU_LABELS.EXPORT_FRAME)
    expect(actions.exportFrame).toHaveBeenCalledTimes(1)
    expect(actions.exportSpriteSheet).not.toHaveBeenCalled()
    expect(actions.closeMenu).toHaveBeenCalledTimes(1)
  })

  it('Export sprite sheet calls the existing sheet export and closes the menu', () => {
    const actions = makeActions()
    selectByLabel(actions, FILE_MENU_LABELS.EXPORT_SPRITE_SHEET)
    expect(actions.exportSpriteSheet).toHaveBeenCalledTimes(1)
    expect(actions.exportFrame).not.toHaveBeenCalled()
    expect(actions.closeMenu).toHaveBeenCalledTimes(1)
  })

  it('Import sprite sheet opens the import flow and closes the menu', () => {
    const actions = makeActions()
    selectByLabel(actions, FILE_MENU_LABELS.IMPORT_SPRITE_SHEET)
    expect(actions.openImportSpriteSheet).toHaveBeenCalledTimes(1)
    expect(actions.closeMenu).toHaveBeenCalledTimes(1)
  })
})

describe('validateSaveAsName (File > Save As…, ADR 0010 Phase 1)', () => {
  it('rejects a blank or whitespace-only name', () => {
    expect(validateSaveAsName('')).toBe(SAVE_AS_ERRORS.NAME_REQUIRED)
    expect(validateSaveAsName('   ')).toBe(SAVE_AS_ERRORS.NAME_REQUIRED)
  })

  it('allows a real name', () => {
    expect(validateSaveAsName('my hero')).toBeNull()
  })
})

describe('runSaveAs (File > Save As…, ADR 0010 Phase 1)', () => {
  const makeDeps = (): SaveAsDeps => ({
    getCanvasState: vi.fn(() => ({ canvasWidth: 32, canvasHeight: 32, layers: [] })),
    exportCanvas: vi.fn(() => 'data:image/png;base64,exported'),
    addDrawing: vi.fn((drawing) => ({ ...drawing, id: 'drawing-1', timestamp: 1, kind: 'drawing' })),
  })

  it('exports the current canvas and adds it to Assets as a named, typed drawing', () => {
    const deps = makeDeps()
    runSaveAs({ name: '  my hero  ', assetType: 'character' }, deps)

    expect(deps.getCanvasState).toHaveBeenCalledTimes(1)
    expect(deps.exportCanvas).toHaveBeenCalledWith(32, 32, [])
    expect(deps.addDrawing).toHaveBeenCalledWith({
      prompt: 'my hero',
      base64: 'data:image/png;base64,exported',
      width: 32,
      height: 32,
      assetType: 'character',
    })
  })
})

describe('menu dismissal', () => {
  it('Escape closes the menu; other keys do not', () => {
    expect(isMenuDismissKey('Escape')).toBe(true)
    expect(isMenuDismissKey('Enter')).toBe(false)
  })

  it('a click outside the menu closes it; a click inside does not', () => {
    const inside = {} as Node
    const outside = {} as Node
    const menu = { contains: (node: Node | null) => node === inside }
    expect(isOutsideMenu(menu, outside)).toBe(true)
    expect(isOutsideMenu(menu, inside)).toBe(false)
    expect(isOutsideMenu(null, outside)).toBe(false)
  })
})

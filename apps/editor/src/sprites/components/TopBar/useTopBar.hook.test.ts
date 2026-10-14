import { describe, expect, it, vi } from 'vitest'

import { buildFileMenuEntries, isMenuDismissKey, isOutsideMenu } from './useTopBar.hook'
import { FILE_MENU_ENTRY_KIND, FILE_MENU_LABELS } from '@/constants/file-menu'
import type { FileMenuActions } from '@/types'

const makeActions = (): FileMenuActions => ({
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
  it('lists Import, a separator, then the two export items, in order', () => {
    const entries = buildFileMenuEntries(makeActions())
    expect(entries.map((entry) => (entry.kind === FILE_MENU_ENTRY_KIND.ITEM ? entry.label : FILE_MENU_ENTRY_KIND.SEPARATOR))).toEqual([
      FILE_MENU_LABELS.IMPORT_SPRITE_SHEET,
      FILE_MENU_ENTRY_KIND.SEPARATOR,
      FILE_MENU_LABELS.EXPORT_FRAME,
      FILE_MENU_LABELS.EXPORT_SPRITE_SHEET,
    ])
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

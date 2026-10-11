import { describe, expect, it } from 'vitest'

import type { ShortcutKeyEvent } from '@/types/timeline-view'
import { ALT_KEY, MOD_KEY } from '@/constants/timeline-view'
import { isMacPlatform, resolveShortcutKeys, resolveTimelineShortcut } from './timeline-shortcuts'

const key = (value: string, modifiers: Partial<ShortcutKeyEvent> = {}): ShortcutKeyEvent => ({
  key: value,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
  ...modifiers,
})

describe('resolveTimelineShortcut', () => {
  it('maps the single-letter tools case-insensitively', () => {
    expect(resolveTimelineShortcut(key('S'))).toBe('split')
    expect(resolveTimelineShortcut(key('d'))).toBe('duplicate')
    expect(resolveTimelineShortcut(key('n'))).toBe('toggle-snap')
    expect(resolveTimelineShortcut(key(' '))).toBe('toggle-play')
  })

  it('deletes with Delete and Backspace', () => {
    expect(resolveTimelineShortcut(key('Delete'))).toBe('delete')
    expect(resolveTimelineShortcut(key('Backspace'))).toBe('delete')
  })

  it('undoes and redoes with Ctrl or Cmd', () => {
    expect(resolveTimelineShortcut(key('z', { ctrlKey: true }))).toBe('undo')
    expect(resolveTimelineShortcut(key('z', { metaKey: true }))).toBe('undo')
    expect(resolveTimelineShortcut(key('Z', { metaKey: true, shiftKey: true }))).toBe('redo')
    expect(resolveTimelineShortcut(key('y', { ctrlKey: true }))).toBe('redo')
  })

  it('ignores letters combined with modifiers (browser shortcuts stay intact)', () => {
    expect(resolveTimelineShortcut(key('s', { ctrlKey: true }))).toBeNull()
    expect(resolveTimelineShortcut(key('d', { altKey: true }))).toBeNull()
  })

  it('zooms with + and -, including the shifted variants', () => {
    expect(resolveTimelineShortcut(key('+', { shiftKey: true }))).toBe('zoom-in')
    expect(resolveTimelineShortcut(key('='))).toBe('zoom-in')
    expect(resolveTimelineShortcut(key('-'))).toBe('zoom-out')
  })

  it('nudges with arrows and trims the end with Shift+arrows', () => {
    expect(resolveTimelineShortcut(key('ArrowLeft'))).toBe('nudge-left')
    expect(resolveTimelineShortcut(key('ArrowRight', { shiftKey: true }))).toBe('trim-end-right')
  })

  it('trims the start with Alt+arrows only when no other modifier is held', () => {
    expect(resolveTimelineShortcut(key('ArrowLeft', { altKey: true }))).toBe('trim-start-left')
    expect(resolveTimelineShortcut(key('ArrowRight', { altKey: true }))).toBe('trim-start-right')
    expect(resolveTimelineShortcut(key('ArrowRight', { altKey: true, shiftKey: true }))).toBeNull()
  })

  it('opens the shortcuts list with ? (Shift+/)', () => {
    expect(resolveTimelineShortcut(key('?', { shiftKey: true }))).toBe('show-shortcuts')
    expect(resolveTimelineShortcut(key('?'))).toBe('show-shortcuts')
  })

  it('returns null for unmapped keys', () => {
    expect(resolveTimelineShortcut(key('q'))).toBeNull()
    expect(resolveTimelineShortcut(key('v'))).toBeNull()
  })
})

describe('platform modifier', () => {
  it('reads ⌘ on macOS and Ctrl elsewhere', () => {
    expect(isMacPlatform('MacIntel')).toBe(true)
    expect(isMacPlatform('Win32')).toBe(false)
    expect(resolveShortcutKeys([MOD_KEY, 'Z'], true)).toEqual(['⌘', 'Z'])
    expect(resolveShortcutKeys([MOD_KEY, 'Z'], false)).toEqual(['Ctrl', 'Z'])
    expect(resolveShortcutKeys([ALT_KEY, '←'], true)).toEqual(['⌥', '←'])
    expect(resolveShortcutKeys([ALT_KEY, '←'], false)).toEqual(['Alt', '←'])
  })
})

import type { ShortcutKeyEvent, TimelineShortcutAction } from '@/types/timeline-view'
import {
  ALT_KEY,
  ALT_KEY_LABEL,
  MAC_PLATFORM_PATTERN,
  MOD_KEY,
  MOD_KEY_LABEL,
} from '@/constants/timeline-view'

// Pure keyboard → action mapping for the timeline. The DOM side (which
// element has focus, whether a dialog is open) is decided by the hook.

const PLAIN_KEYS: Readonly<Record<string, TimelineShortcutAction>> = {
  s: 'split',
  d: 'duplicate',
  n: 'toggle-snap',
  ' ': 'toggle-play',
  Delete: 'delete',
  Backspace: 'delete',
  '+': 'zoom-in',
  '=': 'zoom-in',
  '-': 'zoom-out',
  _: 'zoom-out',
  Escape: 'escape',
  ArrowLeft: 'nudge-left',
  ArrowRight: 'nudge-right',
  // Layouts where "?" needs no Shift.
  '?': 'show-shortcuts',
}

/** Alt+arrows trim the clip's START (Shift+arrows trim its end). */
const ALT_KEYS: Readonly<Record<string, TimelineShortcutAction>> = {
  ArrowLeft: 'trim-start-left',
  ArrowRight: 'trim-start-right',
}

const SHIFT_KEYS: Readonly<Record<string, TimelineShortcutAction>> = {
  ArrowLeft: 'trim-end-left',
  ArrowRight: 'trim-end-right',
  '+': 'zoom-in',
  _: 'zoom-out',
  '?': 'show-shortcuts',
}

export function resolveTimelineShortcut(event: ShortcutKeyEvent): TimelineShortcutAction | null {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
  if (event.altKey) {
    return event.ctrlKey || event.metaKey || event.shiftKey ? null : (ALT_KEYS[key] ?? null)
  }

  if (event.ctrlKey || event.metaKey) {
    if (key === 'z') return event.shiftKey ? 'redo' : 'undo'
    if (key === 'y' && event.ctrlKey && !event.shiftKey) return 'redo'
    return null
  }

  if (event.shiftKey) return SHIFT_KEYS[key] ?? null
  return PLAIN_KEYS[key] ?? null
}

/** True on macOS / iOS — decides whether MOD reads as ⌘ or Ctrl. */
export function isMacPlatform(platform: string): boolean {
  return MAC_PLATFORM_PATTERN.test(platform)
}

export function modKeyLabel(isMac: boolean): string {
  return isMac ? MOD_KEY_LABEL.MAC : MOD_KEY_LABEL.OTHER
}

/** Replaces the MOD / ALT placeholders with the platform's modifier labels. */
export function resolveShortcutKeys(keys: readonly string[], isMac: boolean): string[] {
  return keys.map((key) => {
    if (key === MOD_KEY) return modKeyLabel(isMac)
    if (key === ALT_KEY) return isMac ? ALT_KEY_LABEL.MAC : ALT_KEY_LABEL.OTHER
    return key
  })
}

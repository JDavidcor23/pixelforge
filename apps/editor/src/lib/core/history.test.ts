import { describe, it, expect } from 'vitest'
import {
  createHistory,
  pushEntry,
  popUndo,
  popRedo,
  canUndo,
  canRedo,
  entryBytes,
  historyBytes,
  HISTORY_MAX_ENTRIES,
  HISTORY_MAX_BYTES,
  type HistoryEntry,
} from './history'

function makePatchEntry(label: string, byteLen = 4): HistoryEntry {
  return {
    kind: 'patch',
    label,
    frameId: 'frame-0',
    activeLayerId: 'layer-1',
    patches: [
      {
        layerId: 'layer-1',
        rect: { x: 0, y: 0, w: 1, h: 1 },
        before: new Uint8Array(byteLen),
        after: new Uint8Array(byteLen),
      },
    ],
  }
}

describe('createHistory', () => {
  it('starts empty with cursor -1 (nothing undoable yet)', () => {
    const history = createHistory()
    expect(history.entries).toHaveLength(0)
    expect(canUndo(history)).toBe(false)
    expect(canRedo(history)).toBe(false)
  })
})

describe('pushEntry / popUndo — carry-over item A: first entry IS undoable', () => {
  it('a single pushed entry can be undone (fixes the phase-0 frozen bug)', () => {
    let history = createHistory()
    history = pushEntry(history, makePatchEntry('Draw 1'))

    expect(canUndo(history)).toBe(true)

    const popped = popUndo(history)
    expect(popped).not.toBeNull()
    expect(popped!.entry.label).toBe('Draw 1')
    expect(canUndo(popped!.history)).toBe(false) // nothing left to undo
  })
})

describe('popUndo / popRedo round-trip', () => {
  it('undo then redo returns to the same cursor position', () => {
    let history = createHistory()
    history = pushEntry(history, makePatchEntry('Draw 1'))
    history = pushEntry(history, makePatchEntry('Draw 2'))

    const undone = popUndo(history)!
    expect(undone.entry.label).toBe('Draw 2')
    expect(canRedo(undone.history)).toBe(true)

    const redone = popRedo(undone.history)!
    expect(redone.entry.label).toBe('Draw 2')
    expect(redone.history.cursor).toBe(history.cursor)
  })

  it('redo is a no-op at the top of the stack', () => {
    let history = createHistory()
    history = pushEntry(history, makePatchEntry('Draw 1'))
    expect(popRedo(history)).toBeNull()
  })

  it('undo is a no-op on an empty history', () => {
    expect(popUndo(createHistory())).toBeNull()
  })

  it('a new push after undo discards the redo branch (classic truncation)', () => {
    let history = createHistory()
    history = pushEntry(history, makePatchEntry('Draw 1'))
    history = pushEntry(history, makePatchEntry('Draw 2'))

    const undone = popUndo(history)!.history // back to just "Draw 1"
    const retruncated = pushEntry(undone, makePatchEntry('Draw 3'))

    expect(retruncated.entries).toHaveLength(2)
    expect(retruncated.entries[1].label).toBe('Draw 3')
    expect(canRedo(retruncated)).toBe(false)
  })
})

describe('eviction — bounded history retention', () => {
  it('evicts the oldest entry once MAX_ENTRIES is exceeded', () => {
    let history = createHistory()
    for (let i = 0; i < HISTORY_MAX_ENTRIES + 1; i++) {
      history = pushEntry(history, makePatchEntry(`Draw ${i}`))
    }

    expect(history.entries).toHaveLength(HISTORY_MAX_ENTRIES)
    expect(history.entries[0].label).toBe('Draw 1') // "Draw 0" evicted
    expect(history.cursor).toBe(HISTORY_MAX_ENTRIES - 1)

    // Most recent undo still succeeds within the retention window.
    const popped = popUndo(history)
    expect(popped?.entry.label).toBe(`Draw ${HISTORY_MAX_ENTRIES}`)
  })

  it('evicts the oldest entries once HISTORY_MAX_BYTES is exceeded', () => {
    const bigEntryBytes = 1024 * 1024 // 1 MiB per entry (before+after combined ~ 2x this)
    let history = createHistory()
    const entriesToExceedBudget = Math.ceil(HISTORY_MAX_BYTES / (bigEntryBytes * 2)) + 2

    for (let i = 0; i < entriesToExceedBudget; i++) {
      history = pushEntry(history, makePatchEntry(`Big ${i}`, bigEntryBytes))
    }

    expect(historyBytes(history)).toBeLessThanOrEqual(HISTORY_MAX_BYTES)
    expect(history.entries.length).toBeLessThan(entriesToExceedBudget)
    // The newest entry always survives, however big.
    expect(history.entries[history.entries.length - 1].label).toBe(`Big ${entriesToExceedBudget - 1}`)
  })

  it('never evicts the only (newest) entry, even if it alone exceeds the byte budget', () => {
    const history = pushEntry(createHistory(), makePatchEntry('Huge', HISTORY_MAX_BYTES + 1))
    expect(history.entries).toHaveLength(1)
  })
})

describe('entryBytes — doc.resize (ADR 0008)', () => {
  it('a growing resize (no strips) costs zero bytes', () => {
    const entry: HistoryEntry = {
      kind: 'doc.resize',
      label: 'Resize canvas',
      fromWidth: 2,
      fromHeight: 2,
      toWidth: 4,
      toHeight: 4,
      strips: [],
    }
    expect(entryBytes(entry)).toBe(0)
  })

  it('a shrinking resize costs exactly the sum of its retained strip bytes', () => {
    const entry: HistoryEntry = {
      kind: 'doc.resize',
      label: 'Resize canvas',
      fromWidth: 4,
      fromHeight: 4,
      toWidth: 2,
      toHeight: 2,
      strips: [
        { frameId: 'f0', layerId: 'l0', rect: { x: 2, y: 0, w: 2, h: 4 }, bytes: new Uint8Array(2 * 4 * 4) },
        { frameId: 'f0', layerId: 'l0', rect: { x: 0, y: 2, w: 2, h: 2 }, bytes: new Uint8Array(2 * 2 * 4) },
      ],
    }
    expect(entryBytes(entry)).toBe(2 * 4 * 4 + 2 * 2 * 4)
  })
})

import { describe, it, expect } from 'vitest'

import type { TimelineClip, TimelineSnapshot } from '@/types/timeline'
import {
  EMPTY_HISTORY,
  purgeAssetFromHistory,
  pushHistory,
  redoHistory,
  undoHistory,
  type TimelineHistory,
} from './timeline-history'

const snap = (projectName: string, clips: TimelineClip[] = []): TimelineSnapshot => ({
  projectName,
  tracks: [],
  clips,
})

describe('timeline history', () => {
  it('push clears the redo branch and respects the limit', () => {
    let history: TimelineHistory = { past: [], future: [snap('f')] }
    history = pushHistory(history, snap('a'), 2)
    history = pushHistory(history, snap('b'), 2)
    history = pushHistory(history, snap('c'), 2)
    expect(history.past.map((s) => s.projectName)).toEqual(['b', 'c'])
    expect(history.future).toEqual([])
  })

  it('undo then redo round-trips', () => {
    const history = pushHistory(EMPTY_HISTORY, snap('v1'))
    const undone = undoHistory(history, snap('v2'))
    expect(undone?.snapshot.projectName).toBe('v1')
    const redone = redoHistory(undone!.history, snap('v1'))
    expect(redone?.snapshot.projectName).toBe('v2')
    expect(redone?.history.past.map((s) => s.projectName)).toEqual(['v1'])
  })

  it('returns null when there is nothing to undo or redo', () => {
    expect(undoHistory(EMPTY_HISTORY, snap('x'))).toBeNull()
    expect(redoHistory(EMPTY_HISTORY, snap('x'))).toBeNull()
  })

  it('purges an asset from every snapshot', () => {
    const clipFor = (id: string, assetId: string): TimelineClip =>
      ({ id, assetId, trackId: 't', start: 0, offset: 0, duration: 1, gainDb: 0, fadeIn: 0, fadeOut: 0, speed: 1 })
    const keep = snap('keep', [clipFor('k', 'other')])
    const history = { past: [snap('p', [clipFor('x', 'gone'), clipFor('k', 'other')]), keep], future: [snap('f', [clipFor('y', 'gone')])] }
    const purged = purgeAssetFromHistory(history, 'gone')
    expect(purged.past[0].clips.map((c) => c.id)).toEqual(['k'])
    expect(purged.past[1]).toBe(keep)
    expect(purged.future[0].clips).toEqual([])
  })
})

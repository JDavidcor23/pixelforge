import type { TimelineClip, TimelineSnapshot } from '@/types/timeline'
import { HISTORY_LIMIT } from '@/constants/timeline'

// Snapshot-based undo/redo. Snapshots share structure with live state (ops are
// immutable), so storing one costs only the outer object.

export interface TimelineHistory {
  past: TimelineSnapshot[]
  future: TimelineSnapshot[]
}

export const EMPTY_HISTORY: TimelineHistory = { past: [], future: [] }

export const isSameSnapshot = (a: TimelineSnapshot, b: TimelineSnapshot): boolean =>
  a.tracks === b.tracks && a.clips === b.clips && a.projectName === b.projectName

/** Records `previous` as an undo step; any redo branch is discarded. */
export function pushHistory(
  history: TimelineHistory,
  previous: TimelineSnapshot,
  limit: number = HISTORY_LIMIT
): TimelineHistory {
  return { past: [...history.past, previous].slice(-limit), future: [] }
}

export function undoHistory(
  history: TimelineHistory,
  current: TimelineSnapshot
): { history: TimelineHistory; snapshot: TimelineSnapshot } | null {
  const previous = history.past[history.past.length - 1]
  if (!previous) return null
  return {
    history: { past: history.past.slice(0, -1), future: [current, ...history.future] },
    snapshot: previous,
  }
}

export function redoHistory(
  history: TimelineHistory,
  current: TimelineSnapshot
): { history: TimelineHistory; snapshot: TimelineSnapshot } | null {
  const [next, ...rest] = history.future
  if (!next) return null
  return { history: { past: [...history.past, current], future: rest }, snapshot: next }
}

const withoutAsset = (clips: TimelineClip[], assetId: string): TimelineClip[] =>
  clips.some((clip) => clip.assetId === assetId) ? clips.filter((clip) => clip.assetId !== assetId) : clips

/**
 * Strips an asset's clips from every snapshot, so undo/redo can never bring
 * back a clip whose source was deleted from the library.
 */
export function purgeAssetFromHistory(history: TimelineHistory, assetId: string): TimelineHistory {
  const purge = (snapshot: TimelineSnapshot): TimelineSnapshot => {
    const clips = withoutAsset(snapshot.clips, assetId)
    return clips === snapshot.clips ? snapshot : { ...snapshot, clips }
  }
  return { past: history.past.map(purge), future: history.future.map(purge) }
}

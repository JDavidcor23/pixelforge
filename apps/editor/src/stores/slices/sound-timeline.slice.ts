import type { StateCreator } from 'zustand'

import type { SoundTimelineSlice, SoundsStore } from '@/stores/types/audio-slices'
import type { TimelineClip, TimelineDocument, TimelineSnapshot } from '@/types/timeline'
import {
  DEFAULT_PROJECT_NAME,
  DEFAULT_PX_PER_SECOND,
  MAX_PX_PER_SECOND,
  MIN_PX_PER_SECOND,
  ZOOM_STEP,
} from '@/constants/timeline'
import * as ops from '@/lib/timeline-ops'
import {
  EMPTY_HISTORY,
  isSameSnapshot,
  purgeAssetFromHistory,
  pushHistory,
  redoHistory,
  undoHistory,
  type TimelineHistory,
} from '@/lib/timeline-history'

type SetState = Parameters<StateCreator<SoundsStore>>[0]
type GetState = () => SoundsStore

const clampZoom = (pxPerSecond: number): number =>
  Math.min(MAX_PX_PER_SECOND, Math.max(MIN_PX_PER_SECOND, pxPerSecond))

const snapshotOf = (state: SoundsStore): TimelineSnapshot => ({
  projectName: state.projectName,
  tracks: state.tracks,
  clips: state.clips,
})

const docOf = (state: SoundsStore): TimelineDocument => ({ tracks: state.tracks, clips: state.clips })

const historyOf = (state: SoundsStore): TimelineHistory => ({
  past: state.timelinePast,
  future: state.timelineFuture,
})

const historyFields = (history: TimelineHistory) => ({
  timelinePast: history.past,
  timelineFuture: history.future,
})

/** Keeps the selection only if the clip still exists. */
const validSelection = (clips: readonly TimelineClip[], clipId: string | null): string | null =>
  clipId && clips.some((clip) => clip.id === clipId) ? clipId : null

/** Source length of a clip's asset; falls back to what the clip already plays. */
const sourceDurationOf = (state: SoundsStore, clipId: string): number => {
  const clip = state.clips.find((item) => item.id === clipId)
  if (!clip) return 0
  const asset = state.assets.find((item) => item.id === clip.assetId)
  return asset?.duration ?? clip.offset + ops.clipSourceSpan(clip)
}

/**
 * The single writer for document edits. Records ONE undo step per call —
 * unless a gesture is open, in which case `endGesture` records it later.
 * No-op edits (same references) never touch history.
 */
const commit = (
  set: SetState,
  get: GetState,
  next: Partial<TimelineSnapshot>,
  extra: Partial<SoundsStore> = {}
): void => {
  const state = get()
  const current = snapshotOf(state)
  const nextSnapshot = { ...current, ...next }
  if (isSameSnapshot(current, nextSnapshot)) {
    if (Object.keys(extra).length > 0) set(extra)
    return
  }
  const selection = {
    selectedClipId: validSelection(nextSnapshot.clips, extra.selectedClipId ?? state.selectedClipId),
  }
  if (state.timelineGestureSnapshot) {
    set({ ...next, ...extra, ...selection })
    return
  }
  set({ ...next, ...extra, ...selection, ...historyFields(pushHistory(historyOf(state), current)) })
}

const initialTimelineState = () => ({
  projectName: DEFAULT_PROJECT_NAME,
  tracks: ops.createDefaultTracks(),
  clips: [],
  selectedClipId: null,
  playheadTime: 0,
  pxPerSecond: DEFAULT_PX_PER_SECOND,
  snapEnabled: true,
  editorView: 'timeline' as const,
  timelinePast: EMPTY_HISTORY.past,
  timelineFuture: EMPTY_HISTORY.future,
  timelineGestureSnapshot: null,
})

export const createSoundTimelineSlice: StateCreator<
  SoundsStore,
  [['zustand/persist', unknown]],
  [],
  SoundTimelineSlice
> = (set, get) => ({
  ...initialTimelineState(),

  // ── Clips ──────────────────────────────────────────────────────────────────

  addClip: (assetId, options) => {
    const asset = get().assets.find((item) => item.id === assetId)
    if (!asset) return null
    const { doc, clipId } = ops.addClipFromAsset(docOf(get()), asset, options)
    commit(set, get, doc, { selectedClipId: clipId })
    return clipId
  },

  moveClip: (clipId, start, trackId) => commit(set, get, ops.moveClip(docOf(get()), clipId, start, trackId)),

  trimStart: (clipId, newStart) => commit(set, get, ops.trimClipStart(docOf(get()), clipId, newStart)),

  trimEnd: (clipId, newEnd) =>
    commit(set, get, ops.trimClipEnd(docOf(get()), clipId, newEnd, sourceDurationOf(get(), clipId))),

  split: (clipId, time) => {
    const { doc, clipId: newClipId } = ops.splitClip(docOf(get()), clipId, time)
    commit(set, get, doc)
    return newClipId
  },

  splitAtPlayhead: () => {
    const state = get()
    commit(set, get, ops.splitAtPlayhead(docOf(state), state.playheadTime, state.selectedClipId))
  },

  duplicate: (clipId) => {
    const { doc, clipId: copyId } = ops.duplicateClip(docOf(get()), clipId)
    if (copyId) commit(set, get, doc, { selectedClipId: copyId })
    return copyId
  },

  deleteClip: (clipId) => commit(set, get, ops.deleteClip(docOf(get()), clipId)),

  updateClip: (clipId, patch) =>
    commit(set, get, ops.updateClip(docOf(get()), clipId, patch, sourceDurationOf(get(), clipId))),

  // ── Tracks ─────────────────────────────────────────────────────────────────

  addTrack: (kind, name) => {
    const { doc, trackId } = ops.addTrack(docOf(get()), kind, name)
    commit(set, get, doc)
    return trackId
  },

  renameTrack: (trackId, name) => commit(set, get, ops.renameTrack(docOf(get()), trackId, name)),

  toggleMute: (trackId) => commit(set, get, ops.toggleTrackMute(docOf(get()), trackId)),

  toggleSolo: (trackId) => commit(set, get, ops.toggleTrackSolo(docOf(get()), trackId)),

  setTrackVolume: (trackId, volume) => commit(set, get, ops.setTrackVolume(docOf(get()), trackId, volume)),

  setProjectName: (name) => {
    const trimmed = name.trim()
    if (trimmed) commit(set, get, { projectName: trimmed })
  },

  // ── View (never part of history) ───────────────────────────────────────────

  selectClip: (clipId) => set((state) => ({ selectedClipId: validSelection(state.clips, clipId) })),

  setPlayhead: (time) => set({ playheadTime: Math.max(0, time) }),

  zoomIn: () => set((state) => ({ pxPerSecond: clampZoom(state.pxPerSecond * ZOOM_STEP) })),

  zoomOut: () => set((state) => ({ pxPerSecond: clampZoom(state.pxPerSecond / ZOOM_STEP) })),

  setZoom: (pxPerSecond) => set({ pxPerSecond: clampZoom(pxPerSecond) }),

  toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),

  setEditorView: (editorView) => set({ editorView }),

  // ── History ────────────────────────────────────────────────────────────────

  beginGesture: () => {
    const state = get()
    if (!state.timelineGestureSnapshot) set({ timelineGestureSnapshot: snapshotOf(state) })
  },

  endGesture: () => {
    const state = get()
    const start = state.timelineGestureSnapshot
    if (!start) return
    if (isSameSnapshot(start, snapshotOf(state))) {
      set({ timelineGestureSnapshot: null })
      return
    }
    set({ timelineGestureSnapshot: null, ...historyFields(pushHistory(historyOf(state), start)) })
  },

  cancelGesture: () => {
    const start = get().timelineGestureSnapshot
    if (!start) return
    set((state) => ({
      ...start,
      timelineGestureSnapshot: null,
      selectedClipId: validSelection(start.clips, state.selectedClipId),
    }))
  },

  undo: () => {
    get().endGesture()
    const state = get()
    const result = undoHistory(historyOf(state), snapshotOf(state))
    if (!result) return
    set({
      ...result.snapshot,
      ...historyFields(result.history),
      selectedClipId: validSelection(result.snapshot.clips, state.selectedClipId),
    })
  },

  redo: () => {
    get().endGesture()
    const state = get()
    const result = redoHistory(historyOf(state), snapshotOf(state))
    if (!result) return
    set({
      ...result.snapshot,
      ...historyFields(result.history),
      selectedClipId: validSelection(result.snapshot.clips, state.selectedClipId),
    })
  },

  removeAssetFromTimeline: (assetId) =>
    set((state) => {
      const { clips } = ops.removeClipsForAsset(docOf(state), assetId)
      const gesture = state.timelineGestureSnapshot
      return {
        clips,
        selectedClipId: validSelection(clips, state.selectedClipId),
        ...historyFields(purgeAssetFromHistory(historyOf(state), assetId)),
        timelineGestureSnapshot: gesture
          ? { ...gesture, clips: ops.removeClipsForAsset(gesture, assetId).clips }
          : null,
      }
    }),
})

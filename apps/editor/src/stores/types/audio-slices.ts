import type {
  AudioAsset,
  AudioAssetTag,
  ElevenLabsMode,
  GenerationRecord,
  NewSoundRequest,
  NewSoundSection,
  PendingGeneration,
  PlaybackState,
  SortDirection,
  SortField,
  SynthParameters,
} from '@/types/audio'
import type {
  AddClipOptions,
  SoundEditorView,
  TimelineClip,
  TimelineClipPatch,
  TimelineSnapshot,
  TimelineTrack,
} from '@/types/timeline'

// ── Audio Synth Slice ────────────────────────────────────────────────────────

export interface AudioSynthSlice {
  synthParams: SynthParameters
  currentPresetId: string | null
  generatedBuffer: AudioBuffer | null
  isGenerating: boolean
  setSynthParam: <K extends keyof SynthParameters>(key: K, value: SynthParameters[K]) => void
  /** Replaces the whole recipe at once (e.g. when a synth asset is selected). */
  loadSynthParams: (params: SynthParameters) => void
  setOscillatorParam: (key: string, value: number | string) => void
  setEnvelopeParam: (key: string, value: number) => void
  setFilterParam: (key: string, value: number | string) => void
  setMasterGain: (gain: number) => void
  setCurrentPreset: (presetId: string | null) => void
  setGeneratedBuffer: (buffer: AudioBuffer | null) => void
  setIsGenerating: (generating: boolean) => void
  resetSynthParams: () => void
}

// ── Audio Library Slice ──────────────────────────────────────────────────────

export interface AudioLibrarySlice {
  assets: AudioAsset[]
  selectedAssetId: string | null
  searchQuery: string
  filterTag: AudioAssetTag | null
  sortBy: SortField
  sortDirection: SortDirection
  generationHistory: GenerationRecord[]
  addAsset: (asset: AudioAsset) => void
  removeAsset: (id: string) => void
  updateAsset: (id: string, updates: Partial<AudioAsset>) => void
  setSelectedAsset: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setFilterTag: (tag: AudioAssetTag | null) => void
  setSortBy: (field: SortField) => void
  setSortDirection: (direction: SortDirection) => void
  addGenerationRecord: (record: GenerationRecord) => void
  clearGenerationHistory: () => void
}

// ── Audio Playback Slice ─────────────────────────────────────────────────────

export interface AudioPlaybackSlice {
  playbackState: PlaybackState
  currentTime: number
  duration: number
  volume: number
  loop: boolean
  activeAssetId: string | null
  setPlaybackState: (state: PlaybackState) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  setLoop: (loop: boolean) => void
  setActiveAsset: (id: string | null) => void
  resetPlayback: () => void
}

// ── Audio UI Slice (session only, not persisted) ─────────────────────────────

export interface AudioUISlice {
  isNewSoundOpen: boolean
  newSoundSection: NewSoundSection
  /** Bumped on every open so the popover re-runs focus even if already open. */
  newSoundOpenCount: number
  newSoundPrompt: string
  newSoundMode: ElevenLabsMode
  pendingGenerations: PendingGeneration[]
  generationError: string | null
  /** Sound awaiting delete confirmation; drives the single shared dialog. */
  pendingDeleteId: string | null
  openNewSound: (request?: Partial<NewSoundRequest>) => void
  closeNewSound: () => void
  setNewSoundPrompt: (prompt: string) => void
  setNewSoundMode: (mode: ElevenLabsMode) => void
  addPendingGeneration: (generation: PendingGeneration) => void
  removePendingGeneration: (id: string) => void
  setGenerationError: (error: string | null) => void
  requestDelete: (id: string) => void
  cancelDelete: () => void
}

// ── Sound Timeline Slice (multi-track mixer, session only) ───────────────────

export interface SoundTimelineSlice {
  projectName: string
  tracks: TimelineTrack[]
  clips: TimelineClip[]
  selectedClipId: string | null
  /** Seconds. */
  playheadTime: number
  pxPerSecond: number
  snapEnabled: boolean
  editorView: SoundEditorView
  /** Undo stack (oldest first), capped at HISTORY_LIMIT. */
  timelinePast: TimelineSnapshot[]
  /** Redo stack (next first). */
  timelineFuture: TimelineSnapshot[]
  /** State at `beginGesture`; while set, edits do not record history. */
  timelineGestureSnapshot: TimelineSnapshot | null

  /** Adds a clip for a library asset and selects it. Returns the clip id. */
  addClip: (assetId: string, options?: AddClipOptions) => string | null
  moveClip: (clipId: string, start: number, trackId?: string) => void
  trimStart: (clipId: string, newStart: number) => void
  trimEnd: (clipId: string, newEnd: number) => void
  /** Returns the id of the new right-hand clip, or null if nothing was split. */
  split: (clipId: string, time: number) => string | null
  splitAtPlayhead: () => void
  /** Returns the copy's id (the copy becomes selected). */
  duplicate: (clipId: string) => string | null
  deleteClip: (clipId: string) => void
  updateClip: (clipId: string, patch: TimelineClipPatch) => void
  addTrack: (kind: AudioAssetTag, name?: string) => string
  renameTrack: (trackId: string, name: string) => void
  toggleMute: (trackId: string) => void
  toggleSolo: (trackId: string) => void
  setTrackVolume: (trackId: string, volume: number) => void
  setProjectName: (name: string) => void
  selectClip: (clipId: string | null) => void
  setPlayhead: (time: number) => void
  zoomIn: () => void
  zoomOut: () => void
  setZoom: (pxPerSecond: number) => void
  toggleSnap: () => void
  setEditorView: (view: SoundEditorView) => void
  /** Start of a continuous edit (drag, slider): the edits until `endGesture` form ONE undo step. */
  beginGesture: () => void
  endGesture: () => void
  /** Reverts to the state at `beginGesture` without recording history (e.g. Escape mid-drag). */
  cancelGesture: () => void
  undo: () => void
  redo: () => void
  /** Drops every clip of a deleted asset, from the live state AND the history. */
  removeAssetFromTimeline: (assetId: string) => void
}

// ── Composed Store ───────────────────────────────────────────────────────────

export type SoundsStore = AudioSynthSlice &
  AudioLibrarySlice &
  AudioPlaybackSlice &
  AudioUISlice &
  SoundTimelineSlice

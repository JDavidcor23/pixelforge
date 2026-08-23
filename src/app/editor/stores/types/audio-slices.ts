import type {
  AudioAsset,
  AudioAssetTag,
  GenerationRecord,
  PlaybackState,
  SortDirection,
  SortField,
  SynthParameters,
} from '@/app/editor/types/audio'

// ── Audio Synth Slice ────────────────────────────────────────────────────────

export interface AudioSynthSlice {
  synthParams: SynthParameters
  currentPresetId: string | null
  generatedBuffer: AudioBuffer | null
  isGenerating: boolean
  setSynthParam: <K extends keyof SynthParameters>(key: K, value: SynthParameters[K]) => void
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

// ── Composed Store ───────────────────────────────────────────────────────────

export type SoundsStore = AudioSynthSlice & AudioLibrarySlice & AudioPlaybackSlice

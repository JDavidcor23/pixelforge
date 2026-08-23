# Tasks: audio-module

## Delivery Strategy
- **Method**: Chained PRs (stacked-to-main)
- **Total estimated lines**: ~2,785
- **PRs**: 7 (one per batch)
- **Chain**: B1 → B2 → B3 → B4 → B5 → B6 → B7

---

## Batch 1: Foundation (~700 lines)

### Task 1.1: Audio Domain Types
- **Files**: `src/app/editor/types/audio.ts`
- **Depends on**: none
- **Lines (est)**: 120
- **Description**: Define all core audio types: OscillatorType, FilterType, SynthParameters, AudioAsset, SynthPreset, GenerationRecord, ElevenLabsMode, PlaybackState enum.
- **Acceptance**: TypeScript compiles. All types exported.

### Task 1.2: Audio Constants
- **Files**: `src/app/editor/constants/audio.ts`
- **Depends on**: 1.1
- **Lines (est)**: 90
- **Description**: OSCILLATOR_TYPES, FILTER_TYPES, ADSR_DEFAULTS/LIMITS, FILTER_LIMITS, MAX_REFERENCE_FILE_SIZE (10MB), SUPPORTED_AUDIO_FORMATS, GENERATION_HISTORY_LIMIT (20), MAX_SFX_DURATION (30s), MAX_MUSIC_DURATION (180s).
- **Acceptance**: Constants importable. Limits match spec.

### Task 1.3: Audio Store Slice Types
- **Files**: `src/app/editor/stores/types/audio-slices.ts`
- **Depends on**: 1.1
- **Lines (est)**: 85
- **Description**: Interfaces for AudioSynthSlice, AudioLibrarySlice, AudioPlaybackSlice. Export SoundsStore intersection.
- **Acceptance**: No `any`. Valid intersection type.

### Task 1.4: Sounds Store with 3 Slices
- **Files**: `src/app/editor/stores/sounds.store.ts`, `src/app/editor/stores/slices/audio-synth.slice.ts`, `src/app/editor/stores/slices/audio-library.slice.ts`, `src/app/editor/stores/slices/audio-playback.slice.ts`
- **Depends on**: 1.2, 1.3
- **Lines (est)**: 240
- **Description**: Zustand store with persist middleware. 3 slices following StateCreator pattern.
- **Acceptance**: Store instantiates. Persist hydrates. Granular selectors work.

### Task 1.5: Module Types Barrel
- **Files**: `src/app/editor/sounds/types/index.ts`
- **Depends on**: 1.1, 1.3
- **Lines (est)**: 15
- **Description**: Re-export types for feature-local imports.
- **Acceptance**: Features import from `../types`.

### Task 1.6: Store & Types Unit Tests
- **Files**: `src/app/editor/stores/sounds.store.test.ts`
- **Depends on**: 1.4
- **Lines (est)**: 150
- **Description**: Test store creation, defaults, synth param updates, library CRUD, playback transitions, persist rehydration.
- **Acceptance**: `npx vitest run sounds.store` passes.

---

## Batch 2: Web Audio Engine (~470 lines)

### Task 2.1: Audio Engine (Web Audio Singleton)
- **Files**: `src/app/editor/lib/audio-engine.ts`
- **Depends on**: 1.1, 1.2
- **Lines (est)**: 180
- **Description**: AudioEngine class with lazy AudioContext. Methods: createSynthChain, playSynth, stopSynth, getAnalyserNode, renderToBuffer (OfflineAudioContext). Handles Chrome suspend policy.
- **Acceptance**: Can play/stop tone, render offline buffer. Handles suspension.

### Task 2.2: Audio Presets
- **Files**: `src/app/editor/lib/audio-presets.ts`
- **Depends on**: 1.1, 1.2
- **Lines (est)**: 80
- **Description**: 5 SynthPreset objects (laser, explosion, jump, coin, powerup). Exports getPresetById, ALL_PRESETS.
- **Acceptance**: Each preset produces distinct sound.

### Task 2.3: Audio Encoder (WAV Export)
- **Files**: `src/app/editor/lib/audio-encoder.ts`
- **Depends on**: 1.1
- **Lines (est)**: 70
- **Description**: encodeWav(AudioBuffer) → Blob, decodeToBuffer(Blob) → AudioBuffer. 16-bit PCM WAV via DataView.
- **Acceptance**: Round-trip encode→decode produces equivalent samples.

### Task 2.4: Audio Engine & Encoder Tests
- **Files**: `src/app/editor/lib/audio-engine.test.ts`, `src/app/editor/lib/audio-encoder.test.ts`
- **Depends on**: 2.1, 2.3
- **Lines (est)**: 140
- **Description**: Unit tests for encoder (WAV header, round-trip) and engine (mock AudioContext).
- **Acceptance**: `npx vitest run audio-engine audio-encoder` passes.

---

## Batch 3: Synthesizer UI (~450 lines)

### Task 3.1: OscillatorControls
- **Files**: `src/app/editor/sounds/features/synthesizer/components/OscillatorControls/OscillatorControls.tsx`, `.../useOscillatorControls.hook.ts`
- **Depends on**: 1.4, 2.1
- **Lines (est)**: 110
- **Description**: Waveform type selector (5), frequency slider (log 20-20000Hz), detune slider (-100 to +100). Real-time feedback.
- **Acceptance**: Changing type updates store and produces audible difference.

### Task 3.2: EnvelopeControls
- **Files**: `src/app/editor/sounds/features/synthesizer/components/EnvelopeControls/EnvelopeControls.tsx`, `.../useEnvelopeControls.hook.ts`
- **Depends on**: 1.4, 2.1
- **Lines (est)**: 100
- **Description**: ADSR sliders (A/D/R 0-5000ms, S 0-1). Visual curve preview.
- **Acceptance**: Sliders update store. Curve reflects values.

### Task 3.3: FilterControls
- **Files**: `src/app/editor/sounds/features/synthesizer/components/FilterControls/FilterControls.tsx`, `.../useFilterControls.hook.ts`
- **Depends on**: 1.4, 2.1
- **Lines (est)**: 90
- **Description**: Filter type selector, frequency slider (log), Q slider. Real-time.
- **Acceptance**: Filter changes audible in real-time.

### Task 3.4: PresetSelector
- **Files**: `src/app/editor/sounds/features/synthesizer/components/PresetSelector/PresetSelector.tsx`, `.../usePresetSelector.hook.ts`
- **Depends on**: 1.4, 2.2
- **Lines (est)**: 70
- **Description**: Grid of 5 presets. Click loads params + plays preview.
- **Acceptance**: Click loads preset, plays sound, highlights active.

### Task 3.5: SynthPanel (Composite)
- **Files**: `src/app/editor/sounds/features/synthesizer/components/SynthPanel/SynthPanel.tsx`, `.../useSynthPanel.hook.ts`, `.../index.ts`
- **Depends on**: 3.1, 3.2, 3.3, 3.4
- **Lines (est)**: 80
- **Description**: Arranges all controls + master gain + "Generate WAV" button.
- **Acceptance**: Full panel renders. Generate produces buffer in state.

---

## Batch 4: ElevenLabs Integration (~460 lines)

### Task 4.1: ElevenLabs API Route
- **Files**: `src/app/api/ai/elevenlabs/route.ts`
- **Depends on**: 1.1
- **Lines (est)**: 120
- **Description**: POST handler. Validates mode/prompt/key. Proxies to ElevenLabs endpoints. 60s timeout. Error responses.
- **Acceptance**: Valid request returns audio. Invalid key → 401. Bad body → 400.

### Task 4.2: ElevenLabs Client Service
- **Files**: `src/app/editor/sounds/features/ai-generate/services/elevenlabs.service.ts`
- **Depends on**: 4.1
- **Lines (est)**: 80
- **Description**: BYOK key management (localStorage). generateSFX, generateMusic, generateTTS. AbortController support.
- **Acceptance**: Correctly formats requests. Abort cancels in-flight.

### Task 4.3: AIGeneratePanel
- **Files**: `src/app/editor/sounds/features/ai-generate/components/AIGeneratePanel/AIGeneratePanel.tsx`, `.../useAIGeneratePanel.hook.ts`, `.../ModelSelector/ModelSelector.tsx`
- **Depends on**: 4.2, 1.4
- **Lines (est)**: 160
- **Description**: API key input, mode tabs (SFX/Music/TTS), prompt, reference upload (Music), voice selector (TTS), Generate button, loading/error states.
- **Acceptance**: Can generate SFX from prompt. Loading states work. Validates reference format/size.

### Task 4.4: GenerationHistory
- **Files**: `src/app/editor/sounds/features/ai-generate/components/GenerationHistory/GenerationHistory.tsx`, `.../useGenerationHistory.hook.ts`, `.../index.ts`
- **Depends on**: 4.3, 1.4
- **Lines (est)**: 100
- **Description**: Last 20 generations with metadata. One-click replay. Select to load.
- **Acceptance**: History shows. Replay works. Caps at 20.

---

## Batch 5: Playback & Visualization (~230 lines)

### Task 5.1: WaveformDisplay
- **Files**: `src/app/editor/sounds/features/playback/components/WaveformDisplay/WaveformDisplay.tsx`, `.../useWaveformDisplay.hook.ts`
- **Depends on**: 2.1, 1.4
- **Lines (est)**: 130
- **Description**: HTML5 Canvas waveform from AnalyserNode. rAF at 30+ FPS. Click-to-seek. Pauses on tab background.
- **Acceptance**: Animates during playback. Seek works. Pauses on visibility change.

### Task 5.2: TransportBar
- **Files**: `src/app/editor/sounds/features/playback/components/TransportBar/TransportBar.tsx`, `.../useTransportBar.hook.ts`, `.../index.ts`
- **Depends on**: 5.1, 1.4, 2.1
- **Lines (est)**: 100
- **Description**: Play/Stop, seek scrubber, volume slider, time display (mm:ss), loop toggle.
- **Acceptance**: Play/Stop work. Volume changes. Time updates.

---

## Batch 6: Library & Persistence (~340 lines)

### Task 6.1: Supabase Audio Service
- **Files**: `src/app/editor/sounds/features/library/services/audio-storage.service.ts`
- **Depends on**: 1.1
- **Lines (est)**: 90
- **Description**: uploadAudio, listAssets, deleteAsset, downloadAsset. Handles upload failures gracefully.
- **Acceptance**: CRUD works against Supabase. Errors handled.

### Task 6.2: LibraryPanel + AssetCard
- **Files**: `src/app/editor/sounds/features/library/components/LibraryPanel/LibraryPanel.tsx`, `.../useLibraryPanel.hook.ts`, `.../AssetCard/AssetCard.tsx`
- **Depends on**: 6.1, 1.4
- **Lines (est)**: 150
- **Description**: Asset grid with search, tag filter, sort. AssetCard with metadata. Empty state CTA.
- **Acceptance**: Assets display. Search/filter/sort work. Empty state shown.

### Task 6.3: ImportDialog + Sprite Association
- **Files**: `src/app/editor/sounds/features/library/components/ImportDialog/ImportDialog.tsx`, `.../useImportDialog.hook.ts`, `.../index.ts`
- **Depends on**: 6.2, 1.4
- **Lines (est)**: 100
- **Description**: Save dialog: name, tags, sprite association dropdown. Upload to Supabase.
- **Acceptance**: Creates asset with metadata. Sprite association stored.

---

## Batch 7: Module Shell & Integration (~135 lines)

### Task 7.1: SoundEditorLayout
- **Files**: `src/app/editor/sounds/components/SoundEditorLayout/SoundEditorLayout.tsx`, `.../useSoundEditorLayout.hook.ts`
- **Depends on**: 3.5, 4.4, 5.2, 6.2
- **Lines (est)**: 70
- **Description**: Grid layout: left (Synth/AI tabs), center (Waveform), bottom (Transport), right (Library). AudioContext resume overlay.
- **Acceptance**: All panels render. Tabs switch. Overlay appears on suspended context.

### Task 7.2: Compound Store Hook
- **Files**: `src/app/editor/sounds/hooks/useSoundEditorStore.hook.ts`
- **Depends on**: 1.4
- **Lines (est)**: 30
- **Description**: Granular selector hook for sounds store.
- **Acceptance**: Components select individual fields.

### Task 7.3: Page Route
- **Files**: `src/app/editor/sounds/page.tsx`
- **Depends on**: 7.1, 7.2
- **Lines (est)**: 25
- **Description**: Next.js page with 'use client'. Renders SoundEditorLayout.
- **Acceptance**: /editor/sounds renders without errors.

### Task 7.4: Navigation Integration
- **Files**: `src/app/editor/layout.tsx` (modify)
- **Depends on**: 7.3
- **Lines (est)**: 10
- **Description**: Add "Sounds" link to editor nav using next/link.
- **Acceptance**: Nav link works.

---

## Review Workload Forecast

| Batch | Est. Lines | PR Target |
|-------|-----------|-----------|
| B1: Foundation | ~700 | main |
| B2: Web Audio Engine | ~470 | main |
| B3: Synthesizer UI | ~450 | main |
| B4: ElevenLabs Integration | ~460 | main |
| B5: Playback & Visualization | ~230 | main |
| B6: Library & Persistence | ~340 | main |
| B7: Module Shell | ~135 | main |
| **TOTAL** | **~2,785** | 7 PRs |

- **Chained PRs recommended**: YES
- **400-line budget risk**: HIGH
- **Decision**: Chained PRs, stacked-to-main ✅

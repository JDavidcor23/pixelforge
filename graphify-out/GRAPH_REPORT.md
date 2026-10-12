# Graph Report - game-builder  (2026-10-11)

## Corpus Check
- 525 files · ~285,953 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3267 nodes · 8405 edges · 202 communities (127 shown, 71 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `92efc66b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- document.rs
- DeleteAccountDialog.tsx
- core/ts-core.ts
- TimelineTracks.tsx
- useLayerPanel.hook.ts
- document.ts
- constants/audio.ts
- mod.rs
- WasmDocument
- src/types/index.ts
- TweakPanel.tsx
- wasm-pixel-core.differential.fuzz.test.ts
- index.tsx
- sound-library.ts
- slices.ts
- timeline-ops.ts
- devDependencies
- mascot-scene-state.ts
- useCanvasInteraction.hook.ts
- sound-timeline.slice.ts
- history.rs
- WasmPixelCore
- retro-diffusion-utils.ts
- constants/index.ts
- auth.service.ts
- formatDuration
- useTopBar.hook.ts
- audio-engine.ts
- src-ts/ts-core.ts
- PixelForge IA (AGENTS.md overview)
- useGeneratePanel.hook.ts
- useSoundDetailHeader.hook.ts
- downscale.rs
- types/audio.ts
- useTipBar.hook.ts
- HueSlider.tsx
- scripts
- mascot-scene.ts
- useSoundsStore
- types/timeline-view.ts
- useDropZone.hook.ts
- compilerOptions
- quantize.rs
- dependencies
- devDependencies
- RgbaColor
- Inspector.tsx
- useSettingsPanel.hook.ts
- quantize.ts
- PixelKernels
- core/package.json
- useTimelineClip.hook.ts
- 5-phase scale-up plan (limits, persistence, segments, windowed export, virtualization)
- compilerOptions
- focus-ring.ts
- types/timeline.ts
- ts-core.judgment-day-round3.test.ts
- tokens/package.json
- D6: Flat Rust API, No Serde Decision
- bindings.rs (diagram node, only wasm-bindgen boundary)
- include
- useSpriteEditorStore
- delete-account/index.ts
- quantize.oracle-parity.test.ts
- audio-storage.service.ts
- ElevenLabs AI sound generation
- assets.store.ts
- core.slice.real-trap.test.ts
- useEditorPrefsStore
- Phase 1: Flatten Buffer + IndexedDB Persistence
- Phase 7: Rust Document/History
- edit-history Capability
- build-wasm.mjs
- kernels.ts
- audio-engine.test.ts
- 2026-10-11 — Resizing a sprite without losing its layers
- Phase 5: Rust Flood-Fill
- color-utils.ts
- flood-fill.fuzz.test.ts
- sound-timeline.slice.test.ts
- useCanvasSizePopover.hook.ts
- core/tsconfig.json
- elevenlabs.ts
- Rust/Wasm core migration boundary
- PixelCore
- installFakeDom
- motion.ts
- wasm-document-core.test.ts
- PixelForge Architecture Overview
- WasmPixelCore (diagram node, behind flag)
- ColorPicker.tsx
- DocumentRepository port (load/save/remove)
- pixel-core Capability
- ts-core.judgment-day-round2.test.ts
- workspace-build Capability
- 0008 — Lossless canvas resize with a cut-strips undo entry
- computeMascotSceneState
- scripts
- useAssetsPanel.hook.ts
- tokens/tsconfig.json
- check-bench.ts
- useSaveIndicator.hook.ts
- src-ts/index.ts
- useSpriteEditorStore.hook.ts
- Zustand store (diagram node)
- ADR 0002: Single dispatch(cmd) seam; core owns the document
- wasm-bindgen Copy-In/Copy-Out Mechanism
- Phased Migration Approach (0-7)
- Stage 6: Publishing to AWS (planned)
- useAnimateTab.hook.ts
- Granular selector golden rule
- editor/package.json
- constants/timeline-view.ts
- GoogleButton.tsx
- mascot-city.ts
- --pf-* CSS custom properties
- /implementar command
- D6: flat Rust API surface, u32 handles, no serde
- zustand-agent definition
- createEmptyBuffer
- clean-pkg-gitignore.mjs
- tsconfig.json
- rules-agent definition
- ADR template
- Learning-log template
- AI-notes vs owner-voice authorship layers
- Geist font Google Fonts <link>
- lucide-react
- @pixelforge/tokens
- react
- tailwindcss
- @vitejs/plugin-react
- @vitest/ui
- editor/postcss.config.mjs
- apps/editor README env vars
- vercel.json
- eslint.config.mjs
- next.config.ts
- landing/postcss.config.mjs
- Canvas (Konva) colors.ts mirror exception
- D1: PixelBuffer{w,h,data:Uint8ClampedArray}
- D3: core owns the document
- D11: DESIGN.md stays at repo root
- Measured Rust vs TS results table
- Client-side localStorage API key storage
- Rust/Wasm core with TS reference
- Figma dynamic page loading precedent
- Google Maps tiles/LOD precedent
- Reference counting
- /implementar command (Pencil -> code pipeline)
- mascot-sprite.ts
- Full review checklist
- No magic values rule
- Per-app navigation rules
- Component/hook/service separation
- 5 Zustand antipatterns
- Store-of-slices pattern
- cleancode-agent (referenced)
- Contextual Skill Loading rule
- design-agent (referenced)
- frontend-agent (referenced)
- CI job: test / bench / typecheck
- #root + main.tsx mount point
- apps/editor pnpm scripts
- vercel-functions-dev.ts
- DESIGN.md not imported, read on demand
- High-density functional grid layout
- Synthetic Architect design system
- D2: copy-on-write per batch
- D5: PixelKernels under PixelCore (two seams)
- D13: idb library over raw indexedDB API
- AI-notes vs owner-written authorship policy
- pnpm workspaces (monorepo)
- React Server Components and 'use client'
- SPA (Single Page Application)
- SSR vs CSR
- Vite build tool
- Code map: where each piece lives
- flood-fill/quantize/downscale modules
- Hexagonal ports & adapters
- Reproducible Wasm builds gated in CI
- Content-addressable / immutable data
- Flyweight pattern
- Shadow mode / dark launch
- Design tools guide (impeccable + Emil Kowalski skills + Pencil)
- Emil Kowalski motion/polish skills
- PixelForge vision lifecycle diagram (SVG)
- @theme inline Tailwind token mapping
- pixelforge-core
- pnpm workspace packages config
- Product principles (intent-first, equal AI/manual paths)
- Sprite editor feature (Konva, AI gen)
- sprite-pipeline.ts
- mascot-font.ts
- LibrarySidebar.tsx
- LeftSidebar.tsx
- TimelineEditor.tsx
- colors.test.ts

## God Nodes (most connected - your core abstractions)
1. `useSoundsStore` - 89 edges
2. `useSpriteEditorStore` - 89 edges
3. `createEmptyBuffer()` - 83 edges
4. `FOCUS_RING` - 65 edges
5. `MOTION` - 57 edges
6. `Document` - 52 edges
7. `putPixel()` - 40 edges
8. `useEditorUIStore` - 40 edges
9. `WasmDocument` - 38 edges
10. `dispatchCommandSwitch()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `AI-notes vs owner-voice authorship layers` --semantically_similar_to--> `Authorship of documents (AI notes vs featured docs)`  [INFERRED] [semantically similar]
  .claude/skills/architecture-decision/SKILL.md → AGENTS.md
- `KernelRow` --references--> `tsKernels`  [EXTRACTED]
  apps/editor/src/lib/downscale.oracle-parity.test.ts → packages/core/src-ts/ts-core.ts
- `Infinite Canvas pattern` --conceptually_related_to--> `PixelForge IA (AGENTS.md overview)`  [INFERRED]
  apps/editor/src/sprites/features/canvas/README.md → AGENTS.md
- `NEXT_PUBLIC_EDITOR_URL var` --conceptually_related_to--> `PixelForge IA (AGENTS.md overview)`  [INFERRED]
  apps/landing/README.md → AGENTS.md
- `Sound editor capabilities` --conceptually_related_to--> `PixelForge IA (AGENTS.md overview)`  [INFERRED]
  PRODUCT.md → AGENTS.md

## Import Cycles
- 4-file cycle: `apps/editor/src/lib/core/core-config.ts -> apps/editor/src/lib/core/pixel-core.ts -> apps/editor/src/lib/core/ts-core.ts -> apps/editor/src/lib/core/kernels.ts -> apps/editor/src/lib/core/core-config.ts`
- 5-file cycle: `apps/editor/src/lib/core/core-config.ts -> apps/editor/src/lib/core/wasm-pixel-core-resolver.ts -> apps/editor/src/lib/core/pixel-core.ts -> apps/editor/src/lib/core/ts-core.ts -> apps/editor/src/lib/core/kernels.ts -> apps/editor/src/lib/core/core-config.ts`

## Hyperedges (group relationships)
- **Rust/Wasm core CI quality gates** — _github_workflows_ci_rust_core_job, _github_workflows_ci_wasm_size_budget, _github_workflows_ci_drift_check, _github_workflows_ci_cargo_deny_check [EXTRACTED 0.95]
- **design-agent -> frontend-agent -> cleancode-agent pipeline** — agents_design_agent_ref, agents_frontend_agent_ref, agents_cleancode_agent_ref, _claude_agents_frontend_agent_frontendagent, _claude_agents_clean_code_agent_cleancodeagent [EXTRACTED 0.95]
- **Rust domain modules -> bindings.rs -> wasm-pack pkg/ build pipeline** — docs_architecture_svg_rust_document_rs, docs_architecture_svg_rust_history_rs, docs_architecture_svg_rust_pixels_mod_rs, docs_architecture_svg_rust_flood_fill_rs, docs_architecture_svg_rust_quantize_rs, docs_architecture_svg_rust_downscale_rs, docs_architecture_svg_rust_bindings_rs, docs_architecture_svg_wasm_pack_pkg [EXTRACTED 1.00]
- **Two-Seam Wasm Boundary Architecture** — openspec_changes_migrate_to_rust_core_design_pixelkernels_interface, openspec_changes_migrate_to_rust_core_design_document_struct, openspec_changes_migrate_to_rust_core_design_d5_two_seams [EXTRACTED 1.00]
- **Judgment-Day Review and Fix Cycle** — openspec_changes_migrate_to_rust_core_tasks_judgment_day_process, openspec_changes_migrate_to_rust_core_design_command_undoability_decision, packages_core_learning_trap_poisons_object [INFERRED 0.75]
- **DocumentRepository port with IndexedDB (default) and Supabase (planned) adapters** — docs_architecture_svg_documentrepository_port, docs_architecture_svg_indexeddb_adapter, docs_architecture_svg_supabase_planned, docs_adr_0006_indexeddb_persistence_port_doc [INFERRED 0.85]
- **PixelCore port & adapters seam (TsPixelCore / WasmPixelCore / PixelKernels)** — docs_architecture_svg_pixelcore_port, docs_architecture_svg_tspixelcore, docs_architecture_svg_wasmpixelcore, docs_architecture_svg_pixelkernels [INFERRED 0.85]
- **Discovering the Real Wasm Boundary Performance Cost** — packages_core_learning_wasm_bindgen_copy_mechanism, packages_core_learning_scanline_rewrite_note, openspec_changes_migrate_to_rust_core_baseline_bench_phase5f_scanline_result [INFERRED 0.85]
- **Granular Zustand selector convention enforced across agents** — _claude_agents_frontend_agent_zustand_granular_selectors, _claude_agents_clean_code_agent_zustand_granular_selectors, _claude_agents_zustand_agent_granular_selector_pattern, _claude_agents_rules_agent_core_rules [INFERRED 0.85]

## Communities (202 total, 71 thin omitted)

### Community 0 - "document.rs"
Cohesion: 0.06
Nodes (73): HashMap, History, HistoryEntry, bounded_capacity(), clamp_rect_to_buffer(), decode_names(), Direction, dirty_and_evicted_of() (+65 more)

### Community 1 - "DeleteAccountDialog.tsx"
Cohesion: 0.11
Nodes (20): DeleteAccountDialog(), DeleteAccountDialogProps, getFocusable(), useDeleteAccountDialog(), EditorLayout(), useEditorLayout(), ModalPortal(), ModalPortalProps (+12 more)

### Community 2 - "core/ts-core.ts"
Cohesion: 0.05
Nodes (78): unpackRgba(), DirtyRect, LayerRef, bytesOfFrame(), bytesOfSnapshot(), canRedo(), canUndo(), createHistory() (+70 more)

### Community 3 - "TimelineTracks.tsx"
Cohesion: 0.13
Nodes (18): VOLUME_RANGE, TRACK_COLOR, TRACK_KIND_ICON, TRACK_KIND_OPTIONS, AddTrackRow(), AddTrackRowProps, useAddTrackRow(), TimelineClip (+10 more)

### Community 4 - "useLayerPanel.hook.ts"
Cohesion: 0.14
Nodes (19): useLayerPanel(), CollapsibleSection(), CollapsibleSectionProps, useCollapsibleSection(), ColorPicker(), OpacitySlider(), OpacitySliderProps, PropertiesTab() (+11 more)

### Community 5 - "document.ts"
Cohesion: 0.06
Nodes (52): UseDeleteAccountDialogProps, DOCUMENT_AUTOSAVE_DEBOUNCE_MS, DOCUMENT_DB_NAME, DOCUMENT_DB_VERSION, DOCUMENT_STORE_NAME, LEGACY_SPRITE_EDITOR_STORAGE_KEY, LOCAL_DRAFT_DOCUMENT_ID, useDocumentPersistence() (+44 more)

### Community 6 - "constants/audio.ts"
Cohesion: 0.09
Nodes (33): ADSR_LIMITS, ADSR_VIEW, ELEVENLABS_API_TIMEOUT, FILTER_LIMITS, FILTER_TYPES, HZ_PER_KHZ, MAX_MUSIC_DURATION, MAX_REFERENCE_FILE_SIZE (+25 more)

### Community 7 - "mod.rs"
Cohesion: 0.08
Nodes (48): bounded_stack_handles_a_large_fully_connected_canvas_without_overflow(), does_not_leak_diagonally_four_connectivity_only(), empty(), fill_span_row(), fills_the_whole_canvas_from_any_seed(), flood_fill(), holes_are_preserved_maze_shape(), pixel_matches() (+40 more)

### Community 8 - "WasmDocument"
Cohesion: 0.08
Nodes (13): Box, DispatchResult, clone_buffer(), diff_rect(), downscale(), encode_dispatch_result(), extract_rect(), flood_fill() (+5 more)

### Community 9 - "src/types/index.ts"
Cohesion: 0.07
Nodes (44): SPRITE_EDITOR_CANVAS, SPRITE_EDITOR_DEFAULTS, SPRITE_EDITOR_TIMELINE, getDrawOffset(), renderPixelsToCanvas(), RenderPixelsToCanvasOptions, downloadCanvasAsPng(), exportFrameAsPng() (+36 more)

### Community 10 - "TweakPanel.tsx"
Cohesion: 0.12
Nodes (23): PERCENT_SCALE, DEFAULT_DECAY_SHARE, TWEAK_PARAMS, TWEAK_RANGES, TWEAK_SLIDER, applyTweak(), clamp(), fromPosition() (+15 more)

### Community 11 - "wasm-pixel-core.differential.fuzz.test.ts"
Cohesion: 0.08
Nodes (22): here, makeDoc(), pkgAvailable, pkgDir, RED, SCENARIOS, STROKE_POINTS, wasmJsPath (+14 more)

### Community 12 - "index.tsx"
Cohesion: 0.07
Nodes (39): CtaSection(), FeatureCard(), FeaturesSection(), Footer(), HeroSection(), LegalDocument(), Navbar(), PipelineSection() (+31 more)

### Community 13 - "sound-library.ts"
Cohesion: 0.06
Nodes (67): AI_KIND_OPTIONS, DEFAULT_SOUND_KIND, DUPLICATE_NAME_SUFFIX, ELEVENLABS_DEFAULT_VOICE_ID, FALLBACK_SOUND_NAME, LONG_DURATION_DECIMALS, LONG_DURATION_THRESHOLD_S, MINI_WAVE (+59 more)

### Community 14 - "slices.ts"
Cohesion: 0.04
Nodes (52): getPixelCoreEnvOverride(), Command, DispatchResult, FrameId, LayerId, LayerMetaPatch, ADR-0008, isPixelCoreImpl() (+44 more)

### Community 15 - "timeline-ops.ts"
Cohesion: 0.08
Nodes (54): DEFAULT_CLIP_GAIN_DB, DEFAULT_CLIP_SPEED, DEFAULT_TRACK_ID_PREFIX, DEFAULT_TRACK_KINDS, DEFAULT_TRACK_NAMES, DEFAULT_TRACK_VOLUME, GAIN_DB_MAX, GAIN_DB_MIN (+46 more)

### Community 16 - "devDependencies"
Cohesion: 0.05
Nodes (40): dependencies, lucide-react, next, @pixelforge/tokens, react, react-dom, devDependencies, babel-plugin-react-compiler (+32 more)

### Community 17 - "mascot-scene-state.ts"
Cohesion: 0.10
Nodes (33): AIR_BOLT_Y_OFFSET, CROUCH_HURTBOX_TOP_OFFSET_PX, DODGE_CLEARANCE_PX, DODGE_HOP_HEIGHT_PX, ENEMY_BOLT_OFFSCREEN_X, ENEMY_KNOCKBACK_PX, GROUND_BOLT_Y_OFFSET, GROUND_ENEMY (+25 more)

### Community 18 - "useCanvasInteraction.hook.ts"
Cohesion: 0.13
Nodes (31): SPRITE_EDITOR_KEYBOARD, SPRITE_EDITOR_VIEWPORT, screenToPixel(), CanvasArea(), CanvasOverlay(), useCanvasOverlay(), bresenhamLine(), KonvaPointerEvent (+23 more)

### Community 19 - "sound-timeline.slice.ts"
Cohesion: 0.19
Nodes (22): EMPTY_HISTORY, isSameSnapshot(), purgeAssetFromHistory(), pushHistory(), redoHistory(), TimelineHistory, undoHistory(), withoutAsset() (+14 more)

### Community 20 - "history.rs"
Cohesion: 0.15
Nodes (25): bytes_of_frame(), bytes_of_snapshot(), DocSnapshotRecord, entry_bytes(), eviction_drops_oldest_first_once_budget_exceeded(), eviction_enforces_max_entries(), eviction_never_drops_the_just_pushed_entry_even_if_it_alone_exceeds_budget(), FrameRecord (+17 more)

### Community 21 - "WasmPixelCore"
Cohesion: 0.14
Nodes (7): DispatchResult, FrameId, LayerId, clampRectToCanvas(), DecodedMeta, decodeNames(), WasmPixelCore

### Community 22 - "retro-diffusion-utils.ts"
Cohesion: 0.17
Nodes (16): RETRO_DIFFUSION_ANIMATION_STYLE_PREFIX, RETRO_DIFFUSION_ROUTE, estimateRetroDiffusionCost(), GenerateAnimationParams, generateAnimationWithRetroDiffusion(), generateSpriteWithRetroDiffusion(), postToRetroDiffusion(), CreateMethodToggleProps (+8 more)

### Community 23 - "constants/index.ts"
Cohesion: 0.07
Nodes (35): clampSize(), handler(), json(), NOTE: width/height are what was REQUESTED, which for an animation is the, RetroDiffusionApiResponse, stripDataUri(), ANIMATE_CHARACTER_MOTIONS, ANIMATE_OBJECT_MOTIONS (+27 more)

### Community 24 - "auth.service.ts"
Cohesion: 0.06
Nodes (45): App(), AuthForm(), AuthFormProps, SUBMIT_LABEL, SUBMITTING_LABEL, useAuthForm(), HEADING, LoginPage() (+37 more)

### Community 25 - "formatDuration"
Cohesion: 0.18
Nodes (12): formatDuration(), pad2(), Transport(), TransportProps, useWaveform(), Waveform(), WaveformProps, useWavePanel() (+4 more)

### Community 26 - "useTopBar.hook.ts"
Cohesion: 0.43
Nodes (7): SPRITE_DOCUMENT_DEFAULT_NAME, useTopBar(), useCanRedo(), useCanUndo(), useRedo(), useResetPanelSizes(), useUndo()

### Community 27 - "audio-engine.ts"
Cohesion: 0.09
Nodes (23): WAV_EXTENSION, MIX_EXPORT, TIMELINE_ERRORS, buffers, decodeFromUrl(), inflight, createAudioObjectUrl(), encodeWav() (+15 more)

### Community 28 - "src-ts/ts-core.ts"
Cohesion: 0.15
Nodes (25): buildPalette(), diffRect(), dist2(), dominantColor(), downscale(), DownscaleBucket, extractRect(), fillSpanRow() (+17 more)

### Community 29 - "PixelForge IA (AGENTS.md overview)"
Cohesion: 0.08
Nodes (27): cleancode-agent definition, test-agent (referenced), cleancode-agent (invoked when done), frontend-agent definition, Reference to clean-code-agent.md, Reference to frontend-agent.md, Reference to AGENTS.md as single source of truth, Reference to AGENTS.md build pipeline (+19 more)

### Community 30 - "useGeneratePanel.hook.ts"
Cohesion: 0.23
Nodes (10): ALPHA_TRANSPARENT_THRESHOLD, ASSET_TYPE_EXAMPLE_CHIPS, ASSET_TYPE_PROMPT_PLACEHOLDER, ASSET_TYPE_STYLE, isCanvasBlank(), isLayerDataBlank(), GeneratePanel(), GenerateResult (+2 more)

### Community 31 - "useSoundDetailHeader.hook.ts"
Cohesion: 0.19
Nodes (16): NAME_VISIBLE_TAIL_LENGTH, SOUND_NAME_MAX_LENGTH, getAssetKindLabel(), releaseObjectUrl(), splitNameForTruncation(), soundDragSession, clipUsageMessage(), buildMeta() (+8 more)

### Community 32 - "downscale.rs"
Cohesion: 0.16
Nodes (21): FnMut, alpha_127_vs_128_falls_on_opposite_sides_of_the_fallback_core_threshold(), BucketStats, build(), cell_range(), cell_range_never_overflows_for_u32_range_inputs_even_on_a_simulated_32_bit_width(), does_not_vanish_a_uniformly_semi_transparent_image(), dominant_color() (+13 more)

### Community 33 - "types/audio.ts"
Cohesion: 0.11
Nodes (29): ADSR_DEFAULTS, FILTER_DEFAULTS, GENERATION_HISTORY_LIMIT, MASTER_GAIN_DEFAULT, OSCILLATOR_DEFAULTS, NewAssetInput, SoundDetailHeader(), SoundDetailHeaderProps (+21 more)

### Community 34 - "useTipBar.hook.ts"
Cohesion: 0.19
Nodes (11): TIMELINE_TIPS, TIP_NOTICE_DURATION_MS, KeyChip(), KeyChipProps, ShortcutsPopover(), ShortcutsPopoverProps, TipBar(), TipBarProps (+3 more)

### Community 35 - "HueSlider.tsx"
Cohesion: 0.21
Nodes (9): COLOR_PICKER, HueSlider(), HueSliderProps, useHueSlider(), UseHueSliderParams, SaturationValueSquare(), SaturationValueSquareProps, useSaturationValueSquare() (+1 more)

### Community 36 - "scripts"
Cohesion: 0.07
Nodes (26): @changesets/cli, devDependencies, @changesets/cli, typescript, typescript, license, name, packageManager (+18 more)

### Community 37 - "mascot-scene.ts"
Cohesion: 0.17
Nodes (20): AIR_ENEMY, PARTICLE_BURST, PARTICLE_GRAVITY, PARTICLE_SPREAD_PX, PLATFORM, PLATFORM_Y, SQUASH_OFFSET_PX, SUBTITLE_BASELINE_Y (+12 more)

### Community 38 - "useSoundsStore"
Cohesion: 0.12
Nodes (24): DEFAULT_VOLUME, DELETE_SOUND_KEYS, SOUND_KIND_LABELS, useSoundEditorLayout(), LibrarySearch(), useLibrarySearch(), filterAssets(), getRowAssetId() (+16 more)

### Community 39 - "types/timeline-view.ts"
Cohesion: 0.10
Nodes (29): ALT_KEY, ALT_KEY_LABEL, MAC_PLATFORM_PATTERN, MOD_KEY, MOD_KEY_LABEL, ALT_KEYS, isMacPlatform(), modKeyLabel() (+21 more)

### Community 40 - "useDropZone.hook.ts"
Cohesion: 0.22
Nodes (11): IMPORT_ACCEPT, IMPORT_ALLOWED_EXTENSIONS, IMPORT_ALLOWED_MIME_TYPES, SOUND_LIBRARY_ERRORS, FILES_DRAG_TYPE, SOUND_DRAG_MIME, DropZone(), DropZoneProps (+3 more)

### Community 41 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, jsx, lib, moduleDetection, noEmit, paths, target, types (+13 more)

### Community 42 - "quantize.rs"
Cohesion: 0.24
Nodes (19): alpha_threshold_boundary_is_inclusive_on_the_high_side(), build(), build_palette(), Centroid, colors_zero_still_yields_one_centroid_not_zero(), dist2(), keeps_fully_transparent_pixels_transparent(), nearest() (+11 more)

### Community 43 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, colord, idb, konva, @pixelforge/core, react-dom, react-konva, react-router-dom (+13 more)

### Community 44 - "devDependencies"
Cohesion: 0.10
Nodes (21): devDependencies, babel-plugin-react-compiler, fake-indexeddb, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom, typescript (+13 more)

### Community 45 - "RgbaColor"
Cohesion: 0.36
Nodes (7): ColorSwatch(), ColorSwatchProps, useColorSwatch(), UseColorSwatchParams, UseColorSwatchReturn, PaletteSlice, RgbaColor

### Community 46 - "Inspector.tsx"
Cohesion: 0.14
Nodes (14): CREATE_METHODS, AssetTypeSelector(), AssetTypeSelectorProps, ICON_MAP, CreateMethodToggle(), ICON_MAP, CreateTab(), DrawPanel() (+6 more)

### Community 47 - "useSettingsPanel.hook.ts"
Cohesion: 0.17
Nodes (18): SettingsPanel(), useSettingsPanel(), UseSettingsPanelResult, API_KEY_HELP_URL, API_KEY_PROVIDER, API_KEY_SAVED_FEEDBACK_MS, ElevenLabsError, generateMusic() (+10 more)

### Community 48 - "quantize.ts"
Cohesion: 0.39
Nodes (8): QUANTIZE_DEFAULTS, buildPalette(), Centroid, dist2(), nearest(), quantizePixels(), saturation(), WeightedPoint

### Community 49 - "PixelKernels"
Cohesion: 0.05
Nodes (26): here, source, wasmPath, here, mazePool, uniformPool, wasmPath, here (+18 more)

### Community 50 - "core/package.json"
Cohesion: 0.10
Nodes (19): devDependencies, @types/node, typescript, vitest, exports, @types/node, typescript, vitest (+11 more)

### Community 51 - "useTimelineClip.hook.ts"
Cohesion: 0.29
Nodes (12): clipEnd(), collectSnapEdges(), snapThresholdSeconds(), snapTime(), snapClipMove(), DragOrigin, DragView, snapEdge() (+4 more)

### Community 52 - "5-phase scale-up plan (limits, persistence, segments, windowed export, virtualization)"
Cohesion: 0.12
Nodes (17): ADR 0006: DocumentRepository port + IndexedDB adapter, 5-phase scale-up plan (limits, persistence, segments, windowed export, virtualization), Triggers to resume scalability work, Chunking / segmentation, Cursor-based pagination, HTTP adaptive streaming (HLS, MPEG-DASH), List virtualization / windowing, LRU cache (+9 more)

### Community 53 - "compilerOptions"
Cohesion: 0.11
Nodes (18): esnext, compilerOptions, allowJs, esModuleInterop, isolatedModules, jsx, lib, module (+10 more)

### Community 54 - "focus-ring.ts"
Cohesion: 0.11
Nodes (25): DISABLED_STATE, FOCUS_RING, TONE_CLASSES, VariationCard(), VariationCardProps, DescribeWithAISection(), useDescribeWithAI(), ImportRow() (+17 more)

### Community 55 - "types/timeline.ts"
Cohesion: 0.14
Nodes (21): dbToGain(), effectiveGain(), hasSoloTrack(), buildMixGraph(), disposeMixGraph(), MixGraph, renderMix(), TimelinePlayer (+13 more)

### Community 56 - "ts-core.judgment-day-round3.test.ts"
Cohesion: 0.05
Nodes (44): DOCUMENT_SCHEMA_VERSION, packPoints(), packRgba(), RGBA_BYTE_SHIFT, timelineToDocumentPayload(), toStrokePoints, doc(), mkDoc() (+36 more)

### Community 57 - "tokens/package.json"
Cohesion: 0.11
Nodes (17): devDependencies, typescript, vitest, exports, ./colors, ./tokens.css, typescript, vitest (+9 more)

### Community 58 - "D6: Flat Rust API, No Serde Decision"
Cohesion: 0.20
Nodes (11): D5: Two Seams (PixelKernels/PixelCore) Decision, D6: Flat Rust API, No Serde Decision, D7: Wasm-Memory-Backed Views Decision, Rust Document Struct, PixelKernels Interface, Dirty-Pair Cache-Refresh Contract, Phase 4: packages/core Rust Scaffold, Hexagonal Split: Domain Module vs bindings.rs (+3 more)

### Community 59 - "bindings.rs (diagram node, only wasm-bindgen boundary)"
Cohesion: 0.22
Nodes (9): D9: pkg/ committed, CI drift check, packages/core/src Rust modules, bindings.rs (diagram node, only wasm-bindgen boundary), document.rs (diagram node), downscale.rs (diagram node), flood_fill.rs (diagram node), history.rs (diagram node), pixels/mod.rs (diagram node) (+1 more)

### Community 60 - "include"
Cohesion: 0.12
Nodes (15): compilerOptions, paths, plugins, target, exclude, extends, include, node_modules (+7 more)

### Community 61 - "useSpriteEditorStore"
Cohesion: 0.19
Nodes (25): getFrameAtClientX(), getFramesInViewportRange(), useTimelineBar(), useAnimationPlayback(), useAddFrame(), useClipboard(), useCommitTransformation(), useCopySelectedFrames() (+17 more)

### Community 62 - "delete-account/index.ts"
Cohesion: 0.40
Nodes (4): CORS_HEADERS, Envelope, fail(), respond()

### Community 63 - "quantize.oracle-parity.test.ts"
Cohesion: 0.07
Nodes (23): mockGetPixelCoreEnvOverride, coreEntryPath, coreRoot, KernelRow, kernelRows, pkgJsPath, require, wasmPath (+15 more)

### Community 64 - "audio-storage.service.ts"
Cohesion: 0.24
Nodes (6): AUDIO_STORAGE_BUCKET, buildFilePath(), generateId(), StorageError, uploadAudio(), UploadResult

### Community 65 - "ElevenLabs AI sound generation"
Cohesion: 0.15
Nodes (14): ElevenLabs integration bugs (music endpoint, duration, TTS model, body buffering), Vercel Functions (server-side key proxy), AI Setup & Usage guide, ElevenLabs AI sound generation, Retro Diffusion sprite/animation generation, apps/editor/api/ai/ functions, Response streaming, apps/editor/api/ai Vercel Functions proxy (diagram node) (+6 more)

### Community 66 - "assets.store.ts"
Cohesion: 0.12
Nodes (26): ANIMATION_HISTORY_LIMIT, ANIMATION_HISTORY_STORAGE_KEY, ANIMATION_PIPELINE_VERSION, GENERATION_HISTORY_LIMIT, GENERATION_HISTORY_STORAGE_KEY, isNonEmptyString(), isPngDataUri(), isPositiveFiniteNumber() (+18 more)

### Community 67 - "core.slice.real-trap.test.ts"
Cohesion: 0.22
Nodes (7): here, instances, pkgAvailable, pkgDir, ProbeWasmPixelCore, wasmJsPath, wasmPath

### Community 68 - "useEditorPrefsStore"
Cohesion: 0.11
Nodes (25): SPRITE_EDITOR_PALETTE, SPRITE_EDITOR_TOOLS, useCanvasSelection(), BottomToolbar(), useBottomToolbar(), ICON_MAP, ToolButton(), ToolButtonProps (+17 more)

### Community 69 - "Phase 1: Flatten Buffer + IndexedDB Persistence"
Cohesion: 0.22
Nodes (9): D12: Local-First Persistence ADR, D13: idb Library for IndexedDB, D1: Flat RGBA Buffer Decision, D2: Copy-on-Write Mutation Decision, D8: IndexedDB Persistence Decision, DocumentRepository Port, IndexedDbDocumentRepository Adapter, Local Draft Recovery Requirement (+1 more)

### Community 70 - "Phase 7: Rust Document/History"
Cohesion: 0.21
Nodes (13): Phase 7 Document/PixelCore Bench Result, D3: Core Owns Document Decision, Default Core Implementation Stays TS Decision, PixelCore Interface, TrapSafePixelCore, TsPixelCore, WasmPixelCore, PixelCore Interface Fallback Decision (+5 more)

### Community 71 - "edit-history Capability"
Cohesion: 0.17
Nodes (13): Every Document Mutation Is Undoable (Phase 2c), Command Union Type, D4: Dirty-Rect History Decision, DispatchResult, DispatchResult.structureChanged Field (Phase 7g), edit-history Capability, Dirty-Rect Patch History Decision, Bounded History Retention Requirement (+5 more)

### Community 72 - "build-wasm.mjs"
Cohesion: 0.15
Nodes (11): asLatin1, bytes, crateDir, finalBytes, here, offenders, relativeRustPaths, remapFlags (+3 more)

### Community 73 - "kernels.ts"
Cohesion: 0.13
Nodes (15): ensureWasmResolving(), getActiveKernels(), mockBase64ToNativePixels, mockGetPixelCoreEnvOverride, isWasmRuntimeError(), resetLoadFailureLogForTests(), resetRuntimeTrapDemotionForTests(), resolveKernels() (+7 more)

### Community 74 - "audio-engine.test.ts"
Cohesion: 0.33
Nodes (11): createMockAnalyserNode(), createMockAudioBuffer(), createMockBiquadFilterNode(), createMockBufferSourceNode(), createMockContextInstance(), createMockGainNode(), createMockOfflineInstance(), createMockOscillatorNode() (+3 more)

### Community 75 - "2026-10-11 — Resizing a sprite without losing its layers"
Cohesion: 0.18
Nodes (12): Deferred: scaling the sound editor to thousands of assets, AI notes README, Scalable assets in the browser - research notes, 2026-10-11 — Resizing a sprite without losing its layers, Decision and why, Lessons, Options and tradeoffs, Result (+4 more)

### Community 76 - "Phase 5: Rust Flood-Fill"
Cohesion: 0.21
Nodes (12): Phase 5 Flood-Fill Bench Result (2.3-2.6x, Target 3x Not Met), Phase 5f Scanline Bench Result (Ratio Narrows, Absolute Faster), Phase 6 Quantize/Downscale Bench Result, Scanline Span-Fill Rewrite (Phase 5f), Flood-Fill Performance Requirement, Phase 5: Rust Flood-Fill, Flat Table Replaces Per-Cell HashMap, No Recursion in Flood-Fill (Stack Overflow Risk) (+4 more)

### Community 77 - "color-utils.ts"
Cohesion: 0.26
Nodes (9): SPRITE_EDITOR_COLORS, hexToHsv(), hexToRgba(), hsvToHex(), getDrawOffset(), GridBackground(), GridBackgroundProps, renderCheckerboardToCanvas() (+1 more)

### Community 78 - "flood-fill.fuzz.test.ts"
Cohesion: 0.25
Nodes (4): here, pkgAvailable, SEEDS, wasmPath

### Community 79 - "sound-timeline.slice.test.ts"
Cohesion: 0.21
Nodes (9): DEFAULT_PROJECT_NAME, DEFAULT_PX_PER_SECOND, HISTORY_LIMIT, ZOOM_STEP, countClipsForAsset(), TimelineTopBar(), useTimelineTopBar(), selectCanRedo() (+1 more)

### Community 80 - "useCanvasSizePopover.hook.ts"
Cohesion: 0.38
Nodes (5): CANVAS_SIZE_AI_HINT, CANVAS_SIZE_OPTIONS, CanvasSizePopover(), ADR-0008, useCanvasSizePopover()

### Community 81 - "core/tsconfig.json"
Cohesion: 0.18
Nodes (10): compilerOptions, composite, outDir, exclude, extends, include, node_modules, ../../tsconfig.base.json (+2 more)

### Community 82 - "elevenlabs.ts"
Cohesion: 0.29
Nodes (7): ElevenLabsMode, handler(), isValidMode(), json(), proxyToElevenLabs(), RequestBody, VALID_MODES

### Community 83 - "Rust/Wasm core migration boundary"
Cohesion: 0.25
Nodes (9): cargo-deny advisories/bans/licenses check, packages/core/pkg drift check, CI job: packages/core (Rust/Wasm), Wasm gzip size budget (<150KB), Rust/Wasm core migration boundary, VITE_PIXEL_CORE runtime flag, Hexagonal ports & adapters (PixelCore, DocumentRepository), Roadmap (Supabase, Phaser.js scene builder, AWS publish) (+1 more)

### Community 85 - "installFakeDom"
Cohesion: 1.00
Nodes (3): installFakeDom(), makeFakeCanvas(), makeFakeCanvasContext()

### Community 86 - "motion.ts"
Cohesion: 0.11
Nodes (24): AccountDeletedNotice(), useAccountDeletedNotice(), ApiKeyField(), ApiKeyFieldProps, useApiKeyField(), UseApiKeyFieldResult, SettingsPanelProps, TIMELINE_THUMBNAIL_SIZE (+16 more)

### Community 87 - "wasm-document-core.test.ts"
Cohesion: 0.22
Nodes (7): setIdSeed(), baseDoc(), emptyBuffer(), freshDoc(), here, pkgAvailable, wasmPath

### Community 88 - "PixelForge Architecture Overview"
Cohesion: 0.19
Nodes (13): ADR 0001: Flat pixel buffer, copy-on-write per batch, ADR 0003: Dirty-rect patches for undo history, ADR 0004: Rust/Wasm boundary shape, ADR 0005: pnpm monorepo split, ADR 0007: Local-first persistence model, The monorepo and Rust/WebAssembly migration, explained simply, Study guide: moving the editor from Next.js to Vite, Vercel monorepos (Root Directory, Ignored Build Step) (+5 more)

### Community 89 - "WasmPixelCore (diagram node, behind flag)"
Cohesion: 0.31
Nodes (9): D7: Wasm linear-memory views, rebuilt per dispatch, WebAssembly JS<->Wasm boundary copy cost, src-ts/resolve-core.ts module, src-ts/wasm-core.ts module, PixelCore port (diagram node), PixelKernels (diagram node), TsPixelCore (diagram node, DEFAULT), wasm-pack -> pkg/ (diagram node) (+1 more)

### Community 90 - "ColorPicker.tsx"
Cohesion: 0.16
Nodes (18): rgbaToHex(), ColorInputs(), ColorInputsProps, useColorInputs(), UseColorInputsParams, ColorPalette(), useColorPalette(), ActiveColorType (+10 more)

### Community 91 - "DocumentRepository port (load/save/remove)"
Cohesion: 0.29
Nodes (7): DocumentRepository port (load/save/remove), D12: local-first, cloud sync deferred, document-persistence.controller.ts, indexeddb-document.repository.service.ts, DocumentRepository port, Local-first persistence, IndexedDB adapter (diagram node, DEFAULT)

### Community 92 - "pixel-core Capability"
Cohesion: 0.22
Nodes (9): Phase 0 TS Baseline Benchmarks, Rust/Wasm Core Migration Intent, pixel-core Capability, Full Canvas Repaint Performance Requirement, Implementation-Agnostic Pixel Operations Requirement, Lossless Pixel Round-Trip Requirement, Judgment-Day Blind-Judge Review Process, Phase 6: Rust Quantize/Downscale (+1 more)

### Community 93 - "ts-core.judgment-day-round2.test.ts"
Cohesion: 0.11
Nodes (21): SerializedFrame, SerializedLayer, frameToSerializedFrame(), layerToSerializedLayer(), BLUE, d(), makeFrame(), makeLayer() (+13 more)

### Community 94 - "workspace-build Capability"
Cohesion: 0.22
Nodes (9): D9: Commit pkg/, CI Rebuild-Diff Decision, Sound Editor Feature-Parity Checklist, Sprite Editor Feature-Parity Checklist, Commit pkg/ + CI Rebuild-Diff Decision, workspace-build Capability, Developer Experience Budgets Requirement, Independent App Deployment Requirement, Server-Side Secrets Stay Server-Side Requirement (+1 more)

### Community 95 - "0008 — Lossless canvas resize with a cut-strips undo entry"
Cohesion: 0.25
Nodes (7): 0008 — Lossless canvas resize with a cut-strips undo entry, Consequences, Context, Decision, Options considered, Performance budget / acceptance, Prior art

### Community 96 - "computeMascotSceneState"
Cohesion: 0.18
Nodes (16): MascotScene(), useMascotScene(), UseMascotSceneResult, clamp01(), computeAirDodgeOffset(), computeBolt(), computeEnemy(), computeLevelWipeY() (+8 more)

### Community 97 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, bench, build, dev, preview, test, test:watch, typecheck

### Community 98 - "useAssetsPanel.hook.ts"
Cohesion: 0.13
Nodes (19): ASSET_FOLDERS, ASSET_TYPES, animationSheetCache, sheetsById, downloadFromHref(), downloadJson(), AssetFolderTree(), AssetFolderTreeProps (+11 more)

### Community 99 - "tokens/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, composite, outDir, extends, include, **/*.ts, ../../tsconfig.base.json

### Community 100 - "check-bench.ts"
Cohesion: 0.32
Nodes (7): Benchmark, BenchResults, findByPrefix(), Group, groupTitle(), main(), Thresholds

### Community 101 - "useSaveIndicator.hook.ts"
Cohesion: 0.39
Nodes (6): SaveIndicator(), useSaveIndicator(), useIsPersistent(), useSaveError(), useSaveStatus(), SaveIndicator

### Community 102 - "src-ts/index.ts"
Cohesion: 0.10
Nodes (36): AnimationFrame, Command, DirtyRect, DocMetaSnapshot, DocReplaceFrameInput, DocSnapshot, DocumentFramePayload, DocumentLayerPayload (+28 more)

### Community 103 - "useSpriteEditorStore.hook.ts"
Cohesion: 0.19
Nodes (28): INSPECTOR_TABS, useBottomPanel(), useSpriteEditorLayout(), useCreateTab(), useInspector(), useBottomPanelHeight(), useBottomPanelTab(), useCreateAssetType() (+20 more)

### Community 104 - "Zustand store (diagram node)"
Cohesion: 0.25
Nodes (9): D10: packages/tokens source-exported, no build step, packages/tokens, apps/landing (diagram node), DocumentRepository port (diagram node), Hooks layer (diagram node), packages/tokens (diagram node), Supabase project sync (diagram node, planned), UI layer (diagram node) (+1 more)

### Community 105 - "ADR 0002: Single dispatch(cmd) seam; core owns the document"
Cohesion: 0.33
Nodes (6): ADR 0002: Single dispatch(cmd) seam; core owns the document, D4: dirty-rect before/after patches, stable-id addressing, core/commands.ts module, core/history.ts module, src-ts/ts-core.ts module, Dirty-rect, not deep-clone, undo history

### Community 106 - "wasm-bindgen Copy-In/Copy-Out Mechanism"
Cohesion: 0.33
Nodes (6): Phase 4 Wasm vs TS Kernel Bench (Near-Memcpy Loss), Phase 7g Store-Loop Bench Result (Wasm Slower Unbatched), Wasm Artifact Size Budget Requirement, Batching Amortizes the Fixed Per-Call Cost, Ownership & Borrowing (&[u8] vs Vec<u8>), wasm-bindgen Copy-In/Copy-Out Mechanism

### Community 107 - "Phased Migration Approach (0-7)"
Cohesion: 0.33
Nodes (6): core-parity-gate Capability, Phased Migration Approach (0-7), Baseline Benchmarks Recorded Before Porting, CI Enforces Tests Benchmarks and Drift Check, Parity Tests Gate Default Implementation, Phase 0: Gates (CI, Scripts, Characterization Tests)

### Community 108 - "Stage 6: Publishing to AWS (planned)"
Cohesion: 0.50
Nodes (4): Stage 4: Assets (planned), Stage 5: Game building (planned), Stage 6: Publishing to AWS (planned), Stage 7: Operations (planned)

### Community 109 - "useAnimateTab.hook.ts"
Cohesion: 0.18
Nodes (16): ANIMATE_CUSTOM_MOTION_PLACEHOLDER, ANIMATE_DEFAULT_MOTION_ID, ANIMATE_MOTIONS_BY_ASSET_TYPE, RETRO_DIFFUSION_CHARACTER_ANIMATION_PROMPT(), RETRO_DIFFUSION_MOTION_REJECTED_HINT, RETRO_DIFFUSION_OBJECT_ANIMATION_PROMPT(), SPRITE_ANIMATION, AnimateTab() (+8 more)

### Community 110 - "Granular selector golden rule"
Cohesion: 0.40
Nodes (5): Zustand granular selector check, Zustand granular selectors always, Core rules shared by both apps, Granular selector golden rule, Konva layer / Zustand store sync

### Community 111 - "editor/package.json"
Cohesion: 0.40
Nodes (4): license, name, private, version

### Community 112 - "constants/timeline-view.ts"
Cohesion: 0.07
Nodes (49): SNAP_GRID_SECONDS, ADD_TO_TIMELINE_KEY, CLIP_INSPECTOR, CLIP_KEY_SHORTCUTS, CLIP_WAVE, CLOCK_CENTISECONDS, GAIN_SMOOTHING_S, OPEN_SOUND_KEY (+41 more)

### Community 113 - "GoogleButton.tsx"
Cohesion: 0.50
Nodes (3): GoogleButton(), GoogleButtonProps, GoogleIcon()

### Community 114 - "mascot-city.ts"
Cohesion: 0.19
Nodes (15): computePlanePosition(), drawBuildingLayer(), drawBuildingWindows(), drawCityBackground(), drawGeometry(), drawPlane(), GEOMETRY_SHAPES, hashSeed() (+7 more)

### Community 115 - "--pf-* CSS custom properties"
Cohesion: 0.67
Nodes (4): DESIGN.md vs tokens.css conflict note, Violet accent reserved for AI surfaces, Four-step dark ladder color tokens, --pf-* CSS custom properties

### Community 116 - "/implementar command"
Cohesion: 0.50
Nodes (4): /implementar command, Reference to find-animation-opportunities skill, Reference to impeccable skill, mcp__pencil__* tools usage

### Community 117 - "D6: flat Rust API surface, u32 handles, no serde"
Cohesion: 0.50
Nodes (4): D6: flat Rust API surface, u32 handles, no serde, D6 elaboration: flat methods, u32 handles, rgba:u32, TsPixelCore adapter, WasmPixelCore adapter

### Community 119 - "zustand-agent definition"
Cohesion: 0.67
Nodes (3): Reference to zustand-agent.md, zustand-agent definition, zustand-agent reference

### Community 120 - "createEmptyBuffer"
Cohesion: 0.06
Nodes (67): TRANSPARENT_COLOR, makeFullBuffer(), DocReplaceFrameInput, applyEntry(), makeDoc(), StrokeState, makeDoc(), BucketStats (+59 more)

### Community 151 - "mascot-sprite.ts"
Cohesion: 0.12
Nodes (17): MASCOT_ARMS, MASCOT_COLORS, MASCOT_LEGS, MASCOT_SPRITE_SIZE, drawBlaster(), drawMascot(), FillRectCall, BlasterBoltState (+9 more)

### Community 165 - "vercel-functions-dev.ts"
Cohesion: 0.32
Nodes (5): Handler, METHODS_WITHOUT_BODY, readBody(), toWebRequest(), vercelFunctionsDev()

### Community 197 - "sprite-pipeline.ts"
Cohesion: 0.12
Nodes (30): AI_SPRITE_DEFAULT_SIZE, AI_SPRITE_SIZES, SPRITE_IMPORT_ACCEPT, SPRITE_IMPORT_DEFAULT_FRAMES, SPRITE_IMPORT_MAX_FRAMES, SPRITE_IMPORT_MIN_FRAMES, getActiveKernelsAsync(), base64ToNativePixels() (+22 more)

### Community 199 - "mascot-font.ts"
Cohesion: 0.21
Nodes (12): rgbaToString(), GLYPH_FONT, GLYPH_SIZE, GLYPH_SPACING, SUBTITLE_TEXT, TITLE_TEXT, drawGlyph(), drawGlyphGlow() (+4 more)

### Community 200 - "LibrarySidebar.tsx"
Cohesion: 0.13
Nodes (14): LIBRARY_FILTERS, SoundEditorLayout(), SoundDetail(), DeleteSoundDialog(), LibraryEmptyState(), LibraryEmptyStateProps, LibraryFilters(), useLibraryFilters() (+6 more)

### Community 202 - "LeftSidebar.tsx"
Cohesion: 0.24
Nodes (7): LeftSidebar(), useLeftSidebar(), LayerItem(), LayerItemProps, useLayerItem(), UseLayerItemProps, LayerPanel()

### Community 204 - "TimelineEditor.tsx"
Cohesion: 0.15
Nodes (14): MAX_PX_PER_SECOND, MIN_PX_PER_SECOND, ZOOM_SLIDER_STEP_PX, deleteClip(), isTimeInsideClip(), ClipInspector(), useClipInspector(), TimelineEditor() (+6 more)

### Community 212 - "colors.test.ts"
Cohesion: 0.40
Nodes (3): COLORS, tokensCss, tokensCssPath

## Ambiguous Edges - Review These
- `ADR 0004: Rust/Wasm boundary shape` → `src-ts/resolve-core.ts module`  [AMBIGUOUS]
  docs/adr/0004-rust-wasm-boundary-shape.md · relation: references

## Knowledge Gaps
- **660 isolated node(s):** `DeleteAccountDialogProps`, `UseDeleteAccountDialogProps`, `HEADING`, `SUBTEXT`, `SUBMIT_LABEL` (+655 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 871 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **71 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `ADR 0004: Rust/Wasm boundary shape` and `src-ts/resolve-core.ts module`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `FOCUS_RING` connect `focus-ring.ts` to `DeleteAccountDialog.tsx`, `TimelineTracks.tsx`, `useLayerPanel.hook.ts`, `constants/audio.ts`, `TweakPanel.tsx`, `auth.service.ts`, `formatDuration`, `useSoundDetailHeader.hook.ts`, `types/audio.ts`, `useTipBar.hook.ts`, `HueSlider.tsx`, `useDropZone.hook.ts`, `Inspector.tsx`, `types/timeline.ts`, `sprite-pipeline.ts`, `LibrarySidebar.tsx`, `LeftSidebar.tsx`, `TimelineEditor.tsx`, `sound-timeline.slice.test.ts`, `useCanvasSizePopover.hook.ts`, `motion.ts`, `ColorPicker.tsx`, `useAssetsPanel.hook.ts`, `useAnimateTab.hook.ts`, `constants/timeline-view.ts`, `GoogleButton.tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `useSoundsStore` connect `useSoundsStore` to `TimelineTracks.tsx`, `constants/audio.ts`, `TweakPanel.tsx`, `sound-library.ts`, `timeline-ops.ts`, `sound-timeline.slice.ts`, `formatDuration`, `audio-engine.ts`, `useSoundDetailHeader.hook.ts`, `types/audio.ts`, `useTipBar.hook.ts`, `types/timeline-view.ts`, `useDropZone.hook.ts`, `useTimelineClip.hook.ts`, `focus-ring.ts`, `LibrarySidebar.tsx`, `TimelineEditor.tsx`, `sound-timeline.slice.test.ts`, `constants/timeline-view.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `WasmPixelCore` connect `WasmPixelCore` to `src-ts/index.ts`, `wasm-pixel-core.differential.fuzz.test.ts`, `slices.ts`, `PixelCore`, `wasm-document-core.test.ts`, `ts-core.judgment-day-round3.test.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `DeleteAccountDialogProps`, `UseDeleteAccountDialogProps`, `HEADING` to the rest of the system?**
  _660 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `document.rs` be split into smaller, more focused modules?**
  _Cohesion score 0.062291757207011446 - nodes in this community are weakly interconnected._
- **Should `DeleteAccountDialog.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1103448275862069 - nodes in this community are weakly interconnected._